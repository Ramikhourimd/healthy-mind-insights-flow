import React, { createContext, useContext, useState } from "react";
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
} from "../types/finance";

// Sample initial data
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
    level1: 30,
    level2: 40,
    level3: 50,
  },
  bonusPercentageTiers: [
    { minPoints: 0, maxPoints: 3, percentage: 0 },
    { minPoints: 4, maxPoints: 6, percentage: 0.05 },
    { minPoints: 7, maxPoints: 9, percentage: 0.1 },
  ],
};

// Initial sample data for staff and revenue
const initialStaffMembers: StaffMember[] = [
  { id: "1", name: "Dr. Smith", role: "Psychiatrist", active: true },
  { id: "2", name: "Dr. Johnson", role: "Psychiatrist", active: true },
  { id: "3", name: "Sarah Miller", role: "CaseManager", active: true },
  { id: "4", name: "Shira Lachmann", role: "Admin", active: true },
];

const initialRevenueSources: RevenueSource[] = [
  {
    id: "1",
    name: "Maccabi Intakes",
    quantity: 20,
    ratePerUnit: 800,
    month: 4,
    year: 2025,
  },
  {
    id: "2",
    name: "Maccabi Follow-ups",
    quantity: 45,
    ratePerUnit: 550,
    month: 4,
    year: 2025,
  },
  {
    id: "3",
    name: "B2C Intakes",
    quantity: 8,
    ratePerUnit: 1200,
    month: 4,
    year: 2025,
  },
  {
    id: "4",
    name: "B2C Follow-ups",
    quantity: 22,
    ratePerUnit: 800,
    month: 4,
    year: 2025,
  },
];

const initialOverheads: FixedOverhead[] = [
  { id: "1", name: "Rent", monthlyCost: 12000, month: 4, year: 2025 },
  { id: "2", name: "Utilities", monthlyCost: 2500, month: 4, year: 2025 },
  {
    id: "3",
    name: "Software Licenses",
    monthlyCost: 1800,
    month: 4,
    year: 2025,
  },
  {
    id: "4",
    name: "Accounting/Legal",
    monthlyCost: 3000,
    month: 4,
    year: 2025,
  },
];

// Initial sample data for clinical sessions
const initialClinicalSessions: ClinicalSession[] = [
  {
    id: "1",
    staffId: "1", // Dr. Smith
    clinicType: "MCB",
    meetingType: "Intake",
    showStatus: "Show",
    count: 3,
    duration: 60,
    month: 4,
    year: 2025,
  },
  {
    id: "2",
    staffId: "1", // Dr. Smith
    clinicType: "PRV",
    meetingType: "FollowUp",
    showStatus: "Show",
    count: 5,
    duration: 45,
    month: 4,
    year: 2025,
  },
  {
    id: "3",
    staffId: "2", // Dr. Johnson
    clinicType: "MHS",
    meetingType: "Intake",
    showStatus: "NoShow",
    count: 2,
    duration: 60,
    month: 4,
    year: 2025,
  },
];

// Calculate an initial financial summary based on sample data
const calculateInitialSummary = (): FinancialSummary => {
  const totalRevenue = initialRevenueSources.reduce(
    (sum, source) => sum + source.quantity * source.ratePerUnit,
    0
  );
  
  const totalFixedOverheads = initialOverheads.reduce(
    (sum, overhead) => sum + overhead.monthlyCost, 
    0
  );
  
  // Assume clinical costs at 50% of revenue for the sample
  const totalClinicalCosts = totalRevenue * 0.5;
  
  // Assume admin costs at 15% of revenue for the sample
  const totalAdminCosts = totalRevenue * 0.15;
  
  const totalExpenses = totalClinicalCosts + totalAdminCosts + totalFixedOverheads;
  const operatingProfit = totalRevenue - totalExpenses;
  
  return {
    totalRevenue,
    totalClinicalCosts,
    totalAdminCosts,
    totalFixedOverheads,
    totalExpenses,
    grossProfit: totalRevenue - totalClinicalCosts,
    operatingProfit,
    clinicalPayrollToRevenueRatio: totalClinicalCosts / totalRevenue,
    totalPayrollToRevenueRatio: (totalClinicalCosts + totalAdminCosts) / totalRevenue,
    averageRevenuePerPatient: totalRevenue / 75, // Assuming 75 patients
    averageCostPerClinicalUnit: totalClinicalCosts / 95, // Assuming 95 total units
  };
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
  addRevenueSource: (source: Omit<RevenueSource, "id">) => void;
  updateRevenueSource: (source: RevenueSource) => void;
  deleteRevenueSource: (id: string) => void;
  addFixedOverhead: (overhead: Omit<FixedOverhead, "id">) => void;
  updateFixedOverhead: (overhead: FixedOverhead) => void;
  deleteFixedOverhead: (id: string) => void;
  addClinicalSession: (session: Omit<ClinicalSession, "id">) => void;
  updateClinicalSession: (session: ClinicalSession) => void;
  deleteClinicalSession: (id: string) => void;
  updateSettings: (newSettings: Partial<FinancialSettings>) => void;
  calculateFinancialSummary: () => FinancialSummary;
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
  const [revenueSources, setRevenueSources] = useState<RevenueSource[]>(
    initialRevenueSources
  );
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(
    initialStaffMembers
  );
  const [clinicalStaffWork, setClinicalStaffWork] = useState<
    ClinicalStaffWork[]
  >([]);
  const [clinicalStaffRates, setClinicalStaffRates] = useState<
    ClinicalStaffRates[]
  >([]);
  const [adminStaffFinancials, setAdminStaffFinancials] = useState<
    AdminStaffFinancials[]
  >([]);
  const [fixedOverheads, setFixedOverheads] = useState<FixedOverhead[]>(
    initialOverheads
  );
  const [bonusMetrics, setBonusMetrics] = useState<BonusMetrics[]>([]);
  const [clinicalSessions, setClinicalSessions] = useState<ClinicalSession[]>(
    initialClinicalSessions
  );
  const [settings, setSettings] = useState<FinancialSettings>(initialSettings);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary>(
    calculateInitialSummary()
  );

  // Function to generate unique ID
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  // CRUD functions for revenue sources
  const addRevenueSource = (source: Omit<RevenueSource, "id">) => {
    const newSource = { ...source, id: generateId() };
    setRevenueSources([...revenueSources, newSource]);
    setFinancialSummary(calculateFinancialSummary());
  };

  const updateRevenueSource = (source: RevenueSource) => {
    setRevenueSources(
      revenueSources.map((s) => (s.id === source.id ? source : s))
    );
    setFinancialSummary(calculateFinancialSummary());
  };

  const deleteRevenueSource = (id: string) => {
    setRevenueSources(revenueSources.filter((s) => s.id !== id));
    setFinancialSummary(calculateFinancialSummary());
  };

  // CRUD functions for fixed overheads
  const addFixedOverhead = (overhead: Omit<FixedOverhead, "id">) => {
    const newOverhead = { ...overhead, id: generateId() };
    setFixedOverheads([...fixedOverheads, newOverhead]);
    setFinancialSummary(calculateFinancialSummary());
  };

  const updateFixedOverhead = (overhead: FixedOverhead) => {
    setFixedOverheads(
      fixedOverheads.map((o) => (o.id === overhead.id ? overhead : o))
    );
    setFinancialSummary(calculateFinancialSummary());
  };

  const deleteFixedOverhead = (id: string) => {
    setFixedOverheads(fixedOverheads.filter((o) => o.id !== id));
    setFinancialSummary(calculateFinancialSummary());
  };

  // CRUD functions for clinical sessions
  const addClinicalSession = (session: Omit<ClinicalSession, "id">) => {
    const newSession = { ...session, id: generateId() };
    setClinicalSessions([...clinicalSessions, newSession]);
  };

  const updateClinicalSession = (session: ClinicalSession) => {
    setClinicalSessions(
      clinicalSessions.map((s) => (s.id === session.id ? session : s))
    );
  };

  const deleteClinicalSession = (id: string) => {
    setClinicalSessions(clinicalSessions.filter((s) => s.id !== id));
  };

  // Update settings
  const updateSettings = (newSettings: Partial<FinancialSettings>) => {
    setSettings({ ...settings, ...newSettings });
  };

  // Calculate financial summary
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

    // For the demo, we'll use approximations for other values
    // In a real implementation, these would be calculated from actual staff work data
    const totalClinicalCosts = totalRevenue * 0.5; // 50% of revenue as an estimate
    const totalAdminCosts = totalRevenue * 0.15; // 15% of revenue as an estimate
    
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
      averageRevenuePerPatient: totalRevenue / 75, // Assuming 75 patients
      averageCostPerClinicalUnit: totalClinicalCosts / 95, // Assuming 95 units
    };

    return summary;
  };

  // Update financial summary whenever relevant data changes
  React.useEffect(() => {
    setFinancialSummary(calculateFinancialSummary());
  }, [revenueSources, fixedOverheads, currentPeriod]);

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
        updateSettings,
        calculateFinancialSummary,
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
