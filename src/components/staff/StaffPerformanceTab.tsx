import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFinance } from "@/context/FinanceContext";
import { StaffPerformanceMetrics } from "@/types/finance";
import { Pencil, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import SatisfactionScoreTab from "./SatisfactionScoreTab";

const StaffPerformanceTab: React.FC = () => {
  const { staffMembers, currentPeriod } = useFinance();
  const { toast } = useToast();
  
  const [performanceMetrics, setPerformanceMetrics] = useState<StaffPerformanceMetrics[]>([]);
  const [noShowRates, setNoShowRates] = useState<{[key: string]: number}>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMetrics, setCurrentMetrics] = useState<Omit<StaffPerformanceMetrics, "id"> & { id?: string }>({
    staffId: "",
    month: currentPeriod.month,
    year: currentPeriod.year,
    satisfactionScore: undefined,
    availableHours: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Fetch performance metrics for current period
  const fetchPerformanceMetrics = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('staff_performance_metrics')
        .select('*')
        .eq('month', currentPeriod.month)
        .eq('year', currentPeriod.year);

      if (error) throw error;

      const formattedMetrics = (data || []).map(metric => ({
        id: metric.id,
        staffId: metric.staff_id,
        month: metric.month,
        year: metric.year,
        satisfactionScore: metric.satisfaction_score || undefined,
        availableHours: metric.available_hours,
      }));

      setPerformanceMetrics(formattedMetrics);
    } catch (error) {
      console.error("Error fetching performance metrics:", error);
      toast({
        title: "Error",
        description: "Failed to fetch performance metrics.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate no-show rates for all clinical staff
  const calculateNoShowRates = async () => {
    const clinicalStaff = staffMembers.filter(s => s.role === "Psychiatrist" || s.role === "CaseManager");
    const rates: {[key: string]: number} = {};

    for (const staff of clinicalStaff) {
      try {
        const { data: noShowRate } = await supabase
          .rpc('calculate_staff_no_show_rate', {
            p_staff_id: staff.id,
            p_month: currentPeriod.month,
            p_year: currentPeriod.year
          });
        rates[staff.id] = noShowRate || 0;
      } catch (error) {
        console.error(`Error calculating no-show rate for ${staff.name}:`, error);
        rates[staff.id] = 0;
      }
    }

    setNoShowRates(rates);
  };

  useEffect(() => {
    fetchPerformanceMetrics();
    calculateNoShowRates();
  }, [currentPeriod, staffMembers]);

  // Get staff name by ID
  const getStaffNameById = (id: string) => {
    const staff = staffMembers.find(s => s.id === id);
    return staff ? staff.name : "Unknown Staff";
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);

      const metricsData = {
        staff_id: currentMetrics.staffId,
        month: currentMetrics.month,
        year: currentMetrics.year,
        satisfaction_score: currentMetrics.satisfactionScore || null,
        available_hours: currentMetrics.availableHours,
      };

      if (isEditing && currentMetrics.id) {
        const { error } = await supabase
          .from('staff_performance_metrics')
          .update(metricsData)
          .eq('id', currentMetrics.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Performance metrics updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from('staff_performance_metrics')
          .insert(metricsData);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Performance metrics added successfully.",
        });
      }

      setIsDialogOpen(false);
      fetchPerformanceMetrics();
    } catch (error) {
      console.error("Error saving performance metrics:", error);
      toast({
        title: "Error",
        description: "Failed to save performance metrics.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle edit metrics
  const handleEditMetrics = (metrics: StaffPerformanceMetrics) => {
    setCurrentMetrics({
      id: metrics.id,
      staffId: metrics.staffId,
      month: metrics.month,
      year: metrics.year,
      satisfactionScore: metrics.satisfactionScore,
      availableHours: metrics.availableHours,
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  // Handle add new metrics
  const handleAddMetrics = (staffId?: string) => {
    setCurrentMetrics({
      staffId: staffId || (staffMembers.length > 0 ? staffMembers[0].id : ""),
      month: currentPeriod.month,
      year: currentPeriod.year,
      satisfactionScore: undefined,
      availableHours: 0,
    });
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  // Get metrics for a staff member
  const getMetricsForStaff = (staffId: string) => {
    return performanceMetrics.find(m => m.staffId === staffId);
  };

  // Get clinical staff members only
  const clinicalStaff = staffMembers.filter(s => s.role === "Psychiatrist" || s.role === "CaseManager");

  return (
    <Tabs defaultValue="performance" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
        <TabsTrigger value="satisfaction">Satisfaction Scores</TabsTrigger>
      </TabsList>
      
      <TabsContent value="performance" className="space-y-4">
        <div className="flex justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium">Staff Performance Metrics</h3>
            <p className="text-sm text-muted-foreground">
              Track satisfaction scores, available hours, and no-show rates for {new Date(currentPeriod.year, currentPeriod.month - 1).toLocaleString('default', { month: 'long' })} {currentPeriod.year}
            </p>
          </div>
          <Button onClick={() => handleAddMetrics()}>
            <Plus className="mr-2 h-4 w-4" /> Add Metrics
          </Button>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead className="text-right">Satisfaction Score (%)</TableHead>
                  <TableHead className="text-right">Available Hours</TableHead>
                  <TableHead className="text-right">No-Show Rate (%)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clinicalStaff.length > 0 ? (
                  clinicalStaff.map((staff) => {
                    const metrics = getMetricsForStaff(staff.id);
                    const noShowRate = noShowRates[staff.id];
                    
                    return (
                      <TableRow key={staff.id}>
                        <TableCell>{staff.name}</TableCell>
                        <TableCell className="text-right">
                          {metrics?.satisfactionScore !== undefined ? `${metrics.satisfactionScore}%` : "Not set"}
                        </TableCell>
                        <TableCell className="text-right">
                          {metrics ? metrics.availableHours : "Not set"}
                        </TableCell>
                        <TableCell className="text-right">
                          {noShowRate !== undefined ? `${noShowRate}%` : "Calculating..."}
                        </TableCell>
                        <TableCell className="text-right">
                          {metrics ? (
                            <Button variant="ghost" size="icon" onClick={() => handleEditMetrics(metrics)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" onClick={() => handleAddMetrics(staff.id)}>
                              Add Metrics
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">No clinical staff members found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dialog for adding/editing metrics */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEditing ? "Edit Performance Metrics" : "Add Performance Metrics"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-2">
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="staffId">Staff Member</Label>
                  <select
                    id="staffId"
                    value={currentMetrics.staffId}
                    onChange={(e) => setCurrentMetrics({ ...currentMetrics, staffId: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                    disabled={isEditing}
                  >
                    <option value="">Select Staff Member</option>
                    {clinicalStaff.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name} ({staff.role})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="satisfactionScore">Satisfaction Score (0-100%)</Label>
                  <Input
                    id="satisfactionScore"
                    type="number"
                    min="0"
                    max="100"
                    value={currentMetrics.satisfactionScore || ""}
                    onChange={(e) => setCurrentMetrics({ 
                      ...currentMetrics, 
                      satisfactionScore: e.target.value ? Number(e.target.value) : undefined 
                    })}
                    placeholder="Enter satisfaction score"
                  />
                </div>

                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="availableHours">Available Hours (Bank Hours)</Label>
                  <Input
                    id="availableHours"
                    type="number"
                    min="0"
                    step="0.1"
                    value={currentMetrics.availableHours}
                    onChange={(e) => setCurrentMetrics({ 
                      ...currentMetrics, 
                      availableHours: Number(e.target.value) || 0 
                    })}
                    required
                  />
                </div>

                <div className="text-sm text-muted-foreground">
                  <strong>Note:</strong> No-show rate is calculated automatically based on clinical session data.
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : (isEditing ? "Update" : "Add")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </TabsContent>

      <TabsContent value="satisfaction">
        <SatisfactionScoreTab />
      </TabsContent>
    </Tabs>
  );
};

export default StaffPerformanceTab;
