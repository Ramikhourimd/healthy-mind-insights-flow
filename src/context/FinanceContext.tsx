
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  ClinicalSession, 
  RevenueSource, 
  TimePeriod, 
  FinancialSummary,
  FinancialSettings,
  StaffMember,
  ClinicalStaffRates,
  AdminStaffFinancials,
  FixedOverhead,
  ClinicalStaffWork
} from "@/types/finance";

interface FinanceContextType {
  // Clinical Sessions
  clinicalSessions: ClinicalSession[];
  fetchClinicalSessions: () => Promise<ClinicalSession[]>;
  addClinicalSession: (sessionData: Omit<ClinicalSession, "id">) => Promise<ClinicalSession>;
  importClinicalSessions: (sessionsData: Omit<ClinicalSession, "id">[]) => Promise<ClinicalSession[]>;
  
  // Revenue Sources
  revenueSources: RevenueSource[];
  fetchRevenueSources: () => Promise<RevenueSource[]>;
  
  // Staff Management
  staffMembers: StaffMember[];
  addStaffMember: (staffData: Omit<StaffMember, "id">) => Promise<StaffMember>;
  updateStaffMember: (staffData: StaffMember) => Promise<StaffMember>;
  deleteStaffMember: (id: string) => Promise<void>;
  
  // Clinical Staff Rates
  clinicalStaffRates: ClinicalStaffRates[];
  addStaffRates: (ratesData: Omit<ClinicalStaffRates, "id">) => Promise<ClinicalStaffRates>;
  updateStaffRates: (ratesData: ClinicalStaffRates) => Promise<ClinicalStaffRates>;
  getStaffRates: (staffId: string) => Promise<ClinicalStaffRates | null>;
  
  // Time Period
  currentPeriod: TimePeriod;
  setCurrentPeriod: (period: TimePeriod) => void;
  
  // Financial Summary
  financialSummary: FinancialSummary | null;
  updateFinancialSummary: () => void;
  
  // Settings
  settings: FinancialSettings | null;
  
  // Loading state
  isLoading: boolean;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clinicalSessions, setClinicalSessions] = useState<ClinicalSession[]>([]);
  const [revenueSources, setRevenueSources] = useState<RevenueSource[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [clinicalStaffRates, setClinicalStaffRates] = useState<ClinicalStaffRates[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<TimePeriod>({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [settings, setSettings] = useState<FinancialSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
      const transformedSessions: ClinicalSession[] = data.map((row) => ({
        id: row.id,
        staffId: row.staff_id,
        clinicType: row.clinic_type,
        meetingType: row.meeting_type,
        showStatus: row.show_status,
        serviceAgeGroup: row.service_age_group || 'Adult',
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

  // Add a new clinical session
  const addClinicalSession = async (sessionData: Omit<ClinicalSession, "id">): Promise<ClinicalSession> => {
    try {
      console.log('Adding clinical session:', sessionData);
      const { data, error } = await supabase
        .from('clinical_sessions')
        .insert([
          {
            staff_id: sessionData.staffId,
            clinic_type: sessionData.clinicType,
            meeting_type: sessionData.meetingType,
            show_status: sessionData.showStatus,
            service_age_group: sessionData.serviceAgeGroup || 'Adult',
            count: sessionData.count,
            duration: sessionData.duration,
            month: sessionData.month,
            year: sessionData.year,
          },
        ])
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
        clinicType: data.clinic_type,
        meetingType: data.meeting_type,
        showStatus: data.show_status,
        serviceAgeGroup: data.service_age_group || 'Adult',
        count: data.count,
        duration: data.duration,
        month: data.month,
        year: data.year,
      };

      // Update local state
      setClinicalSessions((prev) => [...prev, newSession]);

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
  const importClinicalSessions = async (sessionsData: Omit<ClinicalSession, "id">[]): Promise<ClinicalSession[]> => {
    try {
      console.log('Importing clinical sessions:', sessionsData);

      const transformedData = sessionsData.map((session) => ({
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
      const newSessions: ClinicalSession[] = data.map((row) => ({
        id: row.id,
        staffId: row.staff_id,
        clinicType: row.clinic_type,
        meetingType: row.meeting_type,
        showStatus: row.show_status,
        serviceAgeGroup: row.service_age_group || 'Adult',
        count: row.count,
        duration: row.duration,
        month: row.month,
        year: row.year,
      }));

      // Update local state
      setClinicalSessions((prev) => [...prev, ...newSessions]);

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

  // Fetch revenue sources
  const fetchRevenueSources = async (): Promise<RevenueSource[]> => {
    try {
      const { data, error } = await supabase
        .from('revenue_sources')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (error) {
        console.error('Error fetching revenue sources:', error);
        throw error;
      }

      const transformedSources: RevenueSource[] = data.map((row) => ({
        id: row.id,
        name: row.name,
        quantity: row.quantity,
        ratePerUnit: row.rate_per_unit,
        month: row.month,
        year: row.year,
      }));

      setRevenueSources(transformedSources);
      return transformedSources;
    } catch (error) {
      console.error('Failed to fetch revenue sources:', error);
      return [];
    }
  };

  // Staff Management Functions
  const addStaffMember = async (staffData: Omit<StaffMember, "id">): Promise<StaffMember> => {
    try {
      const { data, error } = await supabase
        .from('staff_members')
        .insert([{
          name: staffData.name,
          role: staffData.role,
          start_date: staffData.startDate,
          end_date: staffData.endDate,
          active: staffData.active
        }])
        .select()
        .single();

      if (error) throw error;

      const newStaff: StaffMember = {
        id: data.id,
        name: data.name,
        role: data.role,
        startDate: data.start_date,
        endDate: data.end_date,
        active: data.active
      };

      setStaffMembers(prev => [...prev, newStaff]);
      return newStaff;
    } catch (error) {
      console.error('Failed to add staff member:', error);
      throw error;
    }
  };

  const updateStaffMember = async (staffData: StaffMember): Promise<StaffMember> => {
    try {
      const { data, error } = await supabase
        .from('staff_members')
        .update({
          name: staffData.name,
          role: staffData.role,
          start_date: staffData.startDate,
          end_date: staffData.endDate,
          active: staffData.active
        })
        .eq('id', staffData.id)
        .select()
        .single();

      if (error) throw error;

      const updatedStaff: StaffMember = {
        id: data.id,
        name: data.name,
        role: data.role,
        startDate: data.start_date,
        endDate: data.end_date,
        active: data.active
      };

      setStaffMembers(prev => prev.map(staff => 
        staff.id === staffData.id ? updatedStaff : staff
      ));
      return updatedStaff;
    } catch (error) {
      console.error('Failed to update staff member:', error);
      throw error;
    }
  };

  const deleteStaffMember = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('staff_members')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setStaffMembers(prev => prev.filter(staff => staff.id !== id));
    } catch (error) {
      console.error('Failed to delete staff member:', error);
      throw error;
    }
  };

  // Clinical Staff Rates Functions
  const addStaffRates = async (ratesData: Omit<ClinicalStaffRates, "id">): Promise<ClinicalStaffRates> => {
    try {
      const { data, error } = await supabase
        .from('clinical_staff_rates')
        .insert([{
          staff_id: ratesData.staffId,
          adult_intake_rate: ratesData.adult_intake_rate,
          adult_follow_up_rate: ratesData.adult_follow_up_rate,
          adult_no_show_intake_rate: ratesData.adult_no_show_intake_rate,
          adult_no_show_follow_up_rate: ratesData.adult_no_show_follow_up_rate,
          child_intake_rate: ratesData.child_intake_rate,
          child_follow_up_rate: ratesData.child_follow_up_rate,
          child_no_show_intake_rate: ratesData.child_no_show_intake_rate,
          child_no_show_follow_up_rate: ratesData.child_no_show_follow_up_rate,
          availability_retainer_rate: ratesData.availability_retainer_rate,
          admin_rate: ratesData.admin_rate,
          training_rate: ratesData.training_rate,
          contract_type_identifier: ratesData.contract_type_identifier,
          effective_date: ratesData.effective_date
        }])
        .select()
        .single();

      if (error) throw error;

      const newRates: ClinicalStaffRates = {
        id: data.id,
        staffId: data.staff_id,
        adult_intake_rate: data.adult_intake_rate,
        adult_follow_up_rate: data.adult_follow_up_rate,
        adult_no_show_intake_rate: data.adult_no_show_intake_rate,
        adult_no_show_follow_up_rate: data.adult_no_show_follow_up_rate,
        child_intake_rate: data.child_intake_rate,
        child_follow_up_rate: data.child_follow_up_rate,
        child_no_show_intake_rate: data.child_no_show_intake_rate,
        child_no_show_follow_up_rate: data.child_no_show_follow_up_rate,
        availability_retainer_rate: data.availability_retainer_rate,
        admin_rate: data.admin_rate,
        training_rate: data.training_rate,
        contract_type_identifier: data.contract_type_identifier,
        effective_date: data.effective_date
      };

      setClinicalStaffRates(prev => [...prev, newRates]);
      return newRates;
    } catch (error) {
      console.error('Failed to add staff rates:', error);
      throw error;
    }
  };

  const updateStaffRates = async (ratesData: ClinicalStaffRates): Promise<ClinicalStaffRates> => {
    try {
      const { data, error } = await supabase
        .from('clinical_staff_rates')
        .update({
          staff_id: ratesData.staffId,
          adult_intake_rate: ratesData.adult_intake_rate,
          adult_follow_up_rate: ratesData.adult_follow_up_rate,
          adult_no_show_intake_rate: ratesData.adult_no_show_intake_rate,
          adult_no_show_follow_up_rate: ratesData.adult_no_show_follow_up_rate,
          child_intake_rate: ratesData.child_intake_rate,
          child_follow_up_rate: ratesData.child_follow_up_rate,
          child_no_show_intake_rate: ratesData.child_no_show_intake_rate,
          child_no_show_follow_up_rate: ratesData.child_no_show_follow_up_rate,
          availability_retainer_rate: ratesData.availability_retainer_rate,
          admin_rate: ratesData.admin_rate,
          training_rate: ratesData.training_rate,
          contract_type_identifier: ratesData.contract_type_identifier,
          effective_date: ratesData.effective_date
        })
        .eq('id', ratesData.id)
        .select()
        .single();

      if (error) throw error;

      const updatedRates: ClinicalStaffRates = {
        id: data.id,
        staffId: data.staff_id,
        adult_intake_rate: data.adult_intake_rate,
        adult_follow_up_rate: data.adult_follow_up_rate,
        adult_no_show_intake_rate: data.adult_no_show_intake_rate,
        adult_no_show_follow_up_rate: data.adult_no_show_follow_up_rate,
        child_intake_rate: data.child_intake_rate,
        child_follow_up_rate: data.child_follow_up_rate,
        child_no_show_intake_rate: data.child_no_show_intake_rate,
        child_no_show_follow_up_rate: data.child_no_show_follow_up_rate,
        availability_retainer_rate: data.availability_retainer_rate,
        admin_rate: data.admin_rate,
        training_rate: data.training_rate,
        contract_type_identifier: data.contract_type_identifier,
        effective_date: data.effective_date
      };

      setClinicalStaffRates(prev => prev.map(rates => 
        rates.id === ratesData.id ? updatedRates : rates
      ));
      return updatedRates;
    } catch (error) {
      console.error('Failed to update staff rates:', error);
      throw error;
    }
  };

  const getStaffRates = async (staffId: string): Promise<ClinicalStaffRates | null> => {
    try {
      const { data, error } = await supabase
        .from('clinical_staff_rates')
        .select('*')
        .eq('staff_id', staffId)
        .order('effective_date', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found
          return null;
        }
        throw error;
      }

      return {
        id: data.id,
        staffId: data.staff_id,
        adult_intake_rate: data.adult_intake_rate,
        adult_follow_up_rate: data.adult_follow_up_rate,
        adult_no_show_intake_rate: data.adult_no_show_intake_rate,
        adult_no_show_follow_up_rate: data.adult_no_show_follow_up_rate,
        child_intake_rate: data.child_intake_rate,
        child_follow_up_rate: data.child_follow_up_rate,
        child_no_show_intake_rate: data.child_no_show_intake_rate,
        child_no_show_follow_up_rate: data.child_no_show_follow_up_rate,
        availability_retainer_rate: data.availability_retainer_rate,
        admin_rate: data.admin_rate,
        training_rate: data.training_rate,
        contract_type_identifier: data.contract_type_identifier,
        effective_date: data.effective_date
      };
    } catch (error) {
      console.error('Failed to get staff rates:', error);
      return null;
    }
  };

  // Fetch staff members
  const fetchStaffMembers = async (): Promise<StaffMember[]> => {
    try {
      const { data, error } = await supabase
        .from('staff_members')
        .select('*')
        .order('name');

      if (error) throw error;

      const transformedStaff: StaffMember[] = data.map((row) => ({
        id: row.id,
        name: row.name,
        role: row.role,
        startDate: row.start_date,
        endDate: row.end_date,
        active: row.active
      }));

      setStaffMembers(transformedStaff);
      return transformedStaff;
    } catch (error) {
      console.error('Failed to fetch staff members:', error);
      return [];
    }
  };

  // Update financial summary function (placeholder)
  const updateFinancialSummary = () => {
    console.log('Financial summary update triggered');
    // This is a placeholder for now - would calculate based on current data
    const summary: FinancialSummary = {
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
    };
    setFinancialSummary(summary);
  };

  // Effects to fetch data on mount
  useEffect(() => {
    fetchClinicalSessions();
    fetchRevenueSources();
    fetchStaffMembers();
  }, []);

  useEffect(() => {
    updateFinancialSummary();
  }, [clinicalSessions, revenueSources, currentPeriod]);

  const value: FinanceContextType = {
    clinicalSessions,
    fetchClinicalSessions,
    addClinicalSession,
    importClinicalSessions,
    revenueSources,
    fetchRevenueSources,
    staffMembers,
    addStaffMember,
    updateStaffMember,
    deleteStaffMember,
    clinicalStaffRates,
    addStaffRates,
    updateStaffRates,
    getStaffRates,
    currentPeriod,
    setCurrentPeriod,
    financialSummary,
    updateFinancialSummary,
    settings,
    isLoading,
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error("useFinance must be used within a FinanceProvider");
  }
  return context;
};
