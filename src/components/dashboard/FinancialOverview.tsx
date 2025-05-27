
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinance } from "@/context/FinanceContext";
import { ArrowUp, ArrowDown, DollarSign, BarChart } from "lucide-react";

export const FinancialOverview: React.FC = () => {
  const { financialSummary, settings } = useFinance();

  // Format currency function
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IL', { 
      style: 'currency', 
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format percentage function
  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  // Determine color for payroll ratio indicators
  const getPayrollRatioColor = (actual: number, target: number) => {
    if (actual <= target - 0.05) return "text-clinic-green";
    if (actual <= target) return "text-clinic-yellow";
    return "text-clinic-red";
  };

  // Safety check for null/undefined values
  if (!financialSummary || !settings) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Loading...
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">
                  {formatCurrency(0)}
                </div>
                <div className="p-2 bg-gray-100 rounded-full">
                  <DollarSign className="h-5 w-5 text-gray-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const clinicalPayrollColor = getPayrollRatioColor(
    financialSummary.clinicalPayrollToRevenueRatio,
    settings.targetClinicalPayrollToRevenueRatio
  );

  const totalPayrollColor = getPayrollRatioColor(
    financialSummary.totalPayrollToRevenueRatio,
    settings.targetTotalPayrollToRevenueRatio
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Revenue Card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">
              {formatCurrency(financialSummary.totalRevenue)}
            </div>
            <div className="p-2 bg-clinic-blue/10 rounded-full">
              <DollarSign className="h-5 w-5 text-clinic-blue" />
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Monthly revenue from all sources
          </div>
        </CardContent>
      </Card>

      {/* Operating Profit Card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Operating Profit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">
              {formatCurrency(financialSummary.operatingProfit)}
            </div>
            <div className="p-2 bg-clinic-green/10 rounded-full">
              <DollarSign className="h-5 w-5 text-clinic-green" />
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Revenue minus all expenses
          </div>
        </CardContent>
      </Card>

      {/* Clinical Payroll Ratio Card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Clinical Payroll to Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className={`text-2xl font-bold ${clinicalPayrollColor}`}>
              {formatPercentage(financialSummary.clinicalPayrollToRevenueRatio)}
            </div>
            <div className="p-2 bg-clinic-teal/10 rounded-full">
              <BarChart className="h-5 w-5 text-clinic-teal" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
            <span>Target: {formatPercentage(settings.targetClinicalPayrollToRevenueRatio)}</span>
            {financialSummary.clinicalPayrollToRevenueRatio > settings.targetClinicalPayrollToRevenueRatio ? (
              <ArrowUp className="h-3 w-3 text-clinic-red" />
            ) : (
              <ArrowDown className="h-3 w-3 text-clinic-green" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Total Payroll Ratio Card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Payroll to Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className={`text-2xl font-bold ${totalPayrollColor}`}>
              {formatPercentage(financialSummary.totalPayrollToRevenueRatio)}
            </div>
            <div className="p-2 bg-clinic-purple/10 rounded-full">
              <BarChart className="h-5 w-5 text-clinic-purple" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
            <span>Target: {formatPercentage(settings.targetTotalPayrollToRevenueRatio)}</span>
            {financialSummary.totalPayrollToRevenueRatio > settings.targetTotalPayrollToRevenueRatio ? (
              <ArrowUp className="h-3 w-3 text-clinic-red" />
            ) : (
              <ArrowDown className="h-3 w-3 text-clinic-green" />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
