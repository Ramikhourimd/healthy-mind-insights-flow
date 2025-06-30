import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinance } from "@/context/FinanceContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { getSessionCost } from "@/utils/getSessionCost";
import { supabase } from "@/integrations/supabase/client";
import { ExpenseSummaryCard } from "@/components/expenses/ExpenseSummaryCard";
import { FixedOverheadsTab } from "@/components/expenses/FixedOverheadsTab";
import { AdminStaffTab } from "@/components/expenses/AdminStaffTab";
import ClinicalStaffTab from "@/components/expenses/ClinicalStaffTab";
import AdminHoursTab from "@/components/expenses/AdminHoursTab";
import { OverheadDialog } from "@/components/expenses/dialogs/OverheadDialog";
import { AdminStaffDialog } from "@/components/expenses/dialogs/AdminStaffDialog";
import type { AdminTrainingHours } from "@/types/finance";

const ExpensesPage: React.FC = () => {
  const { toast } = useToast();
  const { 
    fixedOverheads, 
    addFixedOverhead, 
    updateFixedOverhead, 
    deleteFixedOverhead, 
    currentPeriod, 
    financialSummary,
    clinicalSessions,
    staffMembers,
    clinicalStaffRates,
    adminStaffFinancials,
    addAdminStaff,
    updateAdminStaff,
    deleteAdminStaff,
    getStaffRates
  } = useFinance();
  
  // State for admin/training hours
  const [adminTrainingHours, setAdminTrainingHours] = useState<AdminTrainingHours[]>([]);
  
  // State for collapsible sections
  const [clinicalBreakdownOpen, setClinicalBreakdownOpen] = useState(false);
  const [adminBreakdownOpen, setAdminBreakdownOpen] = useState(false);
  const [overheadBreakdownOpen, setOverheadBreakdownOpen] = useState(false);
  const [staffDetailBreakdowns, setStaffDetailBreakdowns] = useState<{ [staffId: string]: boolean }>({});

  // Load admin/training hours from Supabase
  useEffect(() => {
    loadAdminTrainingHours();
  }, [currentPeriod]);

  const loadAdminTrainingHours = async () => {
    try {
      console.log(`Loading admin training hours for ${currentPeriod.month}/${currentPeriod.year}`);
      
      const { data, error } = await supabase
        .from('admin_training_hours')
        .select('*')
        .eq('month', currentPeriod.month)
        .eq('year', currentPeriod.year);

      if (error) throw error;

      const formattedData: AdminTrainingHours[] = data.map(item => ({
        id: item.id,
        staffId: item.staff_id,
        adminHours: Number(item.admin_hours),
        trainingHours: Number(item.training_hours),
        month: item.month,
        year: item.year
      }));

      setAdminTrainingHours(formattedData);
      console.log('Successfully loaded admin training hours:', formattedData);
    } catch (error) {
      console.error('Error loading admin training hours:', error);
    }
  };
  
  // Memoized filtered data
  const filteredData = useMemo(() => {
    const filteredOverheads = fixedOverheads.filter(
      overhead => overhead.month === currentPeriod.month && overhead.year === currentPeriod.year
    );

    const filteredAdminStaff = adminStaffFinancials.filter(
      staff => staff.month === currentPeriod.month && staff.year === currentPeriod.year
    );

    const filteredSessions = clinicalSessions.filter(
      session => session.month === currentPeriod.month && session.year === currentPeriod.year
    );

    const filteredAdminTrainingHours = adminTrainingHours.filter(
      hours => hours.month === currentPeriod.month && hours.year === currentPeriod.year
    );

    console.log(`Filtered data for ${currentPeriod.month}/${currentPeriod.year}:`);
    console.log('- Clinical sessions:', filteredSessions.length);
    console.log('- Admin staff:', filteredAdminStaff.length);
    console.log('- Fixed overheads:', filteredOverheads.length);
    console.log('- Admin/training hours entries:', filteredAdminTrainingHours.length);
    console.log('- Available clinical staff rates:', clinicalStaffRates.length);

    return {
      filteredOverheads,
      filteredAdminStaff,
      filteredSessions,
      filteredAdminTrainingHours
    };
  }, [fixedOverheads, adminStaffFinancials, clinicalSessions, adminTrainingHours, currentPeriod, clinicalStaffRates.length]);

  // Calculate clinical breakdown and admin/training hours costs
  const calculations = useMemo(() => {
    const { filteredSessions, filteredAdminTrainingHours } = filteredData;

    console.log('=== STARTING CALCULATIONS ===');
    console.log('Clinical staff rates available:', clinicalStaffRates);

    const clinicalBreakdown: { [staffId: string]: { 
      name: string; 
      sessions: any[]; 
      totalCost: number; 
      totalSessionCount: number;
      sessionTypeBreakdown: { [key: string]: { count: number; cost: number; rate: number } };
    } } = {};
    
    let totalCalculatedClinicalCosts = 0;

    // Calculate clinical session costs
    filteredSessions.forEach(session => {
      if (!clinicalBreakdown[session.staffId]) {
        const staffMember = staffMembers.find(s => s.id === session.staffId);
        clinicalBreakdown[session.staffId] = {
          name: staffMember ? staffMember.name : "Unknown Staff",
          sessions: [],
          totalCost: 0,
          totalSessionCount: 0,
          sessionTypeBreakdown: {}
        };
      }
      
      let staffRates = clinicalStaffRates.find(r => r.staffId === session.staffId);
      
      console.log(`Processing session for staff ${session.staffId} (${clinicalBreakdown[session.staffId].name}):`);
      console.log('- Session:', session);
      console.log('- Staff rates found:', staffRates);
      
      const sessionCost = getSessionCost(session, staffRates);
      console.log('- Calculated session cost:', sessionCost);
      
      if (sessionCost === 0 && !staffRates) {
        console.warn(`No rates found for staff: ${clinicalBreakdown[session.staffId].name} (${session.staffId})`);
        toast({
          title: "Missing Staff Rates",
          description: `No payment rates found for ${clinicalBreakdown[session.staffId].name}. Please add rates in Staff Management.`,
          variant: "destructive",
        });
      }
      
      const rate = (Number(session.count) || 0) > 0 ? sessionCost / (Number(session.count) || 1) : 0;
      const breakdownKey = `${session.meetingType} - ${session.showStatus}`;
      
      if (!clinicalBreakdown[session.staffId].sessionTypeBreakdown[breakdownKey]) {
        clinicalBreakdown[session.staffId].sessionTypeBreakdown[breakdownKey] = {
          count: 0,
          cost: 0,
          rate: rate
        };
      }
      
      clinicalBreakdown[session.staffId].sessionTypeBreakdown[breakdownKey].count += (Number(session.count) || 0);
      clinicalBreakdown[session.staffId].sessionTypeBreakdown[breakdownKey].cost += sessionCost;
      
      clinicalBreakdown[session.staffId].sessions.push({
        ...session,
        cost: sessionCost,
        rate: rate
      });
      clinicalBreakdown[session.staffId].totalCost += sessionCost;
      clinicalBreakdown[session.staffId].totalSessionCount += (Number(session.count) || 0);
      
      totalCalculatedClinicalCosts += sessionCost;
    });

    // Calculate admin/training hours costs with detailed logging
    let totalAdminTrainingCosts = 0;
    console.log('=== ADMIN/TRAINING HOURS CALCULATION ===');
    console.log('Filtered admin training hours:', filteredAdminTrainingHours);
    console.log('Available staff rates:', clinicalStaffRates);
    
    if (filteredAdminTrainingHours.length === 0) {
      console.warn('No admin/training hours found for current period');
    }
    
    filteredAdminTrainingHours.forEach(hours => {
      const staffRates = clinicalStaffRates.find(r => r.staffId === hours.staffId);
      const staffMember = staffMembers.find(s => s.id === hours.staffId);
      
      console.log(`Processing admin/training hours for staff ${hours.staffId} (${staffMember?.name}):`);
      console.log('- Hours data:', hours);
      console.log('- Staff rates:', staffRates);
      
      if (staffRates) {
        const adminCost = Number(hours.adminHours) * Number(staffRates.admin_rate || 0);
        const trainingCost = Number(hours.trainingHours) * Number(staffRates.training_rate || 0);
        const totalCost = adminCost + trainingCost;
        
        console.log(`- Admin cost: ${hours.adminHours} * ${staffRates.admin_rate} = ${adminCost}`);
        console.log(`- Training cost: ${hours.trainingHours} * ${staffRates.training_rate} = ${trainingCost}`);
        console.log(`- Total cost for this staff: ${totalCost}`);
        
        totalAdminTrainingCosts += totalCost;
      } else {
        console.warn(`No rates found for staff ${hours.staffId} (${staffMember?.name})`);
      }
    });
    
    // Calculate total admin costs without bonus
    const totalAdminCosts = filteredData.filteredAdminStaff.reduce((total, staff) => {
      return total + (Number(staff.baseSalary) || 0) + (Number(staff.commission) || 0);
    }, 0);
    
    console.log('=== CALCULATION RESULTS ===');
    console.log('Clinical breakdown calculated:', clinicalBreakdown);
    console.log('Total calculated clinical costs:', totalCalculatedClinicalCosts);
    console.log('Total admin/training costs:', totalAdminTrainingCosts);
    console.log('Total admin costs (without bonus):', totalAdminCosts);
    console.log('Financial summary clinical costs:', financialSummary?.totalClinicalCosts);
    
    const finalCalculations = {
      clinicalBreakdown,
      totalClinicalCosts: totalCalculatedClinicalCosts,
      totalAdminCosts: totalAdminCosts,
      totalFixedOverheads: financialSummary?.totalFixedOverheads || 0,
      totalAdminTrainingCosts,
      totalExpenses: (totalCalculatedClinicalCosts + totalAdminCosts + (financialSummary?.totalFixedOverheads || 0) + totalAdminTrainingCosts)
    };
    
    console.log('Final calculations object:', finalCalculations);
    
    return finalCalculations;
  }, [filteredData, staffMembers, clinicalStaffRates, financialSummary, toast]);

  // Dialog states
  const [isOverheadDialogOpen, setIsOverheadDialogOpen] = useState(false);
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [editingOverhead, setEditingOverhead] = useState<any>(null);
  const [editingAdminStaff, setEditingAdminStaff] = useState<any>(null);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IL', { 
      style: 'currency', 
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Toggle staff detail breakdown
  const toggleStaffDetailBreakdown = (staffId: string) => {
    setStaffDetailBreakdowns(prev => ({
      ...prev,
      [staffId]: !prev[staffId]
    }));
  };

  // Overhead handlers
  const handleAddNewOverhead = () => {
    setEditingOverhead(null);
    setIsOverheadDialogOpen(true);
  };

  const handleEditOverhead = (overhead: any) => {
    setEditingOverhead(overhead);
    setIsOverheadDialogOpen(true);
  };

  const handleDeleteOverhead = (id: string) => {
    if (confirm("Are you sure you want to delete this overhead expense?")) {
      deleteFixedOverhead(id);
    }
  };

  // Admin staff handlers
  const handleAddNewAdminStaff = () => {
    setEditingAdminStaff(null);
    setIsAdminDialogOpen(true);
  };

  const handleEditAdminStaff = (staff: any) => {
    setEditingAdminStaff(staff);
    setIsAdminDialogOpen(true);
  };

  const handleDeleteAdminStaff = async (id: string) => {
    if (confirm("Are you sure you want to delete this admin staff member?")) {
      await deleteAdminStaff(id);
    }
  };

  // Copy from previous month handlers
  const handleCopyOverheadsFromPreviousMonth = async () => {
    try {
      const prevMonth = currentPeriod.month === 1 ? 12 : currentPeriod.month - 1;
      const prevYear = currentPeriod.month === 1 ? currentPeriod.year - 1 : currentPeriod.year;

      const previousOverheads = fixedOverheads.filter(
        overhead => overhead.month === prevMonth && overhead.year === prevYear
      );

      if (previousOverheads.length === 0) {
        toast({
          title: "No Previous Data",
          description: `No fixed overheads found for ${new Date(prevYear, prevMonth - 1).toLocaleString('default', { month: 'long' })} ${prevYear}`,
          variant: "destructive",
        });
        return;
      }

      // Check if current month already has data
      const currentOverheads = filteredData.filteredOverheads;
      if (currentOverheads.length > 0) {
        if (!confirm("This will replace existing overhead data for the current month. Continue?")) {
          return;
        }
        // Delete existing overheads for current month
        for (const overhead of currentOverheads) {
          await deleteFixedOverhead(overhead.id);
        }
      }

      // Copy previous month's overheads to current month
      for (const overhead of previousOverheads) {
        await addFixedOverhead({
          name: overhead.name,
          monthlyCost: overhead.monthlyCost,
          month: currentPeriod.month,
          year: currentPeriod.year
        });
      }

      toast({
        title: "Success",
        description: `Copied ${previousOverheads.length} overhead items from previous month`,
      });
    } catch (error) {
      console.error('Error copying overheads from previous month:', error);
      toast({
        title: "Error",
        description: "Failed to copy overheads from previous month",
        variant: "destructive",
      });
    }
  };

  const handleCopyAdminStaffFromPreviousMonth = async () => {
    try {
      const prevMonth = currentPeriod.month === 1 ? 12 : currentPeriod.month - 1;
      const prevYear = currentPeriod.month === 1 ? currentPeriod.year - 1 : currentPeriod.year;

      const previousAdminStaff = adminStaffFinancials.filter(
        staff => staff.month === prevMonth && staff.year === prevYear
      );

      if (previousAdminStaff.length === 0) {
        toast({
          title: "No Previous Data",
          description: `No admin staff data found for ${new Date(prevYear, prevMonth - 1).toLocaleString('default', { month: 'long' })} ${prevYear}`,
          variant: "destructive",
        });
        return;
      }

      // Check if current month already has data
      const currentAdminStaff = filteredData.filteredAdminStaff;
      if (currentAdminStaff.length > 0) {
        if (!confirm("This will replace existing admin staff data for the current month. Continue?")) {
          return;
        }
        // Delete existing admin staff for current month
        for (const staff of currentAdminStaff) {
          await deleteAdminStaff(staff.id);
        }
      }

      // Copy previous month's admin staff to current month
      for (const staff of previousAdminStaff) {
        await addAdminStaff({
          name: staff.name,
          role: staff.role,
          baseSalary: staff.baseSalary,
          commission: staff.commission,
          month: currentPeriod.month,
          year: currentPeriod.year
        });
      }

      toast({
        title: "Success",
        description: `Copied ${previousAdminStaff.length} admin staff members from previous month`,
      });
    } catch (error) {
      console.error('Error copying admin staff from previous month:', error);
      toast({
        title: "Error",
        description: "Failed to copy admin staff from previous month",
        variant: "destructive",
      });
    }
  };

  // Add a refresh handler for when admin hours are updated
  const handleAdminHoursUpdate = () => {
    loadAdminTrainingHours();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Expense Management</h1>
          <p className="text-gray-500 mt-1">
            Manage expenses for {new Date(currentPeriod.year, currentPeriod.month - 1).toLocaleString('default', { month: 'long' })} {currentPeriod.year}
          </p>
        </div>
      </div>

      <Tabs defaultValue="summary" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="fixed">Fixed Overheads</TabsTrigger>
          <TabsTrigger value="clinical">Clinical Staff</TabsTrigger>
          <TabsTrigger value="admin">Administrative Staff</TabsTrigger>
          <TabsTrigger value="hours">Admin/Training Hours</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <ExpenseSummaryCard
            calculations={calculations}
            filteredData={filteredData}
            clinicalBreakdownOpen={clinicalBreakdownOpen}
            setClinicalBreakdownOpen={setClinicalBreakdownOpen}
            adminBreakdownOpen={adminBreakdownOpen}
            setAdminBreakdownOpen={setAdminBreakdownOpen}
            overheadBreakdownOpen={overheadBreakdownOpen}
            setOverheadBreakdownOpen={setOverheadBreakdownOpen}
            staffDetailBreakdowns={staffDetailBreakdowns}
            toggleStaffDetailBreakdown={toggleStaffDetailBreakdown}
            formatCurrency={formatCurrency}
          />
        </TabsContent>

        <TabsContent value="fixed">
          <FixedOverheadsTab
            filteredOverheads={filteredData.filteredOverheads}
            calculations={calculations}
            formatCurrency={formatCurrency}
            onAddNew={handleAddNewOverhead}
            onEdit={handleEditOverhead}
            onDelete={handleDeleteOverhead}
            onCopyFromPreviousMonth={handleCopyOverheadsFromPreviousMonth}
          />
        </TabsContent>

        <TabsContent value="clinical">
          <ClinicalStaffTab />
        </TabsContent>

        <TabsContent value="admin">
          <AdminStaffTab
            filteredAdminStaff={filteredData.filteredAdminStaff}
            calculations={calculations}
            formatCurrency={formatCurrency}
            onAddNew={handleAddNewAdminStaff}
            onEdit={handleEditAdminStaff}
            onDelete={handleDeleteAdminStaff}
            onCopyFromPreviousMonth={handleCopyAdminStaffFromPreviousMonth}
          />
        </TabsContent>

        <TabsContent value="hours">
          <AdminHoursTab key={`${currentPeriod.month}-${currentPeriod.year}`} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <OverheadDialog
        isOpen={isOverheadDialogOpen}
        onClose={() => setIsOverheadDialogOpen(false)}
        editingOverhead={editingOverhead}
        currentPeriod={currentPeriod}
        onAdd={addFixedOverhead}
        onUpdate={updateFixedOverhead}
      />

      <AdminStaffDialog
        isOpen={isAdminDialogOpen}
        onClose={() => setIsAdminDialogOpen(false)}
        editingStaff={editingAdminStaff}
        currentPeriod={currentPeriod}
        onAdd={addAdminStaff}
        onUpdate={updateAdminStaff}
      />
    </div>
  );
};

export default ExpensesPage;
