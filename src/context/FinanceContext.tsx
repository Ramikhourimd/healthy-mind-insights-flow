import React, { createContext, useContext, useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "../integrations/supabase/client";
import { useToast } from "../hooks/use-toast";
import {
  RevenueSource,
  StaffMember,
  ClinicalStaffWork,
  ClinicalStaffRates,
  AdminStaffFinancials,
  FixedOverhead,
  BonusMetrics,
  FinancialSettings,
  FinancialSummary,
  TimePeriod,
  ClinicalSession,
  ClinicType,
  MeetingType,
  ShowStatus,
} from "../types/finance";
import { getSessionCost } from "../utils/getSessionCost";

// Initial sample data for settings
const initialSettings: FinancialSettings = {
  vatRate: 0.17,
  targetClinicalPayrollToRevenueRatio: 0.55,
  targetTotalPayrollToRevenueRatio: 0.7,
  bonusCsatThresholds: {
    level1: 4.0,
    level2: 4.5,
    level3: 4.8,
  },
  bonusNoShowThresholds: {
    level1: 0.15,
    level2: 0.1,
    level3: 0.05,
  },
  bonusHoursThresholds: {
    level1: 120,
    level2: 150,
    level3: 180,
  },
  bonusPercentageTiers: [
    { minPoints: 0, maxPoints: 3, percentage: 0 },
    { minPoints: 4, maxPoints: 6, percentage: 0.05 },
    { minPoints: 7, maxPoints: 9, percentage: 0.1 },
  ],
};

// Define the context type
type FinanceContextType = {
  currentPeriod: TimePeriod;
  setCurrentPeriod: React.Dispatch<React.SetStateAction<TimePeriod>>;
  revenueSources: RevenueSource[];
  staffMembers: StaffMember[];
  clinicalStaffWork: ClinicalStaffWork[];
  clinicalStaffRates: ClinicalStaffRates[];
  adminStaffFinancials: AdminStaffFinancials[];
  fixedOverheads: FixedOverhead[];
  bonusMetrics: BonusMetrics[];
  clinicalSessions: ClinicalSession[];
  settings: FinancialSettings;
  financialSummary: FinancialSummary;
  addRevenueSource: (source: Omit<RevenueSource, "id">) => Promise<void>;
  updateRevenueSource: (source: RevenueSource) => Promise<void>;
  deleteRevenueSource: (id: string) => Promise<void>;
  addFixedOverhead: (overhead: Omit<FixedOverhead, "id">) => Promise<void>;
  updateFixedOverhead: (overhead: FixedOverhead) => Promise<void>;
  deleteFixedOverhead: (id: string) => Promise<void>;
  addClinicalSession: (sessionData: Omit<ClinicalSession, "id">) => Promise<string>;
  updateClinicalSession: (session: ClinicalSession) => Promise<void>;
  deleteClinicalSession: (id: string) => Promise<void>;
  addClinicalStaffWork: (work: Omit<ClinicalStaffWork, "id">) => Promise<void>;
  updateClinicalStaffWork: (work: ClinicalStaffWork) => Promise<void>;
  deleteClinicalStaffWork: (id: string) => Promise<void>;
  updateSettings: (newSettings: Partial<FinancialSettings>) => Promise<void>;
  calculateFinancialSummary: () => FinancialSummary;
  updateFinancialSummary: () => void;
  addStaffMember: (staff: Omit<StaffMember, "id">) => Promise<void>;
  updateStaffMember: (staff: StaffMember) => Promise<void>;
  deleteStaffMember: (id: string) => Promise<void>;
  addStaffRates: (rates: Omit<ClinicalStaffRates, "id">) => Promise<void>;
  updateStaffRates: (rates: ClinicalStaffRates) => Promise<void>;
  getStaffRates: (staffId: string) => Promise<ClinicalStaffRates | null>;
  addAdminStaff: (staff: Omit<AdminStaffFinancials, "id">) => Promise<void>;
  updateAdminStaff: (staff: AdminStaffFinancials) => Promise<void>;
  deleteAdminStaff: (id: string) => Promise<void>;
  isLoading: boolean;
};

// Create the context
const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

// Context provider component
export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentPeriod, setCurrentPeriod] = useState<TimePeriod>({
    month: 4,
    year: 2025,
  });
  const [revenueSources, setRevenueSources] = useState<RevenueSource[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [clinicalStaffWork, setClinicalStaffWork] = useState<
    ClinicalStaffWork[]
  >([]);
  const [clinicalStaffRates, setClinicalStaffRates] = useState<
    ClinicalStaffRates[]
  >([]);
  const [adminStaffFinancials, setAdminStaffFinancials] = useState<
    AdminStaffFinancials[]
  >([]);
  const [fixedOverheads, setFixedOverheads] = useState<FixedOverhead[]>([]);
  const [bonusMetrics, setBonusMetrics] = useState<BonusMetrics[]>([]);
  const [clinicalSessions, setClinicalSessions] = useState<ClinicalSession[]>([]);
  const [settings, setSettings] = useState<FinancialSettings>(initialSettings);
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
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load data on initial render and when period changes
  useEffect(() => {
    loadAllData();
  }, [currentPeriod]);

  // Load all data from Supabase
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadStaffMembers(),
        loadClinicalStaffRates(),
        loadClinicalStaffWork(),
        loadRevenueSources(),
        loadFixedOverheads(),
        loadAdminStaffFinancials(),
        loadFinancialSettings(),
        loadClinicalSessions(),
      ]);
      
      // Calculate the financial summary after loading all data
      const summary = calculateFinancialSummary();
      setFinancialSummary(summary);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load financial data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load clinical sessions from Supabase
  const loadClinicalSessions = async () => {
    try {
      const { data, error } = await supabase
        .from("clinical_sessions")
        .select("*")
        .eq("month", currentPeriod.month)
        .eq("year", currentPeriod.year)
        .order("created_at");

      if (error) throw error;

      if (data) {
        const mappedSessions: ClinicalSession[] = data.map(item => ({
          id: item.id,
          staffId: item.staff_id,
          clinicType: item.clinic_type as ClinicType,
          meetingType: item.meeting_type as MeetingType,
          showStatus: item.show_status as ShowStatus,
          count: item.count,
          duration: item.duration,
          month: item.month,
          year: item.year,
        }));
        setClinicalSessions(mappedSessions);
        console.log("Loaded clinical sessions:", mappedSessions);
      }
    } catch (error) {
      console.error("Error loading clinical sessions:", error);
    }
  };

  // Load staff members from Supabase
  const loadStaffMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("staff_members")
        .select("*")
        .order("name");

      if (error) throw error;

      if (data) {
        const mappedStaff: StaffMember[] = data.map(item => ({
          id: item.id,
          name: item.name,
          role: item.role as "Psychiatrist" | "CaseManager" | "Admin",
          startDate: item.start_date || undefined,
          endDate: item.end_date || undefined,
          active: item.active,
        }));
        setStaffMembers(mappedStaff);
      }
    } catch (error) {
      console.error("Error loading staff members:", error);
    }
  };

  // Load clinical staff rates from Supabase
  const loadClinicalStaffRates = async () => {
    try {
      const { data, error } = await supabase
        .from("clinical_staff_rates")
        .select("*")
        .order("effective_date", { ascending: false });

      if (error) throw error;

      if (data) {
        const mappedRates: ClinicalStaffRates[] = data.map(item => ({
          id: item.id,
          staffId: item.staff_id,
          adult_intake_rate: Number(item.adult_intake_rate),
          adult_follow_up_rate: Number(item.adult_follow_up_rate),
          adult_no_show_intake_rate: Number(item.adult_no_show_intake_rate),
          adult_no_show_follow_up_rate: Number(item.adult_no_show_follow_up_rate),
          child_intake_rate: Number(item.child_intake_rate),
          child_follow_up_rate: Number(item.child_follow_up_rate),
          child_no_show_intake_rate: Number(item.child_no_show_intake_rate),
          child_no_show_follow_up_rate: Number(item.child_no_show_follow_up_rate),
          availability_retainer_rate: Number(item.availability_retainer_rate),
          admin_rate: Number(item.admin_rate),
          training_rate: Number(item.training_rate),
          effective_date: item.effective_date,
          contract_type_identifier: item.contract_type_identifier,
        }));
        setClinicalStaffRates(mappedRates);
      }
    } catch (error) {
      console.error("Error loading clinical staff rates:", error);
    }
  };

  // Load clinical staff work from Supabase
  const loadClinicalStaffWork = async () => {
    try {
      const { data, error } = await supabase
        .from("clinical_staff_work")
        .select("*")
        .eq("month", currentPeriod.month)
        .eq("year", currentPeriod.year)
        .order("created_at");

      if (error) throw error;

      if (data) {
        const mappedWork: ClinicalStaffWork[] = data.map(item => ({
          id: item.id,
          staffId: item.staff_id,
          month: item.month,
          year: item.year,
          intakesCompleted: item.intakes_completed,
          followUpUnitsCompleted: item.follow_up_units_completed,
          noShowHours: Number(item.no_show_hours),
          availabilityRetainerHours: Number(item.availability_retainer_hours),
          adminHours: Number(item.admin_hours),
          trainingHours: Number(item.training_hours),
          quarterlyGrossFees: Number(item.quarterly_gross_fees),
        }));
        setClinicalStaffWork(mappedWork);
      }
    } catch (error) {
      console.error("Error loading clinical staff work:", error);
    }
  };

  // Load revenue sources from Supabase
  const loadRevenueSources = async () => {
    try {
      const { data, error } = await supabase
        .from("revenue_sources")
        .select("*")
        .eq("month", currentPeriod.month)
        .eq("year", currentPeriod.year);

      if (error) throw error;

      if (data) {
        const mappedSources: RevenueSource[] = data.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          ratePerUnit: Number(item.rate_per_unit),
          month: item.month,
          year: item.year,
        }));
        setRevenueSources(mappedSources);
      }
    } catch (error) {
      console.error("Error loading revenue sources:", error);
    }
  };

  // Load fixed overheads from Supabase
  const loadFixedOverheads = async () => {
    try {
      const { data, error } = await supabase
        .from("fixed_overheads")
        .select("*")
        .eq("month", currentPeriod.month)
        .eq("year", currentPeriod.year);

      if (error) throw error;

      if (data) {
        const mappedOverheads: FixedOverhead[] = data.map(item => ({
          id: item.id,
          name: item.name,
          monthlyCost: Number(item.monthly_cost),
          month: item.month,
          year: item.year,
        }));
        setFixedOverheads(mappedOverheads);
      }
    } catch (error) {
      console.error("Error loading fixed overheads:", error);
    }
  };

  // Load admin staff financials from Supabase
  const loadAdminStaffFinancials = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_staff_financials")
        .select("*")
        .eq("month", currentPeriod.month)
        .eq("year", currentPeriod.year)
        .order("name");

      if (error) throw error;

      if (data) {
        const mappedAdminStaff: AdminStaffFinancials[] = data.map(item => ({
          id: item.id,
          name: item.name,
          role: item.role,
          baseSalary: Number(item.base_salary),
          commission: Number(item.commission),
          month: item.month,
          year: item.year,
        }));
        setAdminStaffFinancials(mappedAdminStaff);
      }
    } catch (error) {
      console.error("Error loading admin staff financials:", error);
    }
  };

  // Load financial settings from Supabase
  const loadFinancialSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("financial_settings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const item = data[0];
        const loadedSettings: FinancialSettings = {
          vatRate: Number(item.vat_rate),
          targetClinicalPayrollToRevenueRatio: Number(item.target_clinical_payroll_to_revenue_ratio),
          targetTotalPayrollToRevenueRatio: Number(item.target_total_payroll_to_revenue_ratio),
          bonusCsatThresholds: {
            level1: Number(item.bonus_csat_threshold_level1),
            level2: Number(item.bonus_csat_threshold_level2),
            level3: Number(item.bonus_csat_threshold_level3),
          },
          bonusNoShowThresholds: {
            level1: Number(item.bonus_no_show_threshold_level1),
            level2: Number(item.bonus_no_show_threshold_level2),
            level3: Number(item.bonus_no_show_threshold_level3),
          },
          bonusHoursThresholds: {
            level1: Number(item.bonus_hours_threshold_level1 || 120),
            level2: Number(item.bonus_hours_threshold_level2 || 150),
            level3: Number(item.bonus_hours_threshold_level3 || 180),
          },
          bonusPercentageTiers: initialSettings.bonusPercentageTiers, // Use initial tiers since they're not in DB
        };
        setSettings(loadedSettings);
      }
    } catch (error) {
      console.error("Error loading financial settings:", error);
    }
  };

  // CRUD functions for staff members
  const addStaffMember = async (staff: Omit<StaffMember, "id">) => {
    try {
      const { data, error } = await supabase
        .from("staff_members")
        .insert({
          name: staff.name,
          role: staff.role,
          start_date: staff.startDate,
          end_date: staff.endDate,
          active: staff.active
        })
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const newStaff: StaffMember = {
          id: data[0].id,
          name: data[0].name,
          role: data[0].role as "Psychiatrist" | "CaseManager" | "Admin",
          startDate: data[0].start_date || undefined,
          endDate: data[0].end_date || undefined,
          active: data[0].active,
        };
        
        setStaffMembers(prev => [...prev, newStaff]);
        
        toast({
          title: "Staff Added",
          description: `${staff.name} has been added to the staff list.`,
        });
      }
    } catch (error) {
      console.error("Error adding staff member:", error);
      toast({
        title: "Error",
        description: "Failed to add staff member",
        variant: "destructive",
      });
    }
  };

  const updateStaffMember = async (staff: StaffMember) => {
    try {
      const { error } = await supabase
        .from("staff_members")
        .update({
          name: staff.name,
          role: staff.role,
          start_date: staff.startDate,
          end_date: staff.endDate,
          active: staff.active,
          updated_at: new Date().toISOString()
        })
        .eq("id", staff.id);

      if (error) throw error;

      setStaffMembers(prev => prev.map(s => s.id === staff.id ? staff : s));
      
      toast({
        title: "Staff Updated",
        description: `${staff.name}'s information has been updated.`,
      });
    } catch (error) {
      console.error("Error updating staff member:", error);
      toast({
        title: "Error",
        description: "Failed to update staff member",
        variant: "destructive",
      });
    }
  };

  const deleteStaffMember = async (id: string) => {
    try {
      const { error } = await supabase
        .from("staff_members")
        .delete()
        .eq("id", id);

      if (error) throw error;

      const staffToDelete = staffMembers.find(s => s.id === id);
      setStaffMembers(prev => prev.filter(s => s.id !== id));
      
      if (staffToDelete) {
        toast({
          title: "Staff Removed",
          description: `${staffToDelete.name} has been removed from the staff list.`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error deleting staff member:", error);
      toast({
        title: "Error",
        description: "Failed to delete staff member",
        variant: "destructive",
      });
    }
  };

  // CRUD functions for clinical staff rates
  const addStaffRates = async (rates: Omit<ClinicalStaffRates, "id">) => {
    try {
      const { data, error } = await supabase
        .from("clinical_staff_rates")
        .insert({
          staff_id: rates.staffId,
          adult_intake_rate: rates.adult_intake_rate,
          adult_follow_up_rate: rates.adult_follow_up_rate,
          adult_no_show_intake_rate: rates.adult_no_show_intake_rate,
          adult_no_show_follow_up_rate: rates.adult_no_show_follow_up_rate,
          child_intake_rate: rates.child_intake_rate,
          child_follow_up_rate: rates.child_follow_up_rate,
          child_no_show_intake_rate: rates.child_no_show_intake_rate,
          child_no_show_follow_up_rate: rates.child_no_show_follow_up_rate,
          availability_retainer_rate: rates.availability_retainer_rate,
          admin_rate: rates.admin_rate,
          training_rate: rates.training_rate,
          contract_type_identifier: rates.contract_type_identifier,
          effective_date: rates.effective_date || new Date().toISOString(),
          // Legacy columns for backward compatibility
          intake_session_rate: rates.adult_intake_rate,
          follow_up_session_rate: rates.adult_follow_up_rate,
          no_show_intake_rate: rates.adult_no_show_intake_rate,
          no_show_follow_up_rate: rates.adult_no_show_follow_up_rate,
        })
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const newRates: ClinicalStaffRates = {
          id: data[0].id,
          staffId: data[0].staff_id,
          adult_intake_rate: Number(data[0].adult_intake_rate),
          adult_follow_up_rate: Number(data[0].adult_follow_up_rate),
          adult_no_show_intake_rate: Number(data[0].adult_no_show_intake_rate),
          adult_no_show_follow_up_rate: Number(data[0].adult_no_show_follow_up_rate),
          child_intake_rate: Number(data[0].child_intake_rate),
          child_follow_up_rate: Number(data[0].child_follow_up_rate),
          child_no_show_intake_rate: Number(data[0].child_no_show_intake_rate),
          child_no_show_follow_up_rate: Number(data[0].child_no_show_follow_up_rate),
          availability_retainer_rate: Number(data[0].availability_retainer_rate),
          admin_rate: Number(data[0].admin_rate),
          training_rate: Number(data[0].training_rate),
          effective_date: data[0].effective_date,
          contract_type_identifier: data[0].contract_type_identifier,
        };
        
        setClinicalStaffRates(prev => [...prev, newRates]);
        
        toast({
          title: "Rates Added",
          description: "Payment rates have been added.",
        });
      }
    } catch (error) {
      console.error("Error adding staff rates:", error);
      toast({
        title: "Error",
        description: "Failed to add staff rates",
        variant: "destructive",
      });
    }
  };

  const updateStaffRates = async (rates: ClinicalStaffRates) => {
    try {
      const { error } = await supabase
        .from("clinical_staff_rates")
        .update({
          staff_id: rates.staffId,
          adult_intake_rate: rates.adult_intake_rate,
          adult_follow_up_rate: rates.adult_follow_up_rate,
          adult_no_show_intake_rate: rates.adult_no_show_intake_rate,
          adult_no_show_follow_up_rate: rates.adult_no_show_follow_up_rate,
          child_intake_rate: rates.child_intake_rate,
          child_follow_up_rate: rates.child_follow_up_rate,
          child_no_show_intake_rate: rates.child_no_show_intake_rate,
          child_no_show_follow_up_rate: rates.child_no_show_follow_up_rate,
          availability_retainer_rate: rates.availability_retainer_rate,
          admin_rate: rates.admin_rate,
          training_rate: rates.training_rate,
          contract_type_identifier: rates.contract_type_identifier,
          updated_at: new Date().toISOString(),
          // Legacy columns for backward compatibility
          intake_session_rate: rates.adult_intake_rate,
          follow_up_session_rate: rates.adult_follow_up_rate,
          no_show_intake_rate: rates.adult_no_show_intake_rate,
          no_show_follow_up_rate: rates.adult_no_show_follow_up_rate,
        })
        .eq("id", rates.id);

      if (error) throw error;

      setClinicalStaffRates(prev => prev.map(r => r.id === rates.id ? rates : r));
      
      toast({
        title: "Rates Updated",
        description: "Payment rates have been updated.",
      });
    } catch (error) {
      console.error("Error updating staff rates:", error);
      toast({
        title: "Error",
        description: "Failed to update staff rates",
        variant: "destructive",
      });
    }
  };

  const getStaffRates = async (staffId: string): Promise<ClinicalStaffRates | null> => {
    try {
      // First check if we already have this staff's rates in state
      const existingRates = clinicalStaffRates.find(r => r.staffId === staffId);
      if (existingRates) return existingRates;
      
      // If not, try to fetch from Supabase
      const { data, error } = await supabase
        .from("clinical_staff_rates")
        .select("*")
        .eq("staff_id", staffId)
        .order("effective_date", { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        return {
          id: data[0].id,
          staffId: data[0].staff_id,
          adult_intake_rate: Number(data[0].adult_intake_rate || 600),
          adult_follow_up_rate: Number(data[0].adult_follow_up_rate || 450),
          adult_no_show_intake_rate: Number(data[0].adult_no_show_intake_rate || 300),
          adult_no_show_follow_up_rate: Number(data[0].adult_no_show_follow_up_rate || 225),
          child_intake_rate: Number(data[0].child_intake_rate || 600),
          child_follow_up_rate: Number(data[0].child_follow_up_rate || 450),
          child_no_show_intake_rate: Number(data[0].child_no_show_intake_rate || 300),
          child_no_show_follow_up_rate: Number(data[0].child_no_show_follow_up_rate || 225),
          availability_retainer_rate: Number(data[0].availability_retainer_rate || 150),
          admin_rate: Number(data[0].admin_rate || 250),
          training_rate: Number(data[0].training_rate || 250),
          effective_date: data[0].effective_date,
          contract_type_identifier: data[0].contract_type_identifier,
        };
      }
      
      // Return default rates if none exist
      return {
        id: `default-${staffId}`,
        staffId,
        adult_intake_rate: 600,
        adult_follow_up_rate: 450,
        adult_no_show_intake_rate: 300,
        adult_no_show_follow_up_rate: 225,
        child_intake_rate: 600,
        child_follow_up_rate: 450,
        child_no_show_intake_rate: 300,
        child_no_show_follow_up_rate: 225,
        availability_retainer_rate: 150,
        admin_rate: 250,
        training_rate: 250,
        effective_date: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error getting staff rates:", error);
      return null;
    }
  };

  // CRUD functions for revenue sources
  const addRevenueSource = async (source: Omit<RevenueSource, "id">) => {
    try {
      const { data, error } = await supabase
        .from("revenue_sources")
        .insert({
          name: source.name,
          quantity: source.quantity,
          rate_per_unit: source.ratePerUnit,
          month: source.month,
          year: source.year
        })
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const newSource: RevenueSource = {
          id: data[0].id,
          name: data[0].name,
          quantity: data[0].quantity,
          ratePerUnit: Number(data[0].rate_per_unit),
          month: data[0].month,
          year: data[0].year,
        };
        
        setRevenueSources(prev => [...prev, newSource]);
        setFinancialSummary(calculateFinancialSummary());
        
        toast({
          title: "Revenue Source Added",
          description: `${source.name} has been added.`,
        });
      }
    } catch (error) {
      console.error("Error adding revenue source:", error);
      toast({
        title: "Error",
        description: "Failed to add revenue source",
        variant: "destructive",
      });
    }
  };

  const updateRevenueSource = async (source: RevenueSource) => {
    try {
      const { error } = await supabase
        .from("revenue_sources")
        .update({
          name: source.name,
          quantity: source.quantity,
          rate_per_unit: source.ratePerUnit,
          month: source.month,
          year: source.year,
          updated_at: new Date().toISOString()
        })
        .eq("id", source.id);

      if (error) throw error;

      setRevenueSources(prev => prev.map(s => s.id === source.id ? source : s));
      setFinancialSummary(calculateFinancialSummary());
      
      toast({
        title: "Revenue Source Updated",
        description: `${source.name} has been updated.`,
      });
    } catch (error) {
      console.error("Error updating revenue source:", error);
      toast({
        title: "Error",
        description: "Failed to update revenue source",
        variant: "destructive",
      });
    }
  };

  const deleteRevenueSource = async (id: string) => {
    try {
      const { error } = await supabase
        .from("revenue_sources")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setRevenueSources(prev => prev.filter(s => s.id !== id));
      setFinancialSummary(calculateFinancialSummary());
      
      toast({
        title: "Revenue Source Deleted",
        description: "The revenue source has been removed.",
        variant: "destructive"
      });
    } catch (error) {
      console.error("Error deleting revenue source:", error);
      toast({
        title: "Error",
        description: "Failed to delete revenue source",
        variant: "destructive",
      });
    }
  };

  // CRUD functions for fixed overheads
  const addFixedOverhead = async (overhead: Omit<FixedOverhead, "id">) => {
    try {
      const { data, error } = await supabase
        .from("fixed_overheads")
        .insert({
          name: overhead.name,
          monthly_cost: overhead.monthlyCost,
          month: overhead.month,
          year: overhead.year
        })
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const newOverhead: FixedOverhead = {
          id: data[0].id,
          name: data[0].name,
          monthlyCost: Number(data[0].monthly_cost),
          month: data[0].month,
          year: data[0].year,
        };
        
        setFixedOverheads(prev => [...prev, newOverhead]);
        setFinancialSummary(calculateFinancialSummary());
        
        toast({
          title: "Fixed Overhead Added",
          description: `${overhead.name} has been added.`,
        });
      }
    } catch (error) {
      console.error("Error adding fixed overhead:", error);
      toast({
        title: "Error",
        description: "Failed to add fixed overhead",
        variant: "destructive",
      });
    }
  };

  const updateFixedOverhead = async (overhead: FixedOverhead) => {
    try {
      const { error } = await supabase
        .from("fixed_overheads")
        .update({
          name: overhead.name,
          monthly_cost: overhead.monthlyCost,
          month: overhead.month,
          year: overhead.year,
          updated_at: new Date().toISOString()
        })
        .eq("id", overhead.id);

      if (error) throw error;

      setFixedOverheads(prev => prev.map(o => o.id === overhead.id ? overhead : o));
      setFinancialSummary(calculateFinancialSummary());
      
      toast({
        title: "Fixed Overhead Updated",
        description: `${overhead.name} has been updated.`,
      });
    } catch (error) {
      console.error("Error updating fixed overhead:", error);
      toast({
        title: "Error",
        description: "Failed to update fixed overhead",
        variant: "destructive",
      });
    }
  };

  const deleteFixedOverhead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("fixed_overheads")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setFixedOverheads(prev => prev.filter(o => o.id !== id));
      setFinancialSummary(calculateFinancialSummary());
      
      toast({
        title: "Fixed Overhead Deleted",
        description: "The fixed overhead has been removed.",
        variant: "destructive"
      });
    } catch (error) {
      console.error("Error deleting fixed overhead:", error);
      toast({
        title: "Error",
        description: "Failed to delete fixed overhead",
        variant: "destructive",
      });
    }
  };

  // CRUD functions for admin staff financials
  const addAdminStaff = async (staff: Omit<AdminStaffFinancials, "id">) => {
    try {
      const { data, error } = await supabase
        .from("admin_staff_financials")
        .insert({
          name: staff.name,
          role: staff.role,
          base_salary: staff.baseSalary,
          commission: staff.commission,
          month: staff.month,
          year: staff.year
        })
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const newAdminStaff: AdminStaffFinancials = {
          id: data[0].id,
          name: data[0].name,
          role: data[0].role,
          baseSalary: Number(data[0].base_salary),
          commission: Number(data[0].commission),
          month: data[0].month,
          year: data[0].year,
        };
        
        setAdminStaffFinancials(prev => [...prev, newAdminStaff]);
        setFinancialSummary(calculateFinancialSummary());
        
        toast({
          title: "Admin Staff Added",
          description: `${staff.name} has been added.`,
        });
      }
    } catch (error) {
      console.error("Error adding admin staff:", error);
      toast({
        title: "Error",
        description: "Failed to add admin staff",
        variant: "destructive",
      });
    }
  };

  const updateAdminStaff = async (staff: AdminStaffFinancials) => {
    try {
      const { error } = await supabase
        .from("admin_staff_financials")
        .update({
          name: staff.name,
          role: staff.role,
          base_salary: staff.baseSalary,
          commission: staff.commission,
          month: staff.month,
          year: staff.year,
          updated_at: new Date().toISOString()
        })
        .eq("id", staff.id);

      if (error) throw error;

      setAdminStaffFinancials(prev => prev.map(s => s.id === staff.id ? staff : s));
      setFinancialSummary(calculateFinancialSummary());
      
      toast({
        title: "Admin Staff Updated",
        description: `${staff.name} has been updated.`,
      });
    } catch (error) {
      console.error("Error updating admin staff:", error);
      toast({
        title: "Error",
        description: "Failed to update admin staff",
        variant: "destructive",
      });
    }
  };

  const deleteAdminStaff = async (id: string) => {
    try {
      const { error } = await supabase
        .from("admin_staff_financials")
        .delete()
        .eq("id", id);

      if (error) throw error;

      const staffToDelete = adminStaffFinancials.find(s => s.id === id);
      setAdminStaffFinancials(prev => prev.filter(s => s.id !== id));
      setFinancialSummary(calculateFinancialSummary());
      
      if (staffToDelete) {
        toast({
          title: "Admin Staff Deleted",
          description: `${staffToDelete.name} has been removed.`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error deleting admin staff:", error);
      toast({
        title: "Error",
        description: "Failed to delete admin staff",
        variant: "destructive",
      });
    }
  };

  // CRUD functions for clinical staff work
  const addClinicalStaffWork = async (work: Omit<ClinicalStaffWork, "id">) => {
    try {
      const { data, error } = await supabase
        .from("clinical_staff_work")
        .insert({
          staff_id: work.staffId,
          month: work.month,
          year: work.year,
          intakes_completed: work.intakesCompleted,
          followUpUnitsCompleted: work.followUpUnitsCompleted,
          no_show_hours: work.noShowHours,
          availability_retainer_hours: work.availabilityRetainerHours,
          admin_hours: work.adminHours,
          training_hours: work.trainingHours,
          quarterly_gross_fees: work.quarterlyGrossFees
        })
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const newWork: ClinicalStaffWork = {
          id: data[0].id,
          staffId: data[0].staff_id,
          month: data[0].month,
          year: data[0].year,
          intakesCompleted: data[0].intakes_completed,
          followUpUnitsCompleted: data[0].follow_up_units_completed,
          noShowHours: Number(data[0].no_show_hours),
          availabilityRetainerHours: Number(data[0].availability_retainer_hours),
          adminHours: Number(data[0].admin_hours),
          trainingHours: Number(data[0].training_hours),
          quarterlyGrossFees: Number(data[0].quarterly_gross_fees),
        };
        
        setClinicalStaffWork(prev => [...prev, newWork]);
        
        toast({
          title: "Clinical Work Added",
          description: "Clinical staff work data has been added.",
        });
      }
    } catch (error) {
      console.error("Error adding clinical staff work:", error);
      toast({
        title: "Error",
        description: "Failed to add clinical staff work",
        variant: "destructive",
      });
    }
  };

  const updateClinicalStaffWork = async (work: ClinicalStaffWork) => {
    try {
      const { error } = await supabase
        .from("clinical_staff_work")
        .update({
          staff_id: work.staffId,
          month: work.month,
          year: work.year,
          intakes_completed: work.intakesCompleted,
          follow_up_units_completed: work.followUpUnitsCompleted,
          no_show_hours: work.noShowHours,
          availability_retainer_hours: work.availabilityRetainerHours,
          admin_hours: work.adminHours,
          training_hours: work.trainingHours,
          quarterly_gross_fees: work.quarterlyGrossFees,
          updated_at: new Date().toISOString()
        })
        .eq("id", work.id);

      if (error) throw error;

      setClinicalStaffWork(prev => prev.map(w => w.id === work.id ? work : w));
      
      toast({
        title: "Clinical Work Updated",
        description: "Clinical staff work data has been updated.",
      });
    } catch (error) {
      console.error("Error updating clinical staff work:", error);
      toast({
        title: "Error",
        description: "Failed to update clinical staff work",
        variant: "destructive",
      });
    }
  };

  const deleteClinicalStaffWork = async (id: string) => {
    try {
      const { error } = await supabase
        .from("clinical_staff_work")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setClinicalStaffWork(prev => prev.filter(w => w.id !== id));
      
      toast({
        title: "Clinical Work Deleted",
        description: "Clinical staff work data has been removed.",
        variant: "destructive"
      });
    } catch (error) {
      console.error("Error deleting clinical staff work:", error);
      toast({
        title: "Error",
        description: "Failed to delete clinical staff work",
        variant: "destructive",
      });
    }
  };

  // Update settings
  const updateSettings = async (newSettings: Partial<FinancialSettings>) => {
    try {
      // Merge with existing settings
      const updatedSettings = { ...settings, ...newSettings };
      
      // Convert to database format
      const dbSettings = {
        vat_rate: updatedSettings.vatRate,
        target_clinical_payroll_to_revenue_ratio: updatedSettings.targetClinicalPayrollToRevenueRatio,
        target_total_payroll_to_revenue_ratio: updatedSettings.targetTotalPayrollToRevenueRatio,
        bonus_csat_threshold_level1: updatedSettings.bonusCsatThresholds.level1,
        bonus_csat_threshold_level2: updatedSettings.bonusCsatThresholds.level2,
        bonus_csat_threshold_level3: updatedSettings.bonusCsatThresholds.level3,
        bonus_no_show_threshold_level1: updatedSettings.bonusNoShowThresholds.level1,
        bonus_no_show_threshold_level2: updatedSettings.bonusNoShowThresholds.level2,
        bonus_no_show_threshold_level3: updatedSettings.bonusNoShowThresholds.level3,
        bonus_hours_threshold_level1: updatedSettings.bonusHoursThresholds.level1,
        bonus_hours_threshold_level2: updatedSettings.bonusHoursThresholds.level2,
        bonus_hours_threshold_level3: updatedSettings.bonusHoursThresholds.level3
      };
      
      // Get the current settings
      const { data: existingSettings } = await supabase
        .from("financial_settings")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(1);
        
      if (existingSettings && existingSettings.length > 0) {
        // Update existing settings
        const { error } = await supabase
          .from("financial_settings")
          .update(dbSettings)
          .eq("id", existingSettings[0].id);
          
        if (error) throw error;
      } else {
        // Insert new settings
        const { error } = await supabase
          .from("financial_settings")
          .insert(dbSettings);
          
        if (error) throw error;
      }
      
      setSettings(updatedSettings);
      toast({
        title: "Settings Updated",
        description: "Financial settings have been updated.",
      });
    } catch (error) {
      console.error("Error updating settings:", error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  // For clinical sessions, we're still using local state
  const addClinicalSession = async (sessionData: Omit<ClinicalSession, "id">) => {
    try {
      console.log("Adding clinical session:", sessionData);
      
      const { data, error } = await supabase
        .from("clinical_sessions")
        .insert({
          staff_id: sessionData.staffId,
          clinic_type: sessionData.clinicType,
          meeting_type: sessionData.meetingType,
          show_status: sessionData.showStatus,
          count: sessionData.count,
          duration: sessionData.duration,
          month: sessionData.month,
          year: sessionData.year
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newSession: ClinicalSession = {
          id: data.id,
          staffId: data.staff_id,
          clinicType: data.clinic_type as ClinicType,
          meetingType: data.meeting_type as MeetingType,
          showStatus: data.show_status as ShowStatus,
          count: data.count,
          duration: data.duration,
          month: data.month,
          year: data.year,
        };
        
        setClinicalSessions(prev => [...prev, newSession]);
        
        // Update financial summary
        setTimeout(() => {
          const summary = calculateFinancialSummary();
          setFinancialSummary(summary);
        }, 50);
        
        console.log("Clinical session added successfully:", newSession);
        return data.id;
      }
    } catch (error) {
      console.error("Error adding clinical session:", error);
      toast({
        title: "Error",
        description: "Failed to add clinical session",
        variant: "destructive",
      });
      throw error;
    }
    return "";
  };

  const updateClinicalSession = async (session: ClinicalSession) => {
    try {
      const { error } = await supabase
        .from("clinical_sessions")
        .update({
          staff_id: session.staffId,
          clinic_type: session.clinicType,
          meeting_type: session.meetingType,
          show_status: session.showStatus,
          count: session.count,
          duration: session.duration,
          month: session.month,
          year: session.year,
          updated_at: new Date().toISOString()
        })
        .eq("id", session.id);

      if (error) throw error;

      setClinicalSessions(prev => prev.map(s => s.id === session.id ? session : s));
      
      toast({
        title: "Session Updated",
        description: "Clinical session has been updated.",
      });
    } catch (error) {
      console.error("Error updating clinical session:", error);
      toast({
        title: "Error",
        description: "Failed to update clinical session",
        variant: "destructive",
      });
    }
  };

  const deleteClinicalSession = async (id: string) => {
    try {
      const { error } = await supabase
        .from("clinical_sessions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setClinicalSessions(prev => prev.filter(s => s.id !== id));
      
      toast({
        title: "Session Deleted",
        description: "Clinical session has been removed.",
        variant: "destructive"
      });
    } catch (error) {
      console.error("Error deleting clinical session:", error);
      toast({
        title: "Error",
        description: "Failed to delete clinical session",
        variant: "destructive",
      });
    }
  };

  // Calculate financial summary with proper clinical staff costs
  const calculateFinancialSummary = () => {
    // Filter data for the current period
    const currentRevenueSources = revenueSources.filter(
      (source) =>
        source.month === currentPeriod.month &&
        source.year === currentPeriod.year
    );
    
    const currentOverheads = fixedOverheads.filter(
      (overhead) =>
        overhead.month === currentPeriod.month &&
        overhead.year === currentPeriod.year
    );

    const currentAdminStaff = adminStaffFinancials.filter(
      (staff) =>
        staff.month === currentPeriod.month &&
        staff.year === currentPeriod.year
    );

    const currentSessions = clinicalSessions.filter(
      (session) =>
        session.month === currentPeriod.month &&
        session.year === currentPeriod.year
    );

    // Calculate total revenue
    const totalRevenue = currentRevenueSources.reduce(
      (sum, source) => sum + source.quantity * source.ratePerUnit,
      0
    );

    // Calculate total fixed overheads
    const totalFixedOverheads = currentOverheads.reduce(
      (sum, overhead) => sum + overhead.monthlyCost,
      0
    );

    // Calculate total admin costs
    const totalAdminCosts = currentAdminStaff.reduce(
      (sum, staff) => sum + staff.baseSalary + staff.commission,
      0
    );

    // Calculate clinical staff costs using the shared utility
    let totalClinicalCosts = 0;
    
    currentSessions.forEach(session => {
      const staffRates = clinicalStaffRates.find(r => r.staffId === session.staffId);
      const sessionCost = getSessionCost(session, staffRates);
      
      if (sessionCost === 0 && staffRates === undefined) {
        console.warn(`Missing rates for staff ID: ${session.staffId}`);
      }
      
      totalClinicalCosts += sessionCost;
    });
    
    const totalExpenses = totalClinicalCosts + totalAdminCosts + totalFixedOverheads;
    
    const summary: FinancialSummary = {
      totalRevenue,
      totalClinicalCosts,
      totalAdminCosts,
      totalFixedOverheads,
      totalExpenses,
      grossProfit: totalRevenue - totalClinicalCosts,
      operatingProfit: totalRevenue - totalExpenses,
      clinicalPayrollToRevenueRatio: totalRevenue > 0 ? totalClinicalCosts / totalRevenue : 0,
      totalPayrollToRevenueRatio: totalRevenue > 0 ? (totalClinicalCosts + totalAdminCosts) / totalRevenue : 0,
      averageRevenuePerPatient: totalRevenue / Math.max(currentSessions.length, 1),
      averageCostPerClinicalUnit: totalClinicalCosts / Math.max(currentSessions.reduce((sum, s) => sum + s.count, 0), 1),
    };

    console.log("Financial summary calculated:", summary);
    return summary;
  };

  // Add the updateFinancialSummary function
  const updateFinancialSummary = () => {
    const summary = calculateFinancialSummary();
    setFinancialSummary(summary);
    console.log("Financial summary updated:", summary);
  };

  return (
    <FinanceContext.Provider
      value={{
        currentPeriod,
        setCurrentPeriod,
        revenueSources,
        staffMembers,
        clinicalStaffWork,
        clinicalStaffRates,
        adminStaffFinancials,
        fixedOverheads,
        bonusMetrics,
        clinicalSessions,
        settings,
        financialSummary,
        addRevenueSource,
        updateRevenueSource,
        deleteRevenueSource,
        addFixedOverhead,
        updateFixedOverhead,
        deleteFixedOverhead,
        addClinicalSession,
        updateClinicalSession,
        deleteClinicalSession,
        addClinicalStaffWork,
        updateClinicalStaffWork,
        deleteClinicalStaffWork,
        updateSettings,
        calculateFinancialSummary,
        updateFinancialSummary,
        addStaffMember,
        updateStaffMember,
        deleteStaffMember,
        addStaffRates,
        updateStaffRates,
        getStaffRates,
        addAdminStaff,
        updateAdminStaff,
        deleteAdminStaff,
        isLoading,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

// Custom hook for using the finance context
export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error("useFinance must be used within a FinanceProvider");
  }
  return context;
};
