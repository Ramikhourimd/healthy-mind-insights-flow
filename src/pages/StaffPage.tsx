
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinance } from "@/context/FinanceContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { StaffMember, StaffRole, ClinicalStaffRates } from "@/types/finance";
import { UserPlus, Edit, Trash2, DollarSign } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  perSessionRate: number;
  noShowCompRate: number;
  availabilityRetainerRate: number;
  adminTrainingRate: number;
};

const StaffPage: React.FC = () => {
  const { staffMembers, currentPeriod } = useFinance();
  const [openDialog, setOpenDialog] = useState(false);
  const [openRatesDialog, setOpenRatesDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  
  // Mock functions for staff management (would connect to FinanceContext in a complete version)
  const addStaffMember = (staff: Omit<StaffMember, "id">) => {
    console.log("Adding staff member:", staff);
    // Would call a context method in the complete version
  };

  const updateStaffMember = (staff: StaffMember) => {
    console.log("Updating staff member:", staff);
    // Would call a context method in the complete version
  };

  const deleteStaffMember = (id: string) => {
    console.log("Deleting staff member:", id);
    // Would call a context method in the complete version
  };

  const updateStaffRates = (rates: ClinicalStaffRates) => {
    console.log("Updating staff rates:", rates);
    // Would call a context method in the complete version
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
      perSessionRate: 0,
      noShowCompRate: 0,
      availabilityRetainerRate: 0,
      adminTrainingRate: 0
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
    
    // Get staff rates (mock implementation)
    // In a real implementation, we would fetch the rates from the context
    const staffRates = {
      staffId: staff.id,
      perSessionRate: 500, // Default values, would be loaded from context
      noShowCompRate: 200,
      availabilityRetainerRate: 150,
      adminTrainingRate: 250
    };
    
    ratesForm.reset(staffRates);
    setOpenRatesDialog(true);
  };

  // Handle form submission
  const onSubmit = (data: StaffFormValues) => {
    if (editingStaff) {
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
          </DialogHeader>
          <Form {...ratesForm}>
            <form onSubmit={ratesForm.handleSubmit(onRatesSubmit)} className="space-y-4">
              <Tabs defaultValue="work" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="work">Work Rates</TabsTrigger>
                  <TabsTrigger value="other">Other Rates</TabsTrigger>
                </TabsList>
                
                <TabsContent value="work" className="space-y-4 pt-4">
                  <FormField
                    control={ratesForm.control}
                    name="perSessionRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment fee for Actual Work (₪)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter amount"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Rate paid for intake and follow-up sessions
                        </p>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={ratesForm.control}
                    name="noShowCompRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment fee for No-show (₪)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter amount"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Compensation for scheduled sessions where patient didn't show up
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
                    name="adminTrainingRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment for Administrative/Training Hour (₪)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter amount"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Rate paid for administrative work and training hours
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
