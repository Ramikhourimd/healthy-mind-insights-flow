
import React, { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { FinancialOverview } from "@/components/dashboard/FinancialOverview";
import { RevenueBreakdown } from "@/components/dashboard/RevenueBreakdown";
import { ExpensesBreakdown } from "@/components/dashboard/ExpensesBreakdown";
import { KeyIndicators } from "@/components/dashboard/KeyIndicators";
import ClinicalStaffMetrics from "@/components/dashboard/ClinicalStaffMetrics";
import { FinanceContextDebugger } from "@/context/FinanceContext-debug";
import { useFinance } from "@/context/FinanceContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Dashboard: React.FC = () => {
  const { clinicalSessions, updateFinancialSummary } = useFinance();
  const [activeTab, setActiveTab] = useState("overview");

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
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Financial Overview</TabsTrigger>
          <TabsTrigger value="staff-metrics">Clinical Staff Metrics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6 mt-6">
          <FinancialOverview />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <RevenueBreakdown />
            <ExpensesBreakdown />
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <KeyIndicators />
          </div>
        </TabsContent>
        
        <TabsContent value="staff-metrics" className="mt-6">
          <ClinicalStaffMetrics />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
