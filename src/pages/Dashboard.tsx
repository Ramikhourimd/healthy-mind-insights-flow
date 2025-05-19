
import React from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { FinancialOverview } from "@/components/dashboard/FinancialOverview";
import { RevenueBreakdown } from "@/components/dashboard/RevenueBreakdown";
import { ExpensesBreakdown } from "@/components/dashboard/ExpensesBreakdown";
import { KeyIndicators } from "@/components/dashboard/KeyIndicators";

const Dashboard: React.FC = () => {
  return (
    <div>
      <DashboardHeader />
      
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
