
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinance } from "@/context/FinanceContext";
import { Progress } from "@/components/ui/progress";

export const KeyIndicators: React.FC = () => {
  const { financialSummary, settings } = useFinance();

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IL', { 
      style: 'currency', 
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate progress bar percentage for payroll ratios
  const clinicalRatioPercentage = Math.min(
    (financialSummary.clinicalPayrollToRevenueRatio / settings.targetClinicalPayrollToRevenueRatio) * 100,
    100
  );
  
  const totalRatioPercentage = Math.min(
    (financialSummary.totalPayrollToRevenueRatio / settings.targetTotalPayrollToRevenueRatio) * 100,
    100
  );

  // Get color based on ratio compared to target
  const getRatioColor = (actual: number, target: number) => {
    const ratio = actual / target;
    if (ratio <= 0.9) return "bg-clinic-green";
    if (ratio <= 1.0) return "bg-clinic-yellow";
    return "bg-clinic-red";
  };

  const clinicalRatioColor = getRatioColor(
    financialSummary.clinicalPayrollToRevenueRatio, 
    settings.targetClinicalPayrollToRevenueRatio
  );
  
  const totalRatioColor = getRatioColor(
    financialSummary.totalPayrollToRevenueRatio,
    settings.targetTotalPayrollToRevenueRatio
  );

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Key Performance Indicators</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Clinical Payroll to Revenue Ratio */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Clinical Payroll / Revenue</span>
              <span className="text-sm font-medium">
                {(financialSummary.clinicalPayrollToRevenueRatio * 100).toFixed(1)}% / 
                {(settings.targetClinicalPayrollToRevenueRatio * 100).toFixed(1)}%
              </span>
            </div>
            <Progress className="h-2" value={clinicalRatioPercentage}>
              <div 
                className={`h-full ${clinicalRatioColor}`} 
                style={{ width: `${clinicalRatioPercentage}%` }}
              />
            </Progress>
          </div>

          {/* Total Payroll to Revenue Ratio */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Total Payroll / Revenue</span>
              <span className="text-sm font-medium">
                {(financialSummary.totalPayrollToRevenueRatio * 100).toFixed(1)}% / 
                {(settings.targetTotalPayrollToRevenueRatio * 100).toFixed(1)}%
              </span>
            </div>
            <Progress className="h-2" value={totalRatioPercentage}>
              <div 
                className={`h-full ${totalRatioColor}`} 
                style={{ width: `${totalRatioPercentage}%` }}
              />
            </Progress>
          </div>

          {/* Average Revenue per Patient */}
          <div>
            <div className="flex justify-between">
              <span className="text-sm">Average Revenue per Patient</span>
              <span className="text-sm font-medium">
                {formatCurrency(financialSummary.averageRevenuePerPatient)}
              </span>
            </div>
          </div>

          {/* Average Cost per Clinical Unit */}
          <div>
            <div className="flex justify-between">
              <span className="text-sm">Average Cost per Clinical Unit</span>
              <span className="text-sm font-medium">
                {formatCurrency(financialSummary.averageCostPerClinicalUnit)}
              </span>
            </div>
          </div>

          {/* Gross Profit Margin */}
          <div>
            <div className="flex justify-between">
              <span className="text-sm">Gross Profit Margin</span>
              <span className="text-sm font-medium">
                {(financialSummary.grossProfit / financialSummary.totalRevenue * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Operating Profit Margin */}
          <div>
            <div className="flex justify-between">
              <span className="text-sm">Operating Profit Margin</span>
              <span className="text-sm font-medium">
                {(financialSummary.operatingProfit / financialSummary.totalRevenue * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
