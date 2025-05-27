
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ClinicalSession, ClinicType, MeetingType, ShowStatus, ServiceType, RevenueSource, FinancialSummary, TimePeriod, FinancialSettings } from "@/types/finance";

const FinanceContext = createContext(null);

export const FinanceProvider = ({ children }) => {
  const [clinicalSessions, setClinicalSessions] = useState<ClinicalSession[]>([]);
  const [revenueSources, setRevenueSources] = useState<RevenueSource[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<TimePeriod>({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary>({
    totalRevenue: 0,
    totalClinicalCosts: 0,
    totalAdminCosts: 0,
    totalFixedOverheads: 0,
    totalExpenses: 0,
    grossProfit: 0,
    operatingProfit: 0,
    clinicalPayrollToRevenueRatio: 0,
    totalPayrollToRevenueRatio: 0,
    averageRevenuePerPatient: 0,
    averageCostPerClinicalUnit: 0,
  });
  const [settings, setSettings] = useState<FinancialSettings>({
    vatRate: 0.17,
    targetClinicalPayrollToRevenueRatio: 0.60,
    targetTotalPayrollToRevenueRatio: 0.80,
    bonusCsatThresholds: { level1: 85, level2: 90, level3: 95 },
    bonusNoShowThresholds: { level1: 15, level2: 10, level3: 5 },
    bonusHoursThresholds: { level1: 100, level2: 120, level3: 140 },
    bonusPercentageTiers: [
      { minPoints: 0, maxPoints: 30, percentage: 0 },
      { minPoints: 31, maxPoints: 60, percentage: 5 },
      { minPoints: 61, maxPoints: 90, percentage: 10 },
      { minPoints: 91, maxPoints: 100, percentage: 15 }
    ]
  });

  // Fetch clinical sessions data from Supabase
  const fetchClinicalSessions = async (): Promise<ClinicalSession[]> => {
    try {
      const { data, error } = await supabase
        .from('clinical_sessions')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (error) {
        console.error('Error fetching clinical sessions:', error);
        throw error;
      }

      console.log('Fetched clinical sessions from Supabase:', data);

      // Transform database rows to match our TypeScript interface
      const transformedSessions: ClinicalSession[] = data.map(row => ({
        id: row.id,
        staffId: row.staff_id,
        clinicType: row.clinic_type as ClinicType,
        meetingType: row.meeting_type as MeetingType,
        showStatus: row.show_status as ShowStatus,
        serviceAgeGroup: (row.service_age_group || 'Adult') as ServiceType,
        count: row.count,
        duration: row.duration,
        month: row.month,
        year: row.year,
      }));

      setClinicalSessions(transformedSessions);
      return transformedSessions;
    } catch (error) {
      console.error('Failed to fetch clinical sessions:', error);
      return [];
    }
  };

  // Fetch revenue sources
  const fetchRevenueSources = async () => {
    try {
      const { data, error } = await supabase
        .from('revenue_sources')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (error) {
        console.error('Error fetching revenue sources:', error);
        return;
      }

      const transformedRevenueSources: RevenueSource[] = data.map(row => ({
        id: row.id,
        name: row.name,
        quantity: row.quantity,
        ratePerUnit: row.rate_per_unit,
        month: row.month,
        year: row.year,
      }));

      setRevenueSources(transformedRevenueSources);
    } catch (error) {
      console.error('Failed to fetch revenue sources:', error);
    }
  };

  // Update financial summary (placeholder function)
  const updateFinancialSummary = () => {
    console.log('Financial summary update triggered');
    
    // Calculate current period revenue
    const currentRevenue = revenueSources
      .filter(source => source.month === currentPeriod.month && source.year === currentPeriod.year)
      .reduce((sum, source) => sum + (source.quantity * source.ratePerUnit), 0);

    // Basic calculation - this would be more complex in a real implementation
    const updatedSummary: FinancialSummary = {
      totalRevenue: currentRevenue,
      totalClinicalCosts: currentRevenue * 0.45, // Placeholder calculation
      totalAdminCosts: currentRevenue * 0.15, // Placeholder calculation
      totalFixedOverheads: currentRevenue * 0.20, // Placeholder calculation
      totalExpenses: currentRevenue * 0.80, // Placeholder calculation
      grossProfit: currentRevenue * 0.20, // Placeholder calculation
      operatingProfit: currentRevenue * 0.15, // Placeholder calculation
      clinicalPayrollToRevenueRatio: 0.45, // Placeholder calculation
      totalPayrollToRevenueRatio: 0.60, // Placeholder calculation
      averageRevenuePerPatient: currentRevenue / Math.max(clinicalSessions.length, 1),
      averageCostPerClinicalUnit: (currentRevenue * 0.45) / Math.max(clinicalSessions.length, 1),
    };

    setFinancialSummary(updatedSummary);
  };

  // Add a new clinical session
  const addClinicalSession = async (sessionData: Omit<ClinicalSession, "id">) => {
    try {
      console.log('Adding clinical session:', sessionData);
      
      const { data, error } = await supabase
        .from('clinical_sessions')
        .insert([{
          staff_id: sessionData.staffId,
          clinic_type: sessionData.clinicType,
          meeting_type: sessionData.meetingType,
          show_status: sessionData.showStatus,
          service_age_group: sessionData.serviceAgeGroup || 'Adult',
          count: sessionData.count,
          duration: sessionData.duration,
          month: sessionData.month,
          year: sessionData.year,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding clinical session:', error);
        throw error;
      }

      console.log('Successfully added clinical session:', data);

      // Transform the returned data to match our interface
      const newSession: ClinicalSession = {
        id: data.id,
        staffId: data.staff_id,
        clinicType: data.clinic_type as ClinicType,
        meetingType: data.meeting_type as MeetingType,
        showStatus: data.show_status as ShowStatus,
        serviceAgeGroup: (data.service_age_group || 'Adult') as ServiceType,
        count: data.count,
        duration: data.duration,
        month: data.month,
        year: data.year,
      };

      // Update local state
      setClinicalSessions(prev => [...prev, newSession]);
      
      // Trigger financial summary update
      setTimeout(() => {
        updateFinancialSummary();
      }, 100);

      return newSession;
    } catch (error) {
      console.error('Failed to add clinical session:', error);
      throw error;
    }
  };

  // Bulk import multiple clinical sessions
  const importClinicalSessions = async (sessionsData: Omit<ClinicalSession, "id">[]) => {
    try {
      console.log('Importing clinical sessions:', sessionsData);
      
      const transformedData = sessionsData.map(session => ({
        staff_id: session.staffId,
        clinic_type: session.clinicType,
        meeting_type: session.meetingType,
        show_status: session.showStatus,
        service_age_group: session.serviceAgeGroup || 'Adult',
        count: session.count,
        duration: session.duration,
        month: session.month,
        year: session.year,
      }));

      const { data, error } = await supabase
        .from('clinical_sessions')
        .insert(transformedData)
        .select();

      if (error) {
        console.error('Error importing clinical sessions:', error);
        throw error;
      }

      console.log('Successfully imported clinical sessions:', data);

      // Transform the returned data to match our interface
      const newSessions: ClinicalSession[] = data.map(row => ({
        id: row.id,
        staffId: row.staff_id,
        clinicType: row.clinic_type as ClinicType,
        meetingType: row.meeting_type as MeetingType,
        showStatus: row.show_status as ShowStatus,
        serviceAgeGroup: (row.service_age_group || 'Adult') as ServiceType,
        count: row.count,
        duration: row.duration,
        month: row.month,
        year: row.year,
      }));

      // Update local state
      setClinicalSessions(prev => [...prev, ...newSessions]);
      
      // Trigger financial summary update
      setTimeout(() => {
        updateFinancialSummary();
      }, 100);

      return newSessions;
    } catch (error) {
      console.error('Failed to import clinical sessions:', error);
      throw error;
    }
  };

  // Initialize data on mount
  useEffect(() => {
    fetchClinicalSessions();
    fetchRevenueSources();
  }, []);

  // Update financial summary when dependencies change
  useEffect(() => {
    updateFinancialSummary();
  }, [revenueSources, clinicalSessions, currentPeriod]);

  return (
    <FinanceContext.Provider value={{ 
      clinicalSessions, 
      revenueSources,
      currentPeriod,
      setCurrentPeriod,
      financialSummary,
      settings,
      fetchClinicalSessions, 
      fetchRevenueSources,
      addClinicalSession, 
      importClinicalSessions,
      updateFinancialSummary
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  return useContext(FinanceContext);
};
