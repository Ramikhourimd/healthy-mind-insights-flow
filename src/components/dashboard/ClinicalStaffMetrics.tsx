
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Clock, Users, BarChart3 } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell,
} from "recharts";
import { useFinance } from "@/context/FinanceContext";

interface StaffMetrics {
  staffName: string;
  clinicalHours: number;
  noShowHours: number;
  idleHours: number;
  clinicalCost: number;
  noShowCost: number;
  idleCost: number;
  otCost: number;
  costPerClinicalHour: number;
  utilizationPercent: number;
  role: string;
}

const ClinicalStaffMetrics: React.FC = () => {
  const { staffMembers, clinicalSessions, currentPeriod, clinicalStaffRates, adminTrainingHours } = useFinance();
  
  const [selectedMonth, setSelectedMonth] = useState(currentPeriod.month);
  const [selectedYear, setSelectedYear] = useState(currentPeriod.year);

  // Real data calculation using actual Supabase data
  const staffMetrics = useMemo(() => {
    const clinicalStaff = staffMembers.filter(s => 
      s.role === "Psychiatrist" || s.role === "CaseManager"
    );

    return clinicalStaff.map((staff): StaffMetrics => {
      // Get sessions for this staff member in the selected period
      const staffSessions = clinicalSessions.filter(
        s => s.staffId === staff.id && s.month === selectedMonth && s.year === selectedYear
      );

      // Get staff rates (use the most recent rate)
      const staffRate = clinicalStaffRates
        .filter(r => r.staffId === staff.id)
        .sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime())[0];

      // Get admin/training hours for this staff member
      const adminTraining = adminTrainingHours.find(
        at => at.staffId === staff.id && at.month === selectedMonth && at.year === selectedYear
      );

      // Calculate clinical hours based on sessions
      const clinicalHours = staffSessions.reduce((sum, session) => {
        if (session.showStatus === "Show") {
          return sum + (session.count * (session.duration / 60)); // Convert minutes to hours
        }
        return sum;
      }, 0);

      // Calculate no-show hours
      const noShowHours = staffSessions.reduce((sum, session) => {
        if (session.showStatus === "NoShow") {
          return sum + (session.count * (session.duration / 60)); // Convert minutes to hours
        }
        return sum;
      }, 0);

      // Get admin and training hours from database
      const adminHours = adminTraining?.adminHours || 0;
      const trainingHours = adminTraining?.trainingHours || 0;

      // Calculate idle hours (assuming 40 hour work week minus productive time)
      const totalProductiveHours = clinicalHours + noShowHours + adminHours + trainingHours;
      const idleHours = Math.max(0, 40 - totalProductiveHours);

      // Calculate costs using real rates
      let clinicalCost = 0;
      let noShowCost = 0;
      let adminCost = 0;
      let trainingCost = 0;

      if (staffRate) {
        // Calculate clinical cost based on session types
        staffSessions.forEach(session => {
          if (session.showStatus === "Show") {
            const sessionHours = session.count * (session.duration / 60);
            if (session.meetingType === "Intake") {
              clinicalCost += sessionHours * (staffRate.intakeSessionRate || 0);
            } else {
              clinicalCost += sessionHours * (staffRate.followUpSessionRate || 0);
            }
          } else if (session.showStatus === "NoShow") {
            const sessionHours = session.count * (session.duration / 60);
            if (session.meetingType === "Intake") {
              noShowCost += sessionHours * (staffRate.noShowIntakeRate || 0);
            } else {
              noShowCost += sessionHours * (staffRate.noShowFollowUpRate || 0);
            }
          }
        });

        // Calculate admin and training costs
        adminCost = adminHours * (staffRate.adminRate || 0);
        trainingCost = trainingHours * (staffRate.trainingRate || 0);
      }

      // Calculate idle cost (using admin rate as baseline for idle time)
      const idleCost = idleHours * (staffRate?.adminRate || 0) * 0.3; // 30% of admin rate for idle time

      // Calculate overtime (hours over 40)
      const overtimeHours = Math.max(0, totalProductiveHours - 40);
      const otCost = overtimeHours * (staffRate?.adminRate || 0) * 1.5; // 1.5x rate for overtime

      // Calculate cost per clinical hour
      const costPerClinicalHour = clinicalHours > 0 ? clinicalCost / clinicalHours : 0;

      // Calculate utilization percentage
      const utilizationPercent = totalProductiveHours > 0 ? (totalProductiveHours / 40) * 100 : 0;

      return {
        staffName: staff.name,
        clinicalHours,
        noShowHours,
        idleHours,
        clinicalCost,
        noShowCost,
        idleCost,
        otCost,
        costPerClinicalHour,
        utilizationPercent: Math.min(100, utilizationPercent),
        role: staff.role,
      };
    });
  }, [staffMembers, clinicalSessions, clinicalStaffRates, adminTrainingHours, selectedMonth, selectedYear]);

  // Calculate KPIs
  const totalClinicalCost = staffMetrics.reduce((sum, s) => sum + s.clinicalCost, 0);
  const avgUtilization = staffMetrics.length > 0 
    ? staffMetrics.reduce((sum, s) => sum + s.utilizationPercent, 0) / staffMetrics.length 
    : 0;
  const avgCostPerHour = staffMetrics.length > 0
    ? staffMetrics.reduce((sum, s) => sum + s.costPerClinicalHour, 0) / staffMetrics.length
    : 0;

  // Chart data preparation
  const utilizationChartData = staffMetrics.map(staff => ({
    name: staff.staffName.split(' ').slice(-1)[0], // Last name only for space
    clinical: staff.clinicalHours,
    noShow: staff.noShowHours,
    idle: staff.idleHours,
  }));

  const costBreakdownData = [
    { category: "Clinical", value: staffMetrics.reduce((sum, s) => sum + s.clinicalCost, 0) },
    { category: "No-Show", value: staffMetrics.reduce((sum, s) => sum + s.noShowCost, 0) },
    { category: "Idle", value: staffMetrics.reduce((sum, s) => sum + s.idleCost, 0) },
    { category: "Overtime", value: staffMetrics.reduce((sum, s) => sum + s.otCost, 0) },
  ];

  const efficiencyScatterData = staffMetrics.map(staff => ({
    x: staff.costPerClinicalHour,
    y: staff.utilizationPercent,
    name: staff.staffName.split(' ').slice(-1)[0],
    role: staff.role,
  }));

  const chartConfig = {
    clinical: {
      label: "Clinical Hours",
      color: "hsl(var(--chart-1))",
    },
    noShow: {
      label: "No-Show Hours", 
      color: "hsl(var(--chart-2))",
    },
    idle: {
      label: "Idle Hours",
      color: "hsl(var(--chart-3))",
    },
  };

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const years = [2023, 2024, 2025];

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Clinical Staff Metrics</h2>
          <p className="text-muted-foreground">
            Cost analysis and utilization tracking for clinical staff
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clinical Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalClinicalCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              For {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Utilization</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgUtilization.toFixed(1)}%</div>
            <div className="flex items-center gap-1">
              {avgUtilization >= 75 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <p className="text-xs text-muted-foreground">
                {avgUtilization >= 75 ? "Good utilization" : "Below target"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Cost per Clinical Hour</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${avgCostPerHour.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              Across {staffMetrics.length} clinical staff
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Utilization vs Availability */}
        <Card>
          <CardHeader>
            <CardTitle>Utilization vs Availability by Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <BarChart data={utilizationChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="clinical" stackId="a" fill="var(--color-clinical)" />
                <Bar dataKey="noShow" stackId="a" fill="var(--color-noShow)" />
                <Bar dataKey="idle" stackId="a" fill="var(--color-idle)" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px]">
              <BarChart data={costBreakdownData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <ChartTooltip 
                  content={<ChartTooltipContent 
                    formatter={(value) => [`$${Number(value).toLocaleString()}`, "Amount"]}
                  />} 
                />
                <Bar dataKey="value">
                  {costBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${index + 1}))`} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Efficiency Scatter Plot */}
      <Card>
        <CardHeader>
          <CardTitle>Efficiency vs Cost per Hour</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}} className="h-[400px]">
            <ScatterChart data={efficiencyScatterData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="x" 
                name="Cost per Hour"
                type="number"
                domain={['dataMin - 10', 'dataMax + 10']}
              />
              <YAxis 
                dataKey="y" 
                name="Utilization %"
                type="number"
                domain={[0, 100]}
              />
              <ChartTooltip 
                content={<ChartTooltipContent 
                  formatter={(value, name) => [
                    name === 'Cost per Hour' ? `$${Number(value).toFixed(0)}` : `${Number(value).toFixed(1)}%`,
                    name
                  ]}
                />} 
              />
              <Scatter dataKey="y" fill="hsl(var(--chart-1))">
                {efficiencyScatterData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.role === 'Psychiatrist' ? 'hsl(var(--chart-1))' : 'hsl(var(--chart-2))'} 
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Staff Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Staff Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Staff Member</th>
                  <th className="text-left p-2">Role</th>
                  <th className="text-right p-2">Clinical Hours</th>
                  <th className="text-right p-2">Utilization %</th>
                  <th className="text-right p-2">Cost/Hour</th>
                  <th className="text-right p-2">Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {staffMetrics.map((staff, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2 font-medium">{staff.staffName}</td>
                    <td className="p-2">
                      <Badge variant={staff.role === 'Psychiatrist' ? 'default' : 'secondary'}>
                        {staff.role}
                      </Badge>
                    </td>
                    <td className="text-right p-2">{staff.clinicalHours.toFixed(1)}</td>
                    <td className="text-right p-2">
                      <span className={staff.utilizationPercent >= 75 ? 'text-green-600' : 'text-red-600'}>
                        {staff.utilizationPercent.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-right p-2">${staff.costPerClinicalHour.toFixed(0)}</td>
                    <td className="text-right p-2 font-medium">
                      ${(staff.clinicalCost + staff.noShowCost + staff.idleCost + staff.otCost).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClinicalStaffMetrics;
