
import React, { useState, useEffect } from "react";
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
import { UserPlus, Edit, Trash2, DollarSign, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

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
  const { 
    staffMembers,
    clinicalStaffRates,
    addStaffMember,
    updateStaffMember,
    deleteStaffMember,
    addStaffRates,
    updateStaffRates,
    getStaffRates,
    isLoading
  } = useFinance();
  
  const [openDialog, setOpenDialog] = useState(false);
  const [openRatesDialog, setOpenRatesDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [loadingRates, setLoadingRates] = useState(false);
  const { toast } = useToast();
  
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
  const handleEditRates = async (staff: StaffMember) => {
    setSelectedStaff(staff);
    setLoadingRates(true);
    
    try {
      // Get staff rates from context
      const staffRatesData = await getStaffRates(staff.id);
      
      if (staffRatesData) {
        ratesForm.reset({
          staffId: staff.id,
          intakeSessionRate: staffRatesData.intakeSessionRate,
          followUpSessionRate: staffRatesData.followUpSessionRate,
          noShowIntakeRate: staffRatesData.noShowIntakeRate,
          noShowFollowUpRate: staffRatesData.noShowFollowUpRate,
          availabilityRetainerRate: staffRatesData.availabilityRetainerRate,
          adminRate: staffRatesData.adminRate,
          trainingRate: staffRatesData.trainingRate,
        });
      } else {
        // Set default rates
        ratesForm.reset({
          staffId: staff.id,
          intakeSessionRate: 600,
          followUpSessionRate: 450,
          noShowIntakeRate: 300,
          noShowFollowUpRate: 200,
          availabilityRetainerRate: 150,
          adminRate: 250,
          trainingRate: 250
        });
      }
    } catch (error) {
      console.error("Error loading rates:", error);
      toast({
        title: "Error",
        description: "Failed to load staff rates",
        variant: "destructive",
      });
    } finally {
      setLoadingRates(false);
      setOpenRatesDialog(true);
    }
  };

  // Handle form submission
  const onSubmit = async (data: StaffFormValues) => {
    if (editingStaff) {
      // Ensure we include the ID in the updated staff member object
      await updateStaffMember({
        ...data,
        id: editingStaff.id
      } as StaffMember);
    } else {
      await addStaffMember(data);
    }
    setOpenDialog(false);
  };

  // Handle rates form submission
  const onRatesSubmit = async (data: StaffRatesFormValues) => {
    if (selectedStaff) {
      // Check if we already have rates for this staff in the database
      const existingRates = clinicalStaffRates.find(r => r.staffId === selectedStaff.id);
      
      if (existingRates) {
        // Update existing rates
        await updateStaffRates({
          ...data,
          id: existingRates.id,
          effectiveDate: existingRates.effectiveDate
        } as ClinicalStaffRates);
      } else {
        // Add new rates
        await addStaffRates({
          ...data,
          effectiveDate: new Date().toISOString()
        });
      }
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
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading staff data...</span>
            </div>
          ) : (
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
                {staffMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No staff members found. Click "Add Staff Member" to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  staffMembers.map((staff) => (
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
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-500 hover:text-red-600" 
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this staff member?")) {
                                deleteStaffMember(staff.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
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
          
          {loadingRates ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2">Loading rates data...</span>
            </div>
          ) : (
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
          )}
        </DialogContent>
      </Dialog>
      
    </div>
  );
};

export default StaffPage;
