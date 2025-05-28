// Types for the HealthyMind Clinic Financial Dashboard

// Revenue Source types
export type RevenueSource = {
  id: string;
  name: string;
  quantity: number;
  ratePerUnit: number;
  month: number;
  year: number;
};

// Staff types
export type StaffRole = "Psychiatrist" | "CaseManager" | "Admin";

export type StaffMember = {
  id: string;
  name: string;
  role: StaffRole;
  startDate?: string;
  endDate?: string;
  active: boolean;
};

// Clinic type for session tracking
export type ClinicType = "MCB" | "PRV" | "MHS" | "MHN" | "MHY" | "MSY" | "SPC" | "MHB";

// Session meeting type
export type MeetingType = "Intake" | "FollowUp";

// Show status
export type ShowStatus = "Show" | "NoShow";

// Service type for different age groups
export type ServiceType = "Adult" | "Child";

// Clinical staff session tracking
export type ClinicalSession = {
  id: string;
  staffId: string;
  clinicType: ClinicType;
  meetingType: MeetingType;
  showStatus: ShowStatus;
  serviceAgeGroup: ServiceType; // Updated to use serviceAgeGroup instead of serviceType
  count: number;
  duration: number; // in minutes
  month: number;
  year: number;
};

// Work data for clinical staff
export type ClinicalStaffWork = {
  id: string;
  staffId: string;
  month: number;
  year: number;
  intakesCompleted: number;
  followUpUnitsCompleted: number;
  noShowHours: number;
  availabilityRetainerHours: number;
  adminHours: number;
  trainingHours: number;
  quarterlyGrossFees: number; // For bonus calculation
};

// Rates for clinical staff - updated structure
export type ClinicalStaffRates = {
  id: string;
  staffId: string;
  adult_intake_rate: number;
  adult_follow_up_rate: number;
  adult_no_show_intake_rate: number;
  adult_no_show_follow_up_rate: number;
  child_intake_rate: number; // For specific child rates like Ahmad/Uriel
  child_follow_up_rate: number; // For specific child rates
  child_no_show_intake_rate: number;
  child_no_show_follow_up_rate: number;
  admin_rate: number;
  training_rate: number;
  availability_retainer_rate: number; // For exceptions like Ilia
  effective_date: string;
  contract_type_identifier?: string; // Optional: for very unique contracts
};

// Admin staff financial data - updated to match our usage
export type AdminStaffFinancials = {
  id: string;
  name: string;
  role: string;
  baseSalary: number;
  commission: number;
  month: number;
  year: number;
};

// Fixed overhead costs
export type FixedOverhead = {
  id: string;
  name: string;
  monthlyCost: number;
  month: number;
  year: number;
};

// Admin/Training hours type
export type AdminTrainingHours = {
  id: string;
  staffId: string;
  adminHours: number;
  trainingHours: number;
  month: number;
  year: number;
};

// Bonus calculation metrics
export type BonusMetrics = {
  id: string;
  staffId: string;
  quarter: number;
  year: number;
  csatScore: number;
  noShowRate: number;
  billableServiceHours: number;
};

// Staff performance metrics type - updated to match database
export type StaffPerformanceMetrics = {
  id: string;
  staffId: string;
  month: number;
  year: number;
  satisfactionScore?: number; // 0-100 scale
  availableHours: number; // Bank hours
  noShowRate?: number; // Calculated automatically
};

// Settings and assumptions
export type FinancialSettings = {
  vatRate: number;
  targetClinicalPayrollToRevenueRatio: number;
  targetTotalPayrollToRevenueRatio: number;
  bonusCsatThresholds: BonusThresholds;
  bonusNoShowThresholds: BonusThresholds;
  bonusHoursThresholds: BonusThresholds;
  bonusPercentageTiers: BonusPercentageTier[];
};

type BonusThresholds = {
  level1: number;
  level2: number;
  level3: number;
};

type BonusPercentageTier = {
  minPoints: number;
  maxPoints: number;
  percentage: number;
};

// Financial summary type
export type FinancialSummary = {
  totalRevenue: number;
  totalClinicalCosts: number;
  totalAdminCosts: number;
  totalFixedOverheads: number;
  totalAdminTrainingCosts: number; // Add admin/training hours costs
  totalExpenses: number;
  grossProfit: number;
  operatingProfit: number;
  clinicalPayrollToRevenueRatio: number;
  totalPayrollToRevenueRatio: number;
  averageRevenuePerPatient: number;
  averageCostPerClinicalUnit: number;
};

// Time period for filtering
export type TimePeriod = {
  month: number;
  year: number;
};

// Add new clinic rates type
export type ClinicRate = {
  id: string;
  clinicType: ClinicType;
  meetingType: MeetingType;
  staffRole: StaffRole;
  rate: number;
  createdAt?: string;
  updatedAt?: string;
};
