
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFinance } from "@/context/FinanceContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const ReportsPage: React.FC = () => {
  const { financialSummary } = useFinance();
  
  // Sample data for charts
  const trendData = [
    { month: 'Jan', revenue: 95000, expenses: 68000, profit: 27000 },
    { month: 'Feb', revenue: 92000, expenses: 67000, profit: 25000 },
    { month: 'Mar', revenue: 98000, expenses: 71000, profit: 27000 },
    { month: 'Apr', revenue: financialSummary.totalRevenue, expenses: financialSummary.totalExpenses, profit: financialSummary.operatingProfit },
  ];
  
  // Format currency for tooltip
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IL', { 
      style: 'currency', 
      currency: 'ILS',
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    }).format(value);
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-md rounded border">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${formatCurrency(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Financial Reports</h1>
          <p className="text-gray-500 mt-1">
            View and analyze clinic financial performance
          </p>
        </div>
        <div>
          <Button>Export Reports</Button>
        </div>
      </div>

      <Tabs defaultValue="trends" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="trends">Financial Trends</TabsTrigger>
          <TabsTrigger value="quarterly">Quarterly Analysis</TabsTrigger>
          <TabsTrigger value="staff">Staff Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Financial Trends</CardTitle>
              <CardDescription>Revenue, Expenses, and Profit trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trendData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#3B82F6" name="Revenue" strokeWidth={2} />
                    <Line type="monotone" dataKey="expenses" stroke="#EF4444" name="Expenses" strokeWidth={2} />
                    <Line type="monotone" dataKey="profit" stroke="#10B981" name="Profit" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center text-sm text-muted-foreground mt-4">
                Note: This is sample data. Full historical reporting will be available in the complete version.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quarterly">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Quarterly Financial Analysis</CardTitle>
              <CardDescription>Comparison of key metrics across quarters</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-center text-muted-foreground">
                Quarterly financial analysis will be available in the complete version.
                <br />
                This will include bonus calculations and quarterly performance metrics.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Staff Performance Metrics</CardTitle>
              <CardDescription>Key performance indicators for clinical staff</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-center text-muted-foreground">
                Staff performance reporting will be available in the complete version.
                <br />
                This will include CSAT scores, no-show rates, and billable service hours.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;
