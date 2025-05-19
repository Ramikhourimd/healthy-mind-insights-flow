
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
import { StaffMember, StaffRole } from "@/types/finance";
import { UserPlus, Edit, Trash2 } from "lucide-react";

// Staff form type
type StaffFormValues = {
  id?: string;
  name: string;
  role: StaffRole;
  active: boolean;
};

const StaffPage: React.FC = () => {
  const { staffMembers, currentPeriod } = useFinance();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  
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

  // Setup form
  const form = useForm<StaffFormValues>({
    defaultValues: {
      name: "",
      role: "Psychiatrist",
      active: true
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

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Staff Management</h1>
          <p className="text-gray-500 mt-1">
            Manage staff information and performance
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
      
      <p className="text-center text-sm text-muted-foreground mt-8">
        Note: In this demo version, staff changes are logged to the console but not persisted.
      </p>
    </div>
  );
};

export default StaffPage;
