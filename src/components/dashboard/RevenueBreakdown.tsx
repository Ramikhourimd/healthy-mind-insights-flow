
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinance } from "@/context/FinanceContext";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

export const RevenueBreakdown: React.FC = () => {
  const { revenueSources, currentPeriod } = useFinance();

  // Filter revenue sources for the current period
  const currentRevenueSources = revenueSources.filter(
    source => source.month === currentPeriod.month && source.year === currentPeriod.year
  );

  // Prepare data for the pie chart
  const chartData = currentRevenueSources.map(source => ({
    name: source.name,
    value: source.quantity * source.ratePerUnit
  }));

  // Colors for the chart
  const COLORS = [
    "#3B82F6", "#10B981", "#F59E0B", "#EF4444", 
    "#8B5CF6", "#EC4899", "#14B8A6", "#6366F1"
  ];

  // Format currency for tooltip
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
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm">{`Amount: ${formatCurrency(payload[0].value)}`}</p>
        </div>
      );
    }
    return null;
  };

  // Calculate total revenue
  const totalRevenue = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Revenue Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center">
          <div className="w-full md:w-1/2 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full md:w-1/2 mt-4 md:mt-0">
            <h3 className="text-base font-semibold mb-3">Revenue Sources</h3>
            <div className="space-y-2">
              {chartData.map((source, index) => (
                <div key={source.name} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="text-sm">{source.name}</span>
                  </div>
                  <div className="text-sm font-medium">
                    {formatCurrency(source.value)}
                  </div>
                </div>
              ))}
              <div className="border-t pt-2 mt-2 flex justify-between items-center">
                <span className="font-semibold">Total Revenue</span>
                <span className="font-semibold">{formatCurrency(totalRevenue)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
