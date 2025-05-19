
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinance } from "@/context/FinanceContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export const ExpensesBreakdown: React.FC = () => {
  const { financialSummary } = useFinance();
  
  // Prepare data for the chart
  const chartData = [
    {
      name: "Clinical Staff",
      value: financialSummary.totalClinicalCosts
    },
    {
      name: "Admin Staff",
      value: financialSummary.totalAdminCosts
    },
    {
      name: "Fixed Overhead",
      value: financialSummary.totalFixedOverheads
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

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-md rounded border">
          <p className="font-medium">{payload[0].payload.name}</p>
          <p className="text-sm">{`Amount: ${formatCurrency(payload[0].value)}`}</p>
        </div>
      );
    }
    return null;
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
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-2">
          {chartData.map((expense) => (
            <div key={expense.name} className="flex justify-between items-center">
              <span className="text-sm">{expense.name}</span>
              <span className="text-sm font-medium">{formatCurrency(expense.value)}</span>
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
