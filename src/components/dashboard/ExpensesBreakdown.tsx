
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinance } from "@/context/FinanceContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export const ExpensesBreakdown: React.FC = () => {
  const { financialSummary } = useFinance();
  
  // Safety check for null/undefined financialSummary
  if (!financialSummary) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Expenses Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground">Loading expenses data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for the chart with improved colors and display
  const chartData = [
    {
      name: "Clinical Staff",
      value: financialSummary.totalClinicalCosts,
      fill: "#3B82F6"  // Blue
    },
    {
      name: "Admin Staff",
      value: financialSummary.totalAdminCosts,
      fill: "#10B981"  // Green
    },
    {
      name: "Fixed Overhead",
      value: financialSummary.totalFixedOverheads,
      fill: "#F59E0B"  // Amber
    }
  ];

  // Format currency for tooltip and display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IL', { 
      style: 'currency', 
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Custom tooltip component with improved styling
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-md rounded border">
          <p className="font-medium">{payload[0].payload.name}</p>
          <p className="text-sm">{`Amount: ${formatCurrency(payload[0].value)}`}</p>
          <p className="text-xs text-gray-500">{`${Math.round((payload[0].value / financialSummary.totalExpenses) * 100)}% of total`}</p>
        </div>
      );
    }
    return null;
  };

  // Calculate percentages for display
  const getPercentage = (value: number) => {
    return financialSummary.totalExpenses > 0
      ? Math.round((value / financialSummary.totalExpenses) * 100)
      : 0;
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Expenses Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => value.toLocaleString()} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="value" fill="#3B82F6" name="Amount" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-2">
          {chartData.map((expense) => (
            <div key={expense.name} className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: expense.fill }} />
                <span className="text-sm">{expense.name}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium">{formatCurrency(expense.value)}</span>
                <span className="text-xs text-gray-500">{getPercentage(expense.value)}%</span>
              </div>
            </div>
          ))}
          <div className="border-t pt-2 mt-2 flex justify-between items-center">
            <span className="font-semibold">Total Expenses</span>
            <span className="font-semibold">{formatCurrency(financialSummary.totalExpenses)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
