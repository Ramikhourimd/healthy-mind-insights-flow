
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

// Rates for clinical staff
export type ClinicalStaffRates = {
  id: string;
  staffId: string;
  intakeSessionRate: number;
  followUpSessionRate: number;
  noShowIntakeRate: number;
  noShowFollowUpRate: number;
  availabilityRetainerRate: number;
  adminRate: number;
  trainingRate: number;
  effectiveDate: string;
};

// Admin staff financial data
export type AdminStaffFinancials = {
  id: string;
  staffId: string;
  month: number;
  year: number;
  baseSalary: number;
  b2cRevenueAttributed: number;
  commissionRate: number;
  ftePercentage: number;
};

// Fixed overhead costs
export type FixedOverhead = {
  id: string;
  name: string;
  monthlyCost: number;
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
