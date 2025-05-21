import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useFinance } from "@/context/FinanceContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ClinicType, MeetingType, ShowStatus, ClinicalSession } from "@/types/finance";
import ExcelImporter from "@/components/excel/ExcelImporter";

const ExpensesPage: React.FC = () => {
  const { 
    fixedOverheads, 
    addFixedOverhead, 
    updateFixedOverhead, 
    deleteFixedOverhead, 
    currentPeriod, 
    financialSummary,
    clinicalSessions,
    staffMembers,
    addClinicalSession,
    updateClinicalSession,
    deleteClinicalSession,
    updateFinancialSummary
  } = useFinance();
  
  // Filter overheads for current period
  const filteredOverheads = fixedOverheads.filter(
    overhead => overhead.month === currentPeriod.month && overhead.year === currentPeriod.year
  );

  // Filter clinical sessions for current period
  const filteredSessions = clinicalSessions.filter(
    session => session.month === currentPeriod.month && session.year === currentPeriod.year
  );
  
  // Log filtered sessions whenever they change
  useEffect(() => {
    console.log("Current filtered sessions:", filteredSessions);
  }, [filteredSessions]);

  // State for the overhead form
  const [isOverheadDialogOpen, setIsOverheadDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentOverhead, setCurrentOverhead] = useState({
    id: "",
    name: "",
    monthlyCost: 0,
    month: currentPeriod.month,
    year: currentPeriod.year,
  });

  // State for the clinical session form
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [isSessionEditing, setIsSessionEditing] = useState(false);
  const [currentSession, setCurrentSession] = useState<Omit<ClinicalSession, "id"> & { id?: string }>({
    staffId: "",
    clinicType: "MCB" as ClinicType,
    meetingType: "Intake" as MeetingType,
    showStatus: "Show" as ShowStatus,
    count: 1,
    duration: 60,
    month: currentPeriod.month,
    year: currentPeriod.year,
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IL', { 
      style: 'currency', 
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Handle overhead form changes
  const handleOverheadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentOverhead({
      ...currentOverhead,
      [name]: name === "name" ? value : Number(value),
    });
  };

  // Handle clinical session form changes
  const handleSessionChange = (name: string, value: any) => {
    setCurrentSession({
      ...currentSession,
      [name]: value,
    });
  };

  // Handle overhead form submission
  const handleOverheadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      updateFixedOverhead(currentOverhead);
    } else {
      addFixedOverhead({
        name: currentOverhead.name,
        monthlyCost: currentOverhead.monthlyCost,
        month: currentPeriod.month,
        year: currentPeriod.year,
      });
    }
    handleCloseOverheadDialog();
  };

  // Handle clinical session form submission
  const handleSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSessionEditing && currentSession.id) {
      updateClinicalSession({
        id: currentSession.id,
        staffId: currentSession.staffId,
        clinicType: currentSession.clinicType,
        meetingType: currentSession.meetingType,
        showStatus: currentSession.showStatus,
        count: currentSession.count,
        duration: currentSession.duration,
        month: currentPeriod.month,
        year: currentPeriod.year,
      });
    } else {
      addClinicalSession({
        staffId: currentSession.staffId,
        clinicType: currentSession.clinicType,
        meetingType: currentSession.meetingType,
        showStatus: currentSession.showStatus,
        count: currentSession.count,
        duration: currentSession.duration,
        month: currentPeriod.month,
        year: currentPeriod.year,
      });
    }
    handleCloseSessionDialog();
  };

  // Edit an overhead
  const handleEditOverhead = (overhead: typeof currentOverhead) => {
    setCurrentOverhead(overhead);
    setIsEditing(true);
    setIsOverheadDialogOpen(true);
  };

  // Edit a clinical session
  const handleEditSession = (session: ClinicalSession) => {
    setCurrentSession(session);
    setIsSessionEditing(true);
    setIsSessionDialogOpen(true);
  };

  // Delete an overhead
  const handleDeleteOverhead = (id: string) => {
    if (confirm("Are you sure you want to delete this overhead expense?")) {
      deleteFixedOverhead(id);
    }
  };

  // Delete a clinical session
  const handleDeleteSession = (id: string) => {
    if (confirm("Are you sure you want to delete this clinical session?")) {
      deleteClinicalSession(id);
    }
  };

  // Open dialog for adding new overhead
  const handleAddNewOverhead = () => {
    setCurrentOverhead({
      id: "",
      name: "",
      monthlyCost: 0,
      month: currentPeriod.month,
      year: currentPeriod.year,
    });
    setIsEditing(false);
    setIsOverheadDialogOpen(true);
  };

  // Open dialog for adding new clinical session
  const handleAddNewSession = () => {
    setCurrentSession({
      staffId: staffMembers.length > 0 ? staffMembers[0].id : "",
      clinicType: "MCB" as ClinicType,
      meetingType: "Intake" as MeetingType,
      showStatus: "Show" as ShowStatus,
      count: 1,
      duration: 60,
      month: currentPeriod.month,
      year: currentPeriod.year,
    });
    setIsSessionEditing(false);
    setIsSessionDialogOpen(true);
  };

  // Close overhead dialog and reset form
  const handleCloseOverheadDialog = () => {
    setIsOverheadDialogOpen(false);
  };

  // Close clinical session dialog and reset form
  const handleCloseSessionDialog = () => {
    setIsSessionDialogOpen(false);
  };

  // Helper to find staff name by ID
  const getStaffNameById = (id: string) => {
    const staff = staffMembers.find(s => s.id === id);
    return staff ? staff.name : "Unknown Staff";
  };

  // Handle bulk import of clinical sessions with improved logging
  const handleImportSessions = (sessions: Omit<ClinicalSession, "id">[]) => {
    console.log("Importing sessions in ExpensesPage:", sessions);
    
    // Use this flag to track if we've finished adding all sessions
    let sessionsAdded = 0;
    
    sessions.forEach(session => {
      console.log(`Adding session for staff ${session.staffId}:`, session);
      addClinicalSession(session);
      sessionsAdded++;
      
      // If this is the last session, update financial summary
      if (sessionsAdded === sessions.length) {
        console.log("All sessions added, updating financial summary");
        setTimeout(() => {
          updateFinancialSummary();
          console.log("Financial summary updated after import");
        }, 100);
      }
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Expense Management</h1>
          <p className="text-gray-500 mt-1">
            Manage expenses for {new Date(currentPeriod.year, currentPeriod.month - 1).toLocaleString('default', { month: 'long' })} {currentPeriod.year}
          </p>
        </div>
      </div>

      <Tabs defaultValue="summary" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="fixed">Fixed Overheads</TabsTrigger>
          <TabsTrigger value="clinical">Clinical Staff</TabsTrigger>
          <TabsTrigger value="admin">Administrative Staff</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Expense Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Clinical Staff Costs</TableCell>
                    <TableCell className="text-right">{formatCurrency(financialSummary.totalClinicalCosts)}</TableCell>
                    <TableCell className="text-right">
                      {(financialSummary.totalClinicalCosts / financialSummary.totalExpenses * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Administrative Staff Costs</TableCell>
                    <TableCell className="text-right">{formatCurrency(financialSummary.totalAdminCosts)}</TableCell>
                    <TableCell className="text-right">
                      {(financialSummary.totalAdminCosts / financialSummary.totalExpenses * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Fixed Overheads</TableCell>
                    <TableCell className="text-right">{formatCurrency(financialSummary.totalFixedOverheads)}</TableCell>
                    <TableCell className="text-right">
                      {(financialSummary.totalFixedOverheads / financialSummary.totalExpenses * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-bold">Total Expenses</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(financialSummary.totalExpenses)}</TableCell>
                    <TableCell className="text-right font-bold">100%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fixed">
          <div className="flex justify-end mb-4">
            <Button onClick={handleAddNewOverhead}>
              <Plus className="mr-2 h-4 w-4" /> Add Fixed Overhead
            </Button>
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Fixed Overheads</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Overhead Name</TableHead>
                    <TableHead className="text-right">Monthly Cost</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOverheads.map((overhead) => (
                    <TableRow key={overhead.id}>
                      <TableCell>{overhead.name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(overhead.monthlyCost)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditOverhead(overhead)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteOverhead(overhead.id)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="font-bold">Total Fixed Overheads</TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(financialSummary.totalFixedOverheads)}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clinical">
          <div className="flex justify-between mb-4">
            <ExcelImporter 
              staffMembers={staffMembers}
              currentPeriod={currentPeriod}
              onImport={handleImportSessions}
            />
            <Button onClick={handleAddNewSession}>
              <Plus className="mr-2 h-4 w-4" /> Add Clinical Session
            </Button>
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Clinical Staff Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff</TableHead>
                    <TableHead>Clinic</TableHead>
                    <TableHead>Meeting Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                    <TableHead className="text-right">Duration (min)</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.length > 0 ? (
                    filteredSessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>{getStaffNameById(session.staffId)}</TableCell>
                        <TableCell>{session.clinicType}</TableCell>
                        <TableCell>{session.meetingType}</TableCell>
                        <TableCell>{session.showStatus}</TableCell>
                        <TableCell className="text-right">{session.count}</TableCell>
                        <TableCell className="text-right">{session.duration}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditSession(session)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteSession(session.id)}>
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">No clinical sessions recorded for this period</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {staffMembers.filter(s => s.role === "Psychiatrist" || s.role === "CaseManager").length > 0 ? (
            <div className="mt-6">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Session Summary by Staff</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Staff Member</TableHead>
                        <TableHead className="text-right">Intakes</TableHead>
                        <TableHead className="text-right">Follow-Ups</TableHead>
                        <TableHead className="text-right">No-Shows</TableHead>
                        <TableHead className="text-right">Total Sessions</TableHead>
                        <TableHead className="text-right">Total Hours</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staffMembers
                        .filter(staff => staff.role === "Psychiatrist" || staff.role === "CaseManager")
                        .map(staff => {
                          const staffSessions = filteredSessions.filter(s => s.staffId === staff.id);
                          const intakes = staffSessions.filter(s => s.meetingType === "Intake").reduce((sum, s) => sum + s.count, 0);
                          const followUps = staffSessions.filter(s => s.meetingType === "FollowUp").reduce((sum, s) => sum + s.count, 0);
                          const noShows = staffSessions.filter(s => s.showStatus === "NoShow").reduce((sum, s) => sum + s.count, 0);
                          const totalSessions = staffSessions.reduce((sum, s) => sum + s.count, 0);
                          const totalMinutes = staffSessions.reduce((sum, s) => sum + (s.count * s.duration), 0);
                          const totalHours = Math.round(totalMinutes / 60 * 10) / 10;

                          return (
                            <TableRow key={staff.id}>
                              <TableCell>{staff.name}</TableCell>
                              <TableCell className="text-right">{intakes}</TableCell>
                              <TableCell className="text-right">{followUps}</TableCell>
                              <TableCell className="text-right">{noShows}</TableCell>
                              <TableCell className="text-right">{totalSessions}</TableCell>
                              <TableCell className="text-right">{totalHours}</TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="admin">
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium">Administrative Staff Costs</CardTitle>
                <p className="text-sm text-muted-foreground">(Demo data - will be editable in full version)</p>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Base Salary</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Shira Lachmann</TableCell>
                    <TableCell>Clinic Manager</TableCell>
                    <TableCell className="text-right">{formatCurrency(15000)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(2500)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(17500)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Maya Cohen</TableCell>
                    <TableCell>Admin Assistant</TableCell>
                    <TableCell className="text-right">{formatCurrency(8500)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(0)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(8500)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={4} className="font-bold">Total Administrative Staff Costs</TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(financialSummary.totalAdminCosts)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog for Fixed Overhead */}
      <Dialog open={isOverheadDialogOpen} onOpenChange={setIsOverheadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Fixed Overhead" : "Add Fixed Overhead"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleOverheadSubmit}>
            <div className="space-y-4 py-2">
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="name">Overhead Name</Label>
                <Input 
                  id="name"
                  name="name"
                  value={currentOverhead.name}
                  onChange={handleOverheadChange}
                  required
                />
              </div>
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="monthlyCost">Monthly Cost (ILS)</Label>
                <Input 
                  id="monthlyCost"
                  name="monthlyCost"
                  type="number"
                  value={currentOverhead.monthlyCost}
                  onChange={handleOverheadChange}
                  required
                  min={0}
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={handleCloseOverheadDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {isEditing ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog for Clinical Sessions */}
      <Dialog open={isSessionDialogOpen} onOpenChange={setIsSessionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isSessionEditing ? "Edit Clinical Session" : "Add Clinical Session"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSessionSubmit}>
            <div className="space-y-4 py-2">
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="staffId">Staff Member</Label>
                <Select 
                  value={currentSession.staffId} 
                  onValueChange={(value) => handleSessionChange("staffId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Staff Member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffMembers
                      .filter(staff => staff.role === "Psychiatrist" || staff.role === "CaseManager")
                      .map(staff => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.name} ({staff.role})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="clinicType">Clinic Type</Label>
                <Select 
                  value={currentSession.clinicType} 
                  onValueChange={(value) => handleSessionChange("clinicType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Clinic Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MCB">MCB</SelectItem>
                    <SelectItem value="PRV">PRV</SelectItem>
                    <SelectItem value="MHS">MHS</SelectItem>
                    <SelectItem value="MHN">MHN</SelectItem>
                    <SelectItem value="MHY">MHY</SelectItem>
                    <SelectItem value="MSY">MSY</SelectItem>
                    <SelectItem value="SPC">SPC</SelectItem>
                    <SelectItem value="MHB">MHB</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="meetingType">Meeting Type</Label>
                <Select 
                  value={currentSession.meetingType} 
                  onValueChange={(value) => handleSessionChange("meetingType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Meeting Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Intake">Intake</SelectItem>
                    <SelectItem value="FollowUp">Follow-Up</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="showStatus">Show Status</Label>
                <Select 
                  value={currentSession.showStatus} 
                  onValueChange={(value) => handleSessionChange("showStatus", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Show">Show</SelectItem>
                    <SelectItem value="NoShow">No Show</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="count">Count (number of sessions)</Label>
                <Input 
                  id="count"
                  type="number"
                  value={currentSession.count}
                  onChange={(e) => handleSessionChange("count", parseInt(e.target.value) || 1)}
                  required
                  min={1}
                />
              </div>
              
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input 
                  id="duration"
                  type="number"
                  value={currentSession.duration}
                  onChange={(e) => handleSessionChange("duration", parseInt(e.target.value) || 30)}
                  required
                  min={15}
                  step={5}
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={handleCloseSessionDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {isSessionEditing ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpensesPage;
