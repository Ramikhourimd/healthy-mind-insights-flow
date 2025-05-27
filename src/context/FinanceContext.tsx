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
  ClinicalStaffWork,
  ClinicType,
  MeetingType,
  ShowStatus,
  ServiceType,
  StaffRole
} from "@/types/finance";

interface FinanceContextType {
  // Clinical Sessions
  clinicalSessions: ClinicalSession[];
  fetchClinicalSessions: () => Promise<ClinicalSession[]>;
  addClinicalSession: (sessionData: Omit<ClinicalSession, "id">) => Promise<ClinicalSession>;
  updateClinicalSession: (sessionData: ClinicalSession) => Promise<ClinicalSession>;
  deleteClinicalSession: (id: string) => Promise<void>;
  importClinicalSessions: (sessionsData: Omit<ClinicalSession, "id">[]) => Promise<ClinicalSession[]>;
  
  // Revenue Sources
  revenueSources: RevenueSource[];
  fetchRevenueSources: () => Promise<RevenueSource[]>;
  addRevenueSource: (revenueData: Omit<RevenueSource, "id">) => Promise<RevenueSource>;
  updateRevenueSource: (revenueData: RevenueSource) => Promise<RevenueSource>;
  deleteRevenueSource: (id: string) => Promise<void>;
  
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
  
  // Fixed Overheads
  fixedOverheads: FixedOverhead[];
  addFixedOverhead: (overheadData: Omit<FixedOverhead, "id">) => Promise<FixedOverhead>;
  updateFixedOverhead: (overheadData: FixedOverhead) => Promise<FixedOverhead>;
  deleteFixedOverhead: (id: string) => Promise<void>;
  
  // Admin Staff Financials
  adminStaffFinancials: AdminStaffFinancials[];
  addAdminStaff: (staffData: Omit<AdminStaffFinancials, "id">) => Promise<AdminStaffFinancials>;
  updateAdminStaff: (staffData: AdminStaffFinancials) => Promise<AdminStaffFinancials>;
  deleteAdminStaff: (id: string) => Promise<void>;
  
  // Time Period
  currentPeriod: TimePeriod;
  setCurrentPeriod: (period: TimePeriod) => void;
  
  // Financial Summary
  financialSummary: FinancialSummary;
  updateFinancialSummary: () => void;
  
  // Settings
  settings: FinancialSettings;
  updateSettings: (settings: FinancialSettings) => Promise<FinancialSettings>;
  
  // Loading state
  isLoading: boolean;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clinicalSessions, setClinicalSessions] = useState<ClinicalSession[]>([]);
  const [revenueSources, setRevenueSources] = useState<RevenueSource[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [clinicalStaffRates, setClinicalStaffRates] = useState<ClinicalStaffRates[]>([]);
  const [fixedOverheads, setFixedOverheads] = useState<FixedOverhead[]>([]);
  const [adminStaffFinancials, setAdminStaffFinancials] = useState<AdminStaffFinancials[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<TimePeriod>({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
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
    targetClinicalPayrollToRevenueRatio: 0.6,
    targetTotalPayrollToRevenueRatio: 0.75,
    bonusCsatThresholds: { level1: 0.8, level2: 0.85, level3: 0.9 },
    bonusNoShowThresholds: { level1: 0.15, level2: 0.1, level3: 0.05 },
    bonusHoursThresholds: { level1: 100, level2: 120, level3: 150 },
    bonusPercentageTiers: [
      { minPoints: 0, maxPoints: 60, percentage: 0 },
      { minPoints: 60, maxPoints: 80, percentage: 0.05 },
      { minPoints: 80, maxPoints: 100, percentage: 0.1 }
    ]
  });
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

  // Fetch clinical staff rates
  const fetchClinicalStaffRates = async (): Promise<ClinicalStaffRates[]> => {
    try {
      const { data, error } = await supabase
        .from('clinical_staff_rates')
        .select('*')
        .order('effective_date', { ascending: false });

      if (error) throw error;

      const transformedRates: ClinicalStaffRates[] = data.map((row) => ({
        id: row.id,
        staffId: row.staff_id,
        adult_intake_rate: row.adult_intake_rate,
        adult_follow_up_rate: row.adult_follow_up_rate,
        adult_no_show_intake_rate: row.adult_no_show_intake_rate,
        adult_no_show_follow_up_rate: row.adult_no_show_follow_up_rate,
        child_intake_rate: row.child_intake_rate,
        child_follow_up_rate: row.child_follow_up_rate,
        child_no_show_intake_rate: row.child_no_show_intake_rate,
        child_no_show_follow_up_rate: row.child_no_show_follow_up_rate,
        availability_retainer_rate: row.availability_retainer_rate,
        admin_rate: row.admin_rate,
        training_rate: row.training_rate,
        contract_type_identifier: row.contract_type_identifier,
        effective_date: row.effective_date
      }));

      console.log('Fetched clinical staff rates:', transformedRates);
      setClinicalStaffRates(transformedRates);
      return transformedRates;
    } catch (error) {
      console.error('Failed to fetch clinical staff rates:', error);
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

  // Update clinical session
  const updateClinicalSession = async (sessionData: ClinicalSession): Promise<ClinicalSession> => {
    try {
      const { data, error } = await supabase
        .from('clinical_sessions')
        .update({
          staff_id: sessionData.staffId,
          clinic_type: sessionData.clinicType,
          meeting_type: sessionData.meetingType,
          show_status: sessionData.showStatus,
          service_age_group: sessionData.serviceAgeGroup,
          count: sessionData.count,
          duration: sessionData.duration,
          month: sessionData.month,
          year: sessionData.year,
        })
        .eq('id', sessionData.id)
        .select()
        .single();

      if (error) throw error;

      const updatedSession: ClinicalSession = {
        id: data.id,
        staffId: data.staff_id,
        clinicType: data.clinic_type as ClinicType,
        meetingType: data.meeting_type as MeetingType,
        showStatus: data.show_status as ShowStatus,
        serviceAgeGroup: data.service_age_group as ServiceType,
        count: data.count,
        duration: data.duration,
        month: data.month,
        year: data.year,
      };

      setClinicalSessions(prev => prev.map(session => 
        session.id === sessionData.id ? updatedSession : session
      ));
      
      updateFinancialSummary();
      return updatedSession;
    } catch (error) {
      console.error('Failed to update clinical session:', error);
      throw error;
    }
  };

  // Delete clinical session
  const deleteClinicalSession = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('clinical_sessions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setClinicalSessions(prev => prev.filter(session => session.id !== id));
      updateFinancialSummary();
    } catch (error) {
      console.error('Failed to delete clinical session:', error);
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

  // Add revenue source
  const addRevenueSource = async (revenueData: Omit<RevenueSource, "id">): Promise<RevenueSource> => {
    try {
      const { data, error } = await supabase
        .from('revenue_sources')
        .insert([{
          name: revenueData.name,
          quantity: revenueData.quantity,
          rate_per_unit: revenueData.ratePerUnit,
          month: revenueData.month,
          year: revenueData.year,
        }])
        .select()
        .single();

      if (error) throw error;

      const newRevenue: RevenueSource = {
        id: data.id,
        name: data.name,
        quantity: data.quantity,
        ratePerUnit: data.rate_per_unit,
        month: data.month,
        year: data.year,
      };

      setRevenueSources(prev => [...prev, newRevenue]);
      updateFinancialSummary();
      return newRevenue;
    } catch (error) {
      console.error('Failed to add revenue source:', error);
      throw error;
    }
  };

  // Update revenue source
  const updateRevenueSource = async (revenueData: RevenueSource): Promise<RevenueSource> => {
    try {
      const { data, error } = await supabase
        .from('revenue_sources')
        .update({
          name: revenueData.name,
          quantity: revenueData.quantity,
          rate_per_unit: revenueData.ratePerUnit,
          month: revenueData.month,
          year: revenueData.year,
        })
        .eq('id', revenueData.id)
        .select()
        .single();

      if (error) throw error;

      const updatedRevenue: RevenueSource = {
        id: data.id,
        name: data.name,
        quantity: data.quantity,
        ratePerUnit: data.rate_per_unit,
        month: data.month,
        year: data.year,
      };

      setRevenueSources(prev => prev.map(revenue => 
        revenue.id === revenueData.id ? updatedRevenue : revenue
      ));
      updateFinancialSummary();
      return updatedRevenue;
    } catch (error) {
      console.error('Failed to update revenue source:', error);
      throw error;
    }
  };

  // Delete revenue source
  const deleteRevenueSource = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('revenue_sources')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRevenueSources(prev => prev.filter(revenue => revenue.id !== id));
      updateFinancialSummary();
    } catch (error) {
      console.error('Failed to delete revenue source:', error);
      throw error;
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
        role: data.role as StaffRole,
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
        role: data.role as StaffRole,
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
          effective_date: ratesData.effective_date,
          // Add required legacy fields with default values
          intake_session_rate: ratesData.adult_intake_rate || 0,
          follow_up_session_rate: ratesData.adult_follow_up_rate || 0,
          no_show_intake_rate: ratesData.adult_no_show_intake_rate || 0,
          no_show_follow_up_rate: ratesData.adult_no_show_follow_up_rate || 0,
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
      console.log('Added new staff rates:', newRates);
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
      console.log('Updated staff rates:', updatedRates);
      return updatedRates;
    } catch (error) {
      console.error('Failed to update staff rates:', error);
      throw error;
    }
  };

  const getStaffRates = async (staffId: string): Promise<ClinicalStaffRates | null> => {
    try {
      console.log('Getting staff rates for:', staffId);
      
      // First check local state
      const localRates = clinicalStaffRates.find(rates => rates.staffId === staffId);
      if (localRates) {
        console.log('Found rates in local state:', localRates);
        return localRates;
      }

      // If not found locally, fetch from database
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
          console.log('No rates found for staff:', staffId);
          return null;
        }
        throw error;
      }

      const rates = {
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

      console.log('Fetched rates from database:', rates);
      return rates;
    } catch (error) {
      console.error('Failed to get staff rates:', error);
      return null;
    }
  };

  // Fixed Overhead Functions
  const addFixedOverhead = async (overheadData: Omit<FixedOverhead, "id">): Promise<FixedOverhead> => {
    try {
      const { data, error } = await supabase
        .from('fixed_overheads')
        .insert([{
          name: overheadData.name,
          monthly_cost: overheadData.monthlyCost,
          month: overheadData.month,
          year: overheadData.year,
        }])
        .select()
        .single();

      if (error) throw error;

      const newOverhead: FixedOverhead = {
        id: data.id,
        name: data.name,
        monthlyCost: data.monthly_cost,
        month: data.month,
        year: data.year,
      };

      setFixedOverheads(prev => [...prev, newOverhead]);
      updateFinancialSummary();
      return newOverhead;
    } catch (error) {
      console.error('Failed to add fixed overhead:', error);
      throw error;
    }
  };

  const updateFixedOverhead = async (overheadData: FixedOverhead): Promise<FixedOverhead> => {
    try {
      const { data, error } = await supabase
        .from('fixed_overheads')
        .update({
          name: overheadData.name,
          monthly_cost: overheadData.monthlyCost,
          month: overheadData.month,
          year: overheadData.year,
        })
        .eq('id', overheadData.id)
        .select()
        .single();

      if (error) throw error;

      const updatedOverhead: FixedOverhead = {
        id: data.id,
        name: data.name,
        monthlyCost: data.monthly_cost,
        month: data.month,
        year: data.year,
      };

      setFixedOverheads(prev => prev.map(overhead => 
        overhead.id === overheadData.id ? updatedOverhead : overhead
      ));
      updateFinancialSummary();
      return updatedOverhead;
    } catch (error) {
      console.error('Failed to update fixed overhead:', error);
      throw error;
    }
  };

  const deleteFixedOverhead = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('fixed_overheads')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFixedOverheads(prev => prev.filter(overhead => overhead.id !== id));
      updateFinancialSummary();
    } catch (error) {
      console.error('Failed to delete fixed overhead:', error);
      throw error;
    }
  };

  // Admin Staff Functions
  const addAdminStaff = async (staffData: Omit<AdminStaffFinancials, "id">): Promise<AdminStaffFinancials> => {
    try {
      const { data, error } = await supabase
        .from('admin_staff_financials')
        .insert([{
          name: staffData.name,
          role: staffData.role,
          base_salary: staffData.baseSalary,
          commission: staffData.commission,
          month: staffData.month,
          year: staffData.year,
        }])
        .select()
        .single();

      if (error) throw error;

      const newStaff: AdminStaffFinancials = {
        id: data.id,
        name: data.name,
        role: data.role,
        baseSalary: data.base_salary,
        commission: data.commission,
        month: data.month,
        year: data.year,
      };

      setAdminStaffFinancials(prev => [...prev, newStaff]);
      updateFinancialSummary();
      return newStaff;
    } catch (error) {
      console.error('Failed to add admin staff:', error);
      throw error;
    }
  };

  const updateAdminStaff = async (staffData: AdminStaffFinancials): Promise<AdminStaffFinancials> => {
    try {
      const { data, error } = await supabase
        .from('admin_staff_financials')
        .update({
          name: staffData.name,
          role: staffData.role,
          base_salary: staffData.baseSalary,
          commission: staffData.commission,
          month: staffData.month,
          year: staffData.year,
        })
        .eq('id', staffData.id)
        .select()
        .single();

      if (error) throw error;

      const updatedStaff: AdminStaffFinancials = {
        id: data.id,
        name: data.name,
        role: data.role,
        baseSalary: data.base_salary,
        commission: data.commission,
        month: data.month,
        year: data.year,
      };

      setAdminStaffFinancials(prev => prev.map(staff => 
        staff.id === staffData.id ? updatedStaff : staff
      ));
      updateFinancialSummary();
      return updatedStaff;
    } catch (error) {
      console.error('Failed to update admin staff:', error);
      throw error;
    }
  };

  const deleteAdminStaff = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('admin_staff_financials')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAdminStaffFinancials(prev => prev.filter(staff => staff.id !== id));
      updateFinancialSummary();
    } catch (error) {
      console.error('Failed to delete admin staff:', error);
      throw error;
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
        role: row.role as StaffRole,
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

  // Fetch fixed overheads
  const fetchFixedOverheads = async (): Promise<FixedOverhead[]> => {
    try {
      const { data, error } = await supabase
        .from('fixed_overheads')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (error) throw error;

      const transformedOverheads: FixedOverhead[] = data.map((row) => ({
        id: row.id,
        name: row.name,
        monthlyCost: row.monthly_cost,
        month: row.month,
        year: row.year,
      }));

      setFixedOverheads(transformedOverheads);
      return transformedOverheads;
    } catch (error) {
      console.error('Failed to fetch fixed overheads:', error);
      return [];
    }
  };

  // Fetch admin staff financials
  const fetchAdminStaffFinancials = async (): Promise<AdminStaffFinancials[]> => {
    try {
      const { data, error } = await supabase
        .from('admin_staff_financials')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (error) throw error;

      const transformedStaff: AdminStaffFinancials[] = data.map((row) => ({
        id: row.id,
        name: row.name,
        role: row.role,
        baseSalary: row.base_salary,
        commission: row.commission,
        month: row.month,
        year: row.year,
      }));

      setAdminStaffFinancials(transformedStaff);
      return transformedStaff;
    } catch (error) {
      console.error('Failed to fetch admin staff financials:', error);
      return [];
    }
  };

  // Update settings
  const updateSettings = async (newSettings: FinancialSettings): Promise<FinancialSettings> => {
    try {
      // This would save to database if we had a settings table
      setSettings(newSettings);
      return newSettings;
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  };

  // Update financial summary function (placeholder)
  const updateFinancialSummary = () => {
    console.log('Financial summary update triggered');
    // This is a placeholder for now - would calculate based on current data
    const filteredRevenue = revenueSources.filter(
      source => source.month === currentPeriod.month && source.year === currentPeriod.year
    );
    const filteredOverheads = fixedOverheads.filter(
      overhead => overhead.month === currentPeriod.month && overhead.year === currentPeriod.year
    );
    const filteredAdminStaff = adminStaffFinancials.filter(
      staff => staff.month === currentPeriod.month && staff.year === currentPeriod.year
    );

    const totalRevenue = filteredRevenue.reduce((sum, source) => sum + (source.quantity * source.ratePerUnit), 0);
    const totalFixedOverheads = filteredOverheads.reduce((sum, overhead) => sum + overhead.monthlyCost, 0);
    const totalAdminCosts = filteredAdminStaff.reduce((sum, staff) => sum + staff.baseSalary + staff.commission, 0);
    const totalClinicalCosts = 0; // Would calculate from sessions and rates
    const totalExpenses = totalClinicalCosts + totalAdminCosts + totalFixedOverheads;
    const operatingProfit = totalRevenue - totalExpenses;

    const summary: FinancialSummary = {
      totalRevenue,
      totalClinicalCosts,
      totalAdminCosts,
      totalFixedOverheads,
      totalExpenses,
      grossProfit: totalRevenue - totalClinicalCosts,
      operatingProfit,
      clinicalPayrollToRevenueRatio: totalRevenue > 0 ? totalClinicalCosts / totalRevenue : 0,
      totalPayrollToRevenueRatio: totalRevenue > 0 ? (totalClinicalCosts + totalAdminCosts) / totalRevenue : 0,
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
    fetchClinicalStaffRates(); // Add this to fetch rates on mount
    fetchFixedOverheads();
    fetchAdminStaffFinancials();
  }, []);

  useEffect(() => {
    updateFinancialSummary();
  }, [clinicalSessions, revenueSources, fixedOverheads, adminStaffFinancials, currentPeriod]);

  const value: FinanceContextType = {
    clinicalSessions,
    fetchClinicalSessions,
    addClinicalSession,
    updateClinicalSession,
    deleteClinicalSession,
    importClinicalSessions,
    revenueSources,
    fetchRevenueSources,
    addRevenueSource,
    updateRevenueSource,
    deleteRevenueSource,
    staffMembers,
    addStaffMember,
    updateStaffMember,
    deleteStaffMember,
    clinicalStaffRates,
    addStaffRates,
    updateStaffRates,
    getStaffRates,
    fixedOverheads,
    addFixedOverhead,
    updateFixedOverhead,
    deleteFixedOverhead,
    adminStaffFinancials,
    addAdminStaff,
    updateAdminStaff,
    deleteAdminStaff,
    currentPeriod,
    setCurrentPeriod,
    financialSummary,
    updateFinancialSummary,
    settings,
    updateSettings,
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
