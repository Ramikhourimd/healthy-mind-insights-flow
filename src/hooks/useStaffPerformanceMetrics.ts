
import { useState, useEffect } from "react";
import { useFinance } from "@/context/FinanceContext";
import { StaffPerformanceMetrics } from "@/types/finance";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useStaffPerformanceMetrics = () => {
  const { staffMembers, currentPeriod } = useFinance();
  const { toast } = useToast();
  
  const [performanceMetrics, setPerformanceMetrics] = useState<StaffPerformanceMetrics[]>([]);
  const [noShowRates, setNoShowRates] = useState<{[key: string]: number}>({});
  const [isLoading, setIsLoading] = useState(false);

  // Fetch performance metrics for current period
  const fetchPerformanceMetrics = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('staff_performance_metrics')
        .select('*')
        .eq('month', currentPeriod.month)
        .eq('year', currentPeriod.year);

      if (error) throw error;

      const formattedMetrics = (data || []).map(metric => ({
        id: metric.id,
        staffId: metric.staff_id,
        month: metric.month,
        year: metric.year,
        satisfactionScore: metric.satisfaction_score || undefined,
        availableHours: metric.available_hours,
      }));

      setPerformanceMetrics(formattedMetrics);
    } catch (error) {
      console.error("Error fetching performance metrics:", error);
      toast({
        title: "Error",
        description: "Failed to fetch performance metrics.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate no-show rates for all clinical staff
  const calculateNoShowRates = async () => {
    const clinicalStaff = staffMembers.filter(s => s.role === "Psychiatrist" || s.role === "CaseManager");
    const rates: {[key: string]: number} = {};

    for (const staff of clinicalStaff) {
      try {
        const { data: noShowRate } = await supabase
          .rpc('calculate_staff_no_show_rate', {
            p_staff_id: staff.id,
            p_month: currentPeriod.month,
            p_year: currentPeriod.year
          });
        rates[staff.id] = noShowRate || 0;
      } catch (error) {
        console.error(`Error calculating no-show rate for ${staff.name}:`, error);
        rates[staff.id] = 0;
      }
    }

    setNoShowRates(rates);
  };

  // Get metrics for a staff member
  const getMetricsForStaff = (staffId: string) => {
    return performanceMetrics.find(m => m.staffId === staffId);
  };

  // Save metrics to database
  const saveMetrics = async (staffId: string, field: 'satisfactionScore' | 'availableHours', value: number | undefined) => {
    try {
      const existingMetrics = getMetricsForStaff(staffId);

      const metricsData = {
        staff_id: staffId,
        month: currentPeriod.month,
        year: currentPeriod.year,
        satisfaction_score: field === 'satisfactionScore' ? value : (existingMetrics?.satisfactionScore || null),
        available_hours: field === 'availableHours' ? (value || 0) : (existingMetrics?.availableHours || 0),
      };

      if (existingMetrics) {
        const { error } = await supabase
          .from('staff_performance_metrics')
          .update(metricsData)
          .eq('id', existingMetrics.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('staff_performance_metrics')
          .insert(metricsData);

        if (error) throw error;
      }

      fetchPerformanceMetrics();
      
      toast({
        title: "Success",
        description: "Performance metrics updated successfully.",
      });
    } catch (error) {
      console.error("Error saving performance metrics:", error);
      toast({
        title: "Error",
        description: "Failed to save performance metrics.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchPerformanceMetrics();
    calculateNoShowRates();
  }, [currentPeriod, staffMembers]);

  return {
    performanceMetrics,
    noShowRates,
    isLoading,
    fetchPerformanceMetrics,
    getMetricsForStaff,
    saveMetrics,
    currentPeriod,
    staffMembers,
  };
};
