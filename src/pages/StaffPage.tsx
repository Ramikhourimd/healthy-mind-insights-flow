import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useFinance } from "@/context/FinanceContext";
import { StaffMember, ClinicalStaffRates } from "@/types/finance";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useToast } from "@/components/ui/use-toast";

const StaffPage: React.FC = () => {
  const { toast } = useToast();
  const {
    staffMembers,
    addStaffMember,
    updateStaffMember,
    deleteStaffMember,
    clinicalStaffRates,
    addStaffRates,
    updateStaffRates,
    getStaffRates,
    isLoading,
  } = useFinance();

  // State for staff dialog
  const [isStaffDialogOpen, setIsStaffDialogOpen] = useState(false);
  const [isStaffEditing, setIsStaffEditing] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<Omit<StaffMember, "id"> & { id?: string }>({
    name: "",
    role: "Psychiatrist",
    startDate: undefined,
    endDate: undefined,
    active: true,
  });

  // State for rates dialog
  const [isRatesDialogOpen, setIsRatesDialogOpen] = useState(false);
  const [isRatesEditing, setIsRatesEditing] = useState(false);
  const [currentRates, setCurrentRates] = useState<Omit<ClinicalStaffRates, "id"> & { id?: string }>({
    staffId: "",
    intakeSessionRate: 0,
    followUpSessionRate: 0,
    noShowIntakeRate: 0,
    noShowFollowUpRate: 0,
    availabilityRetainerRate: 0,
    adminRate: 0,
    trainingRate: 0,
    effectiveDate: new Date().toISOString(),
  });

  // Date state for staff member start and end dates
  const [date, setDate] = React.useState<Date | undefined>(undefined)
  const [dateRange, setDateRange] = React.useState<[Date | undefined, Date | undefined]>([
    undefined,
    undefined,
  ])

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Handle staff form changes
  const handleStaffChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;
    setCurrentStaff({
      ...currentStaff,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Handle staff form submission
  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isStaffEditing && currentStaff.id) {
        await updateStaffMember({
          id: currentStaff.id,
          name: currentStaff.name,
          role: currentStaff.role as "Psychiatrist" | "CaseManager" | "Admin",
          startDate: currentStaff.startDate,
          endDate: currentStaff.endDate,
          active: currentStaff.active,
        });
      } else {
        await addStaffMember({
          name: currentStaff.name,
          role: currentStaff.role as "Psychiatrist" | "CaseManager" | "Admin",
          startDate: currentStaff.startDate,
          endDate: currentStaff.endDate,
          active: currentStaff.active,
        });
      }
      handleCloseStaffDialog();
    } catch (error) {
      console.error("Error with staff operation:", error);
    }
  };

  // Handle rates form changes
  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentRates({
      ...currentRates,
      [name]: Number(value) || 0, // Ensure conversion to number
    });
  };

  // Handle rates form submission
  const handleRatesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isRatesEditing && currentRates.id) {
        await updateStaffRates({
          id: currentRates.id,
          staffId: currentRates.staffId,
          intakeSessionRate: currentRates.intakeSessionRate,
          followUpSessionRate: currentRates.followUpSessionRate,
          noShowIntakeRate: currentRates.noShowIntakeRate,
          noShowFollowUpRate: currentRates.noShowFollowUpRate,
          availabilityRetainerRate: currentRates.availabilityRetainerRate,
          adminRate: currentRates.adminRate,
          trainingRate: currentRates.trainingRate,
          effectiveDate: currentRates.effectiveDate,
        });
      } else {
        await addStaffRates({
          staffId: currentRates.staffId,
          intakeSessionRate: currentRates.intakeSessionRate,
          followUpSessionRate: currentRates.followUpSessionRate,
          noShowIntakeRate: currentRates.noShowIntakeRate,
          noShowFollowUpRate: currentRates.noShowFollowUpRate,
          availabilityRetainerRate: currentRates.availabilityRetainerRate,
          adminRate: currentRates.adminRate,
          trainingRate: currentRates.trainingRate,
          effectiveDate: currentRates.effectiveDate,
        });
      }
      handleCloseRatesDialog();
    } catch (error) {
      console.error("Error with rates operation:", error);
    }
  };

  // Edit a staff member
  const handleEditStaff = (staff: StaffMember) => {
    setCurrentStaff(staff);
    setIsStaffEditing(true);
    setIsStaffDialogOpen(true);
  };

  // Edit staff rates
  const handleEditRates = async (staffId: string) => {
    const rates = await getStaffRates(staffId);
    if (rates) {
      setCurrentRates({
        ...rates,
        staffId: staffId,
      });
      setIsRatesEditing(true);
      setIsRatesDialogOpen(true);
    } else {
      toast({
        title: "No Rates Found",
        description: "No payment rates found for this staff member. Please add rates.",
        variant: "destructive",
      });
    }
  };

  // Delete a staff member
  const handleDeleteStaff = (id: string) => {
    if (confirm("Are you sure you want to delete this staff member?")) {
      deleteStaffMember(id);
    }
  };

  // Open dialog for adding new staff member
  const handleAddNewStaff = () => {
    setCurrentStaff({
      name: "",
      role: "Psychiatrist",
      startDate: undefined,
      endDate: undefined,
      active: true,
    });
    setIsStaffEditing(false);
    setIsStaffDialogOpen(true);
  };

  // Open dialog for adding new staff rates
  const handleAddNewRates = () => {
    setCurrentRates({
      staffId: staffMembers.length > 0 ? staffMembers[0].id : "",
      intakeSessionRate: 0,
      followUpSessionRate: 0,
      noShowIntakeRate: 0,
      noShowFollowUpRate: 0,
      availabilityRetainerRate: 0,
      adminRate: 0,
      trainingRate: 0,
      effectiveDate: new Date().toISOString(),
    });
    setIsRatesEditing(false);
    setIsRatesDialogOpen(true);
  };

  // Close staff dialog and reset form
  const handleCloseStaffDialog = () => {
    setIsStaffDialogOpen(false);
  };

  // Close rates dialog and reset form
  const handleCloseRatesDialog = () => {
    setIsRatesDialogOpen(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Staff Management</h1>
          <p className="text-gray-500 mt-1">
            Manage staff members and their payment rates
          </p>
        </div>
      </div>

      <div className="flex justify-end mb-4">
        <Button onClick={handleAddNewStaff}>
          <Plus className="mr-2 h-4 w-4" /> Add Staff Member
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Staff Members</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffMembers.map((staff) => (
                <TableRow key={staff.id}>
                  <TableCell>{staff.name}</TableCell>
                  <TableCell>{staff.role}</TableCell>
                  <TableCell>{staff.active ? "Yes" : "No"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditStaff(staff)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteStaff(staff.id)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => handleEditRates(staff.id)}>
                        Edit Rates
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog for Staff Member */}
      <Dialog open={isStaffDialogOpen} onOpenChange={setIsStaffDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isStaffEditing ? "Edit Staff Member" : "Add Staff Member"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleStaffSubmit}>
            <div className="space-y-4 py-2">
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={currentStaff.name}
                  onChange={handleStaffChange}
                  required
                />
              </div>
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  id="role"
                  name="role"
                  value={currentStaff.role}
                  onValueChange={(value) => setCurrentStaff({ ...currentStaff, role: value as "Psychiatrist" | "CaseManager" | "Admin" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Psychiatrist">Psychiatrist</SelectItem>
                    <SelectItem value="CaseManager">Case Manager</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !currentStaff.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {currentStaff.startDate ? (
                        format(new Date(currentStaff.startDate), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={currentStaff.startDate ? new Date(currentStaff.startDate) : undefined}
                      onSelect={(date) => {
                        const selectedDate = date ? format(date, "yyyy-MM-dd") : undefined;
                        setCurrentStaff({ ...currentStaff, startDate: selectedDate });
                      }}
                      disabled={(date) =>
                        date > new Date()
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="endDate">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !currentStaff.endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {currentStaff.endDate ? (
                        format(new Date(currentStaff.endDate), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={currentStaff.endDate ? new Date(currentStaff.endDate) : undefined}
                      onSelect={(date) => {
                        const selectedDate = date ? format(date, "yyyy-MM-dd") : undefined;
                        setCurrentStaff({ ...currentStaff, endDate: selectedDate });
                      }}
                      disabled={(date) =>
                        date > new Date()
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="active">Active</Label>
                <Input
                  id="active"
                  name="active"
                  type="checkbox"
                  checked={currentStaff.active}
                  onChange={handleStaffChange}
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={handleCloseStaffDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {isStaffEditing ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog for Staff Rates */}
      <Dialog open={isRatesDialogOpen} onOpenChange={setIsRatesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isRatesEditing ? "Edit Staff Rates" : "Add Staff Rates"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRatesSubmit}>
            <div className="space-y-4 py-2">
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="staffId">Staff Member</Label>
                <Select
                  value={currentRates.staffId}
                  onValueChange={(value) => setCurrentRates({ ...currentRates, staffId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Staff Member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffMembers.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.name} ({staff.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="intakeSessionRate">Intake Session Rate (ILS)</Label>
                <Input
                  id="intakeSessionRate"
                  name="intakeSessionRate"
                  type="number"
                  value={currentRates.intakeSessionRate}
                  onChange={handleRateChange}
                  required
                  min={0}
                />
              </div>
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="followUpSessionRate">Follow-Up Session Rate (ILS)</Label>
                <Input
                  id="followUpSessionRate"
                  name="followUpSessionRate"
                  type="number"
                  value={currentRates.followUpSessionRate}
                  onChange={handleRateChange}
                  required
                  min={0}
                />
              </div>
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="noShowIntakeRate">No-Show Intake Rate (ILS)</Label>
                <Input
                  id="noShowIntakeRate"
                  name="noShowIntakeRate"
                  type="number"
                  value={currentRates.noShowIntakeRate}
                  onChange={handleRateChange}
                  required
                  min={0}
                />
              </div>
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="noShowFollowUpRate">No-Show Follow-Up Rate (ILS)</Label>
                <Input
                  id="noShowFollowUpRate"
                  name="noShowFollowUpRate"
                  type="number"
                  value={currentRates.noShowFollowUpRate}
                  onChange={handleRateChange}
                  required
                  min={0}
                />
              </div>
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="availabilityRetainerRate">Availability Retainer Rate (ILS)</Label>
                <Input
                  id="availabilityRetainerRate"
                  name="availabilityRetainerRate"
                  type="number"
                  value={currentRates.availabilityRetainerRate}
                  onChange={handleRateChange}
                  required
                  min={0}
                />
              </div>
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="adminRate">Admin Rate (ILS)</Label>
                <Input
                  id="adminRate"
                  name="adminRate"
                  type="number"
                  value={currentRates.adminRate}
                  onChange={handleRateChange}
                  required
                  min={0}
                />
              </div>
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="trainingRate">Training Rate (ILS)</Label>
                <Input
                  id="trainingRate"
                  name="trainingRate"
                  type="number"
                  value={currentRates.trainingRate}
                  onChange={handleRateChange}
                  required
                  min={0}
                />
              </div>
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="effectiveDate">Effective Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !currentRates.effectiveDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {currentRates.effectiveDate ? (
                        format(new Date(currentRates.effectiveDate), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={currentRates.effectiveDate ? new Date(currentRates.effectiveDate) : undefined}
                      onSelect={(date) => {
                        const selectedDate = date ? format(date, "yyyy-MM-dd") : undefined;
                        setCurrentRates({ ...currentRates, effectiveDate: selectedDate });
                      }}
                      disabled={(date) =>
                        date > new Date()
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={handleCloseRatesDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {isRatesEditing ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffPage;
