
import React, { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { ClinicalSession, ClinicType, MeetingType, ShowStatus, StaffMember } from "@/types/finance";
import { FilePlus, Edit, Trash2, Users } from "lucide-react";

// Session form type
type SessionFormValues = {
  id?: string;
  staffId: string;
  clinicType: ClinicType;
  meetingType: MeetingType;
  showStatus: ShowStatus;
  count: number;
  duration: number;
};

const ClinicalSessionsPage: React.FC = () => {
  const { clinicalSessions, staffMembers, currentPeriod, addClinicalSession, updateClinicalSession, deleteClinicalSession } = useFinance();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSession, setEditingSession] = useState<ClinicalSession | null>(null);

  // Filter only clinical staff (Psychiatrists and Case Managers)
  const clinicalStaff = staffMembers.filter(
    (staff) => staff.role === "Psychiatrist" || staff.role === "CaseManager"
  );

  // Filter sessions for the current period
  const currentPeriodSessions = clinicalSessions.filter(
    (session) => session.month === currentPeriod.month && session.year === currentPeriod.year
  );

  // Setup form
  const form = useForm<SessionFormValues>({
    defaultValues: {
      staffId: "",
      clinicType: "MCB",
      meetingType: "Intake",
      showStatus: "Show",
      count: 1,
      duration: 60
    }
  });

  // Handle dialog open for adding new session
  const handleAddNew = () => {
    setEditingSession(null);
    form.reset({
      staffId: clinicalStaff.length > 0 ? clinicalStaff[0].id : "",
      clinicType: "MCB",
      meetingType: "Intake",
      showStatus: "Show",
      count: 1,
      duration: 60
    });
    setOpenDialog(true);
  };

  // Handle dialog open for editing session
  const handleEdit = (session: ClinicalSession) => {
    setEditingSession(session);
    form.reset({
      id: session.id,
      staffId: session.staffId,
      clinicType: session.clinicType,
      meetingType: session.meetingType,
      showStatus: session.showStatus,
      count: session.count,
      duration: session.duration
    });
    setOpenDialog(true);
  };

  // Handle form submission
  const onSubmit = (data: SessionFormValues) => {
    if (editingSession) {
      updateClinicalSession({
        ...data,
        id: editingSession.id,
        month: currentPeriod.month,
        year: currentPeriod.year
      } as ClinicalSession);
    } else {
      addClinicalSession({
        ...data,
        month: currentPeriod.month,
        year: currentPeriod.year
      });
    }
    setOpenDialog(false);
  };

  // Helper function to get staff name by ID
  const getStaffName = (id: string): string => {
    const staff = staffMembers.find((s) => s.id === id);
    return staff ? staff.name : "Unknown Staff";
  };

  // Helper function for show status badge
  const getShowStatusBadge = (status: ShowStatus) => {
    return status === "Show" 
      ? <Badge className="bg-green-500">Show</Badge> 
      : <Badge variant="outline" className="text-red-500 border-red-500">No Show</Badge>;
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Clinical Sessions</h1>
          <p className="text-gray-500 mt-1">
            Track and manage clinical staff sessions
          </p>
        </div>
        <Button onClick={handleAddNew} className="flex items-center gap-2">
          <FilePlus className="h-4 w-4" />
          Add Session
        </Button>
      </div>
      
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium">Session Records</CardTitle>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-muted-foreground">{currentPeriodSessions.length} sessions</span>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff</TableHead>
                <TableHead>Clinic</TableHead>
                <TableHead>Meeting Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Duration (min)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentPeriodSessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>{getStaffName(session.staffId)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{session.clinicType}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={session.meetingType === "Intake" ? "bg-clinic-blue" : "bg-clinic-purple"}>
                      {session.meetingType}
                    </Badge>
                  </TableCell>
                  <TableCell>{getShowStatusBadge(session.showStatus)}</TableCell>
                  <TableCell>{session.count}</TableCell>
                  <TableCell>{session.duration}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(session)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-500 hover:text-red-600" 
                        onClick={() => deleteClinicalSession(session.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {currentPeriodSessions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    No sessions recorded for the current period. Click "Add Session" to create one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Session Edit/Add Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSession ? 'Edit Session' : 'Add New Session'}</DialogTitle>
            <DialogDescription>
              Record clinical staff session details
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="staffId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Staff Member</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select staff member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clinicalStaff.map((staff) => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.name} ({staff.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="clinicType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clinic Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select clinic type" />
                        </SelectTrigger>
                      </FormControl>
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
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="meetingType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meeting Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select meeting type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Intake">Intake</SelectItem>
                          <SelectItem value="FollowUp">Follow-up</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="showStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Show Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Show">Show</SelectItem>
                          <SelectItem value="NoShow">No Show</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Count</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Number of sessions" 
                          min="1" 
                          {...field} 
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Session duration" 
                          min="15"
                          step="5"
                          {...field} 
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingSession ? 'Save Changes' : 'Add Session'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <p className="text-center text-sm text-muted-foreground mt-8">
        Note: In this demo version, session changes are logged to the console but not fully persisted.
      </p>
    </div>
  );
};

export default ClinicalSessionsPage;
