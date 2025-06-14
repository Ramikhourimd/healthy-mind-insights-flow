
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  // New fields for the restructured table
  paymentEfficiencyPercent: number;
  finalPaymentAmount: number;
  unscheduledPercent: number;
  unscheduledVal: number;
  noShowPercent: number;
  noShowVal: number;
  clinicalPercent: number;
  clinicalVal: number;
  additionalPercent: number;
  additionalVal: number;
  scheduledHours: number;
  workHoursPercent: number;
  workHoursQty: number;
  additionalHours: number;
  intakeAdults: number;
  followUpAdults: number;
  intakeYouth: number;
  followUpYouth: number;
  intakeChild: number;
  followUpChild: number;
}

const ClinicalStaffMetrics: React.FC = () => {
  const { staffMembers, clinicalSessions, currentPeriod, clinicalStaffRates, adminTrainingHours } = useFinance();
  
  const [selectedMonth, setSelectedMonth] = useState(currentPeriod.month);
  const [selectedYear, setSelectedYear] = useState(currentPeriod.year);
  const [selectedStaff, setSelectedStaff] = useState<string>("all");

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
        .sort((a, b) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime())[0];

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
        // Calculate clinical cost based on session types and age groups
        staffSessions.forEach(session => {
          if (session.showStatus === "Show") {
            const sessionHours = session.count * (session.duration / 60);
            if (session.serviceAgeGroup === "Adult") {
              if (session.meetingType === "Intake") {
                clinicalCost += sessionHours * (staffRate.adult_intake_rate || staffRate.intake_session_rate || 0);
              } else {
                clinicalCost += sessionHours * (staffRate.adult_follow_up_rate || staffRate.follow_up_session_rate || 0);
              }
            } else if (session.serviceAgeGroup === "Child") {
              if (session.meetingType === "Intake") {
                clinicalCost += sessionHours * (staffRate.child_intake_rate || staffRate.intake_session_rate || 0);
              } else {
                clinicalCost += sessionHours * (staffRate.child_follow_up_rate || staffRate.follow_up_session_rate || 0);
              }
            }
          } else if (session.showStatus === "NoShow") {
            const sessionHours = session.count * (session.duration / 60);
            if (session.serviceAgeGroup === "Adult") {
              if (session.meetingType === "Intake") {
                noShowCost += sessionHours * (staffRate.adult_no_show_intake_rate || staffRate.no_show_intake_rate || 0);
              } else {
                noShowCost += sessionHours * (staffRate.adult_no_show_follow_up_rate || staffRate.no_show_follow_up_rate || 0);
              }
            } else if (session.serviceAgeGroup === "Child") {
              if (session.meetingType === "Intake") {
                noShowCost += sessionHours * (staffRate.child_no_show_intake_rate || staffRate.no_show_intake_rate || 0);
              } else {
                noShowCost += sessionHours * (staffRate.child_no_show_follow_up_rate || staffRate.no_show_follow_up_rate || 0);
              }
            }
          }
        });

        // Calculate admin and training costs
        adminCost = adminHours * (staffRate.admin_rate || 0);
        trainingCost = trainingHours * (staffRate.training_rate || 0);
      }

      // Calculate idle cost (using admin rate as baseline for idle time)
      const idleCost = idleHours * (staffRate?.admin_rate || 0) * 0.3; // 30% of admin rate for idle time

      // Calculate overtime (hours over 40)
      const overtimeHours = Math.max(0, totalProductiveHours - 40);
      const otCost = overtimeHours * (staffRate?.admin_rate || 0) * 1.5; // 1.5x rate for overtime

      // Calculate cost per clinical hour
      const costPerClinicalHour = clinicalHours > 0 ? clinicalCost / clinicalHours : 0;

      // Calculate utilization percentage
      const utilizationPercent = totalProductiveHours > 0 ? (totalProductiveHours / 40) * 100 : 0;

      // Calculate session counts by type and age group
      const intakeAdults = staffSessions.filter(s => s.meetingType === "Intake" && s.serviceAgeGroup === "Adult" && s.showStatus === "Show").reduce((sum, s) => sum + s.count, 0);
      const followUpAdults = staffSessions.filter(s => s.meetingType === "FollowUp" && s.serviceAgeGroup === "Adult" && s.showStatus === "Show").reduce((sum, s) => sum + s.count, 0);
      const intakeChild = staffSessions.filter(s => s.meetingType === "Intake" && s.serviceAgeGroup === "Child" && s.showStatus === "Show").reduce((sum, s) => sum + s.count, 0);
      const followUpChild = staffSessions.filter(s => s.meetingType === "FollowUp" && s.serviceAgeGroup === "Child" && s.showStatus === "Show").reduce((sum, s) => sum + s.count, 0);

      // Calculate new metrics for restructured table
      const totalCost = clinicalCost + noShowCost + idleCost + otCost;
      const scheduledHours = clinicalHours + noShowHours;
      const paymentEfficiencyPercent = totalCost > 0 ? (clinicalCost / totalCost) * 100 : 0;

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
        // New fields
        paymentEfficiencyPercent,
        finalPaymentAmount: totalCost,
        unscheduledPercent: scheduledHours > 0 ? (idleHours / (scheduledHours + idleHours)) * 100 : 0,
        unscheduledVal: idleCost,
        noShowPercent: scheduledHours > 0 ? (noShowHours / scheduledHours) * 100 : 0,
        noShowVal: noShowCost,
        clinicalPercent: scheduledHours > 0 ? (clinicalHours / scheduledHours) * 100 : 0,
        clinicalVal: clinicalCost,
        additionalPercent: totalProductiveHours > 0 ? ((adminHours + trainingHours) / totalProductiveHours) * 100 : 0,
        additionalVal: adminCost + trainingCost,
        scheduledHours,
        workHoursPercent: utilizationPercent,
        workHoursQty: totalProductiveHours,
        additionalHours: adminHours + trainingHours,
        intakeAdults,
        followUpAdults,
        intakeYouth: 0, // Placeholder for youth data
        followUpYouth: 0, // Placeholder for youth data
        intakeChild,
        followUpChild,
      };
    });
  }, [staffMembers, clinicalSessions, clinicalStaffRates, adminTrainingHours, selectedMonth, selectedYear]);

  // Get selected staff data or totals
  const selectedStaffData = useMemo(() => {
    if (selectedStaff === "all") {
      // Calculate totals
      return {
        staffName: "Total",
        paymentEfficiencyPercent: staffMetrics.length > 0 ? staffMetrics.reduce((sum, s) => sum + s.paymentEfficiencyPercent, 0) / staffMetrics.length : 0,
        finalPaymentAmount: staffMetrics.reduce((sum, s) => sum + s.finalPaymentAmount, 0),
        unscheduledPercent: staffMetrics.length > 0 ? staffMetrics.reduce((sum, s) => sum + s.unscheduledPercent, 0) / staffMetrics.length : 0,
        unscheduledVal: staffMetrics.reduce((sum, s) => sum + s.unscheduledVal, 0),
        noShowPercent: staffMetrics.length > 0 ? staffMetrics.reduce((sum, s) => sum + s.noShowPercent, 0) / staffMetrics.length : 0,
        noShowVal: staffMetrics.reduce((sum, s) => sum + s.noShowVal, 0),
        clinicalPercent: staffMetrics.length > 0 ? staffMetrics.reduce((sum, s) => sum + s.clinicalPercent, 0) / staffMetrics.length : 0,
        clinicalVal: staffMetrics.reduce((sum, s) => sum + s.clinicalVal, 0),
        additionalPercent: staffMetrics.length > 0 ? staffMetrics.reduce((sum, s) => sum + s.additionalPercent, 0) / staffMetrics.length : 0,
        additionalVal: staffMetrics.reduce((sum, s) => sum + s.additionalVal, 0),
        scheduledHours: staffMetrics.reduce((sum, s) => sum + s.scheduledHours, 0),
        workHoursPercent: staffMetrics.length > 0 ? staffMetrics.reduce((sum, s) => sum + s.workHoursPercent, 0) / staffMetrics.length : 0,
        workHoursQty: staffMetrics.reduce((sum, s) => sum + s.workHoursQty, 0),
        additionalHours: staffMetrics.reduce((sum, s) => sum + s.additionalHours, 0),
        intakeAdults: staffMetrics.reduce((sum, s) => sum + s.intakeAdults, 0),
        followUpAdults: staffMetrics.reduce((sum, s) => sum + s.followUpAdults, 0),
        intakeYouth: staffMetrics.reduce((sum, s) => sum + s.intakeYouth, 0),
        followUpYouth: staffMetrics.reduce((sum, s) => sum + s.followUpYouth, 0),
        intakeChild: staffMetrics.reduce((sum, s) => sum + s.intakeChild, 0),
        followUpChild: staffMetrics.reduce((sum, s) => sum + s.followUpChild, 0),
      };
    } else {
      return staffMetrics.find(s => s.staffName === selectedStaff) || staffMetrics[0];
    }
  }, [staffMetrics, selectedStaff]);

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

      {/* Restructured Staff Performance Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Staff Performance Dashboard
          </CardTitle>
          <div className="flex items-center gap-2 mt-4">
            <label className="text-sm font-medium">Select Clinician:</label>
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Staff (Total)</SelectItem>
                {staffMetrics.map((staff) => (
                  <SelectItem key={staff.staffName} value={staff.staffName}>
                    {staff.staffName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="payment-summary" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="payment-summary" className="bg-green-800 text-white data-[state=active]:bg-green-900">
                Payment Summary
              </TabsTrigger>
              <TabsTrigger value="payment-details" className="bg-green-400 text-white data-[state=active]:bg-green-500">
                Payment Details
              </TabsTrigger>
              <TabsTrigger value="treatment-rates" className="bg-cyan-400 text-white data-[state=active]:bg-cyan-500">
                Treatment Rates
              </TabsTrigger>
              <TabsTrigger value="session-counts" className="bg-blue-400 text-white data-[state=active]:bg-blue-500">
                Session Counts
              </TabsTrigger>
              <TabsTrigger value="hours-utilization" className="bg-pink-300 text-white data-[state=active]:bg-pink-400">
                Hours & Utilization
              </TabsTrigger>
            </TabsList>

            <TabsContent value="payment-summary" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-lg">Payment Efficiency %</CardTitle>
                    <p className="text-sm text-muted-foreground">Percentage of productive payments</p>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-700">
                      {selectedStaffData?.paymentEfficiencyPercent?.toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-lg">Final Payment Amount</CardTitle>
                    <p className="text-sm text-muted-foreground">Total compensation amount</p>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-700">
                      ${selectedStaffData?.finalPaymentAmount?.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="payment-details" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-green-100">
                  <CardHeader>
                    <CardTitle className="text-sm">Unscheduled % / Val</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">{selectedStaffData?.unscheduledPercent?.toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">${selectedStaffData?.unscheduledVal?.toLocaleString()}</div>
                  </CardContent>
                </Card>
                <Card className="bg-green-100">
                  <CardHeader>
                    <CardTitle className="text-sm">NoShow % / Val</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">{selectedStaffData?.noShowPercent?.toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">${selectedStaffData?.noShowVal?.toLocaleString()}</div>
                  </CardContent>
                </Card>
                <Card className="bg-green-100">
                  <CardHeader>
                    <CardTitle className="text-sm">Clinical % / Val</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">{selectedStaffData?.clinicalPercent?.toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">${selectedStaffData?.clinicalVal?.toLocaleString()}</div>
                  </CardContent>
                </Card>
                <Card className="bg-green-100">
                  <CardHeader>
                    <CardTitle className="text-sm">Additional % / Val</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">{selectedStaffData?.additionalPercent?.toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">${selectedStaffData?.additionalVal?.toLocaleString()}</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="treatment-rates" className="mt-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Treatment rates would come from the rates table */}
                <Card className="bg-cyan-50">
                  <CardHeader>
                    <CardTitle className="text-sm">Additional_H</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">{selectedStaffData?.additionalHours?.toFixed(1)}</div>
                  </CardContent>
                </Card>
                <Card className="bg-cyan-50">
                  <CardHeader>
                    <CardTitle className="text-sm">Intake Adult</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">{selectedStaffData?.intakeAdults}</div>
                  </CardContent>
                </Card>
                <Card className="bg-cyan-50">
                  <CardHeader>
                    <CardTitle className="text-sm">Follow up Adult</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">{selectedStaffData?.followUpAdults}</div>
                  </CardContent>
                </Card>
                <Card className="bg-cyan-50">
                  <CardHeader>
                    <CardTitle className="text-sm">Intake Child</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">{selectedStaffData?.intakeChild}</div>
                  </CardContent>
                </Card>
                <Card className="bg-cyan-50">
                  <CardHeader>
                    <CardTitle className="text-sm">Follow up Child</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">{selectedStaffData?.followUpChild}</div>
                  </CardContent>
                </Card>
                <Card className="bg-cyan-50">
                  <CardHeader>
                    <CardTitle className="text-sm">Follow up Youth</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">{selectedStaffData?.followUpYouth}</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="session-counts" className="mt-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card className="bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-sm">Intakes Adults</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">{selectedStaffData?.intakeAdults}</div>
                  </CardContent>
                </Card>
                <Card className="bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-sm">Follow ups Adult</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">{selectedStaffData?.followUpAdults}</div>
                  </CardContent>
                </Card>
                <Card className="bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-sm">Intake Youth</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">{selectedStaffData?.intakeYouth}</div>
                  </CardContent>
                </Card>
                <Card className="bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-sm">Follow up Youth</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">{selectedStaffData?.followUpYouth}</div>
                  </CardContent>
                </Card>
                <Card className="bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-sm">Additional Hours</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">{selectedStaffData?.additionalHours?.toFixed(1)}</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="hours-utilization" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="bg-pink-50">
                  <CardHeader>
                    <CardTitle className="text-sm">Scheduled Hours</CardTitle>
                    <p className="text-xs text-muted-foreground">Available hours</p>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">{selectedStaffData?.scheduledHours?.toFixed(1)}</div>
                  </CardContent>
                </Card>
                <Card className="bg-pink-50">
                  <CardHeader>
                    <CardTitle className="text-sm">Utilization % / Qty</CardTitle>
                    <p className="text-xs text-muted-foreground">Usage efficiency</p>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">{selectedStaffData?.workHoursPercent?.toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">{selectedStaffData?.workHoursQty?.toFixed(1)} hrs</div>
                  </CardContent>
                </Card>
                <Card className="bg-pink-50">
                  <CardHeader>
                    <CardTitle className="text-sm">Work Hours % / Qty</CardTitle>
                    <p className="text-xs text-muted-foreground">Actual work</p>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">{selectedStaffData?.workHoursPercent?.toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">{selectedStaffData?.workHoursQty?.toFixed(1)} hrs</div>
                  </CardContent>
                </Card>
                <Card className="bg-pink-50">
                  <CardHeader>
                    <CardTitle className="text-sm">No-Show % / Qty</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">{selectedStaffData?.noShowPercent?.toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">{selectedStaffData?.noShowVal?.toLocaleString()}</div>
                  </CardContent>
                </Card>
                <Card className="bg-pink-50">
                  <CardHeader>
                    <CardTitle className="text-sm">Unused Time % / Qty</CardTitle>
                    <p className="text-xs text-muted-foreground">General unused time</p>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">{selectedStaffData?.unscheduledPercent?.toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">{selectedStaffData?.unscheduledVal?.toLocaleString()}</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClinicalStaffMetrics;
