
import React, { useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { FinancialOverview } from "@/components/dashboard/FinancialOverview";
import { RevenueBreakdown } from "@/components/dashboard/RevenueBreakdown";
import { ExpensesBreakdown } from "@/components/dashboard/ExpensesBreakdown";
import { KeyIndicators } from "@/components/dashboard/KeyIndicators";
import { FinanceContextDebugger } from "@/context/FinanceContext-debug";
import { useFinance } from "@/context/FinanceContext";

const Dashboard: React.FC = () => {
  const { clinicalSessions, updateFinancialSummary } = useFinance();

  // Debug: Log sessions when the dashboard renders and make sure summary is updated
  useEffect(() => {
    console.log("Dashboard rendered, total clinical sessions:", clinicalSessions.length);
    
    // Force a financial summary update to reflect new sessions
    updateFinancialSummary();
  }, [clinicalSessions.length, updateFinancialSummary]);

  return (
    <div>
      <DashboardHeader />
      
      {/* <FinanceContextDebugger /> */}
      
      <FinancialOverview />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RevenueBreakdown />
        <ExpensesBreakdown />
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <KeyIndicators />
      </div>
    </div>
  );
};

export default Dashboard;
