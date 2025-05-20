
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinance } from "@/context/FinanceContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { StaffMember, StaffRole, ClinicalStaffRates } from "@/types/finance";
import { UserPlus, Edit, Trash2, DollarSign } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";

// Staff form type
type StaffFormValues = {
  id?: string;
  name: string;
  role: StaffRole;
  active: boolean;
};

// Staff rates form type
type StaffRatesFormValues = {
  staffId: string;
  intakeSessionRate: number;
  followUpSessionRate: number;
  noShowIntakeRate: number;
  noShowFollowUpRate: number;
  availabilityRetainerRate: number;
  adminRate: number;
  trainingRate: number;
};

const StaffPage: React.FC = () => {
  const { staffMembers: initialStaffMembers, currentPeriod } = useFinance();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(initialStaffMembers);
  const [staffRates, setStaffRates] = useState<ClinicalStaffRates[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openRatesDialog, setOpenRatesDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const { toast } = useToast();
  
  // Staff management functions
  const addStaffMember = (staff: Omit<StaffMember, "id">) => {
    const newStaff = {
      ...staff,
      id: uuidv4()
    } as StaffMember;
    
    setStaffMembers(prev => [...prev, newStaff]);
    toast({
      title: "Staff Added",
      description: `${staff.name} has been added to the staff list.`,
    });
    console.log("Adding staff member:", staff);
  };

  const updateStaffMember = (staff: StaffMember) => {
    setStaffMembers(prev => prev.map(s => s.id === staff.id ? staff : s));
    toast({
      title: "Staff Updated",
      description: `${staff.name}'s information has been updated.`,
    });
    console.log("Updating staff member:", staff);
  };

  const deleteStaffMember = (id: string) => {
    const staffToDelete = staffMembers.find(s => s.id === id);
    if (staffToDelete) {
      setStaffMembers(prev => prev.filter(s => s.id !== id));
      toast({
        title: "Staff Removed",
        description: `${staffToDelete.name} has been removed from the staff list.`,
        variant: "destructive"
      });
    }
    console.log("Deleting staff member:", id);
  };

  const updateStaffRates = (rates: ClinicalStaffRates) => {
    // Check if rates already exist for this staff
    const existingRatesIndex = staffRates.findIndex(r => r.staffId === rates.staffId);
    
    if (existingRatesIndex >= 0) {
      // Update existing rates
      setStaffRates(prev => prev.map((r, index) => 
        index === existingRatesIndex ? rates : r
      ));
    } else {
      // Add new rates
      setStaffRates(prev => [...prev, rates]);
    }
    
    toast({
      title: "Rates Updated",
      description: `Payment rates have been updated.`,
    });
    console.log("Updating staff rates:", rates);
  };

  // Get staff rates by staff ID
  const getStaffRates = (staffId: string) => {
    const existingRates = staffRates.find(r => r.staffId === staffId);
    
    if (existingRates) {
      return existingRates;
    }
    
    // Return default rates if none exist
    return {
      staffId,
      intakeSessionRate: 600,
      followUpSessionRate: 450,
      noShowIntakeRate: 300,
      noShowFollowUpRate: 200,
      availabilityRetainerRate: 150,
      adminRate: 250,
      trainingRate: 250
    } as ClinicalStaffRates;
  };

  // Setup forms
  const form = useForm<StaffFormValues>({
    defaultValues: {
      name: "",
      role: "Psychiatrist",
      active: true
    }
  });

  const ratesForm = useForm<StaffRatesFormValues>({
    defaultValues: {
      staffId: "",
      intakeSessionRate: 0,
      followUpSessionRate: 0,
      noShowIntakeRate: 0,
      noShowFollowUpRate: 0,
      availabilityRetainerRate: 0,
      adminRate: 0,
      trainingRate: 0
    }
  });

  // Handle dialog open for adding new staff
  const handleAddNew = () => {
    setEditingStaff(null);
    form.reset({
      name: "",
      role: "Psychiatrist",
      active: true
    });
    setOpenDialog(true);
  };

  // Handle dialog open for editing staff
  const handleEdit = (staff: StaffMember) => {
    setEditingStaff(staff);
    form.reset({
      id: staff.id,
      name: staff.name,
      role: staff.role,
      active: staff.active
    });
    setOpenDialog(true);
  };

  // Handle dialog open for payment rates
  const handleEditRates = (staff: StaffMember) => {
    setSelectedStaff(staff);
    
    // Get staff rates from state
    const staffRatesData = getStaffRates(staff.id);
    
    ratesForm.reset(staffRatesData);
    setOpenRatesDialog(true);
  };

  // Handle form submission
  const onSubmit = (data: StaffFormValues) => {
    if (editingStaff) {
      // Ensure we include the ID in the updated staff member object
      updateStaffMember({
        ...data,
        id: editingStaff.id
      } as StaffMember);
    } else {
      addStaffMember(data);
    }
    setOpenDialog(false);
  };

  // Handle rates form submission
  const onRatesSubmit = (data: StaffRatesFormValues) => {
    if (selectedStaff) {
      updateStaffRates({
        ...data,
        id: `rate-${selectedStaff.id}`, // Generate a rates ID
        effectiveDate: new Date().toISOString() // Set current date as effective date
      } as ClinicalStaffRates);
    }
    setOpenRatesDialog(false);
  };

  // Helper function for role badge
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "Psychiatrist":
        return <Badge className="bg-clinic-blue">Psychiatrist</Badge>;
      case "CaseManager":
        return <Badge className="bg-clinic-purple">Case Manager</Badge>;
      case "Admin":
        return <Badge className="bg-clinic-teal">Admin</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  // Determine if staff is clinical (Psychiatrist or CaseManager)
  const isClinicalStaff = (role: StaffRole) => {
    return role === "Psychiatrist" || role === "CaseManager";
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Staff Management</h1>
          <p className="text-gray-500 mt-1">
            Manage staff information and payment rates
          </p>
        </div>
        <Button onClick={handleAddNew} className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Add Staff Member
        </Button>
      </div>
      
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Staff Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffMembers.map((staff) => (
                <TableRow key={staff.id}>
                  <TableCell>{staff.name}</TableCell>
                  <TableCell>{getRoleBadge(staff.role)}</TableCell>
                  <TableCell>
                    <Badge variant={staff.active ? "default" : "outline"}>
                      {staff.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {isClinicalStaff(staff.role) && (
                        <Button variant="outline" size="sm" onClick={() => handleEditRates(staff)}>
                          <DollarSign className="h-4 w-4" />
                          <span className="sr-only">Payment Rates</span>
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => handleEdit(staff)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600" onClick={() => deleteStaffMember(staff.id)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Staff Edit/Add Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}</DialogTitle>
            <DialogDescription>
              {editingStaff ? 'Update staff member details' : 'Add a new staff member to the system'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormItem>
                <FormLabel>Role</FormLabel>
                <FormControl>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    {...form.register("role")}
                  >
                    <option value="Psychiatrist">Psychiatrist</option>
                    <option value="CaseManager">Case Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </FormControl>
              </FormItem>
              
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                <FormControl>
                  <input
                    type="checkbox"
                    className="focus:ring-0 h-4 w-4 rounded"
                    {...form.register("active")}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Active Status</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Is this staff member currently active?
                  </p>
                </div>
              </FormItem>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingStaff ? 'Save Changes' : 'Add Staff Member'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Payment Rates Dialog */}
      <Dialog open={openRatesDialog} onOpenChange={setOpenRatesDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Payment Rates for {selectedStaff?.name}
            </DialogTitle>
            <DialogDescription>
              Configure payment rates for different types of work
            </DialogDescription>
          </DialogHeader>
          <Form {...ratesForm}>
            <form onSubmit={ratesForm.handleSubmit(onRatesSubmit)} className="space-y-4">
              <Tabs defaultValue="sessions" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="sessions">Sessions</TabsTrigger>
                  <TabsTrigger value="noshows">No Shows</TabsTrigger>
                  <TabsTrigger value="other">Other Rates</TabsTrigger>
                </TabsList>
                
                <TabsContent value="sessions" className="space-y-4 pt-4">
                  <FormField
                    control={ratesForm.control}
                    name="intakeSessionRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment fee for Intake (₪)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter amount"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Rate paid for intake sessions
                        </p>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={ratesForm.control}
                    name="followUpSessionRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment fee for Follow-up (₪)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter amount"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Rate paid for follow-up sessions
                        </p>
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                <TabsContent value="noshows" className="space-y-4 pt-4">
                  <FormField
                    control={ratesForm.control}
                    name="noShowIntakeRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment fee for No-show Intake (₪)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter amount"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Compensation for scheduled intake sessions where patient didn't show up
                        </p>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={ratesForm.control}
                    name="noShowFollowUpRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment fee for No-show Follow-up (₪)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter amount"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Compensation for scheduled follow-up sessions where patient didn't show up
                        </p>
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                <TabsContent value="other" className="space-y-4 pt-4">
                  <FormField
                    control={ratesForm.control}
                    name="availabilityRetainerRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment fee for Idle Hour (₪)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter amount"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Rate paid for hours where the clinician is available but not scheduled
                        </p>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={ratesForm.control}
                    name="adminRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment for Administrative Hour (₪)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter amount"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Rate paid for administrative work hours
                        </p>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={ratesForm.control}
                    name="trainingRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment for Training Hour (₪)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter amount"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Rate paid for training hours
                        </p>
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenRatesDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Rates
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <p className="text-center text-sm text-muted-foreground mt-8">
        Note: In this demo version, staff and rate changes are logged to the console but not persisted.
      </p>
    </div>
  );
};

export default StaffPage;
