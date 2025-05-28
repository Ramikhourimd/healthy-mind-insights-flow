
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useFinance } from "@/context/FinanceContext";
import { toast } from "sonner";
import { Plus, Pencil, Trash } from "lucide-react";
import { ClinicRate, ClinicType, MeetingType, StaffRole } from "@/types/finance";

const ClinicRatesTab: React.FC = () => {
  const { clinicRates, addClinicRate, updateClinicRate, deleteClinicRate } = useFinance();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRate, setCurrentRate] = useState<Partial<ClinicRate>>({
    clinicType: "MCB",
    meetingType: "Intake",
    staffRole: "Psychiatrist",
    rate: 0
  });

  const clinicTypes: ClinicType[] = ["MCB", "PRV", "MHS", "MHN", "MHY", "MSY", "SPC", "MHB"];
  const meetingTypes: MeetingType[] = ["Intake", "FollowUp"];
  const staffRoles: StaffRole[] = ["Psychiatrist", "CaseManager"];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IL', { 
      style: 'currency', 
      currency: 'ILS',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleSave = async () => {
    try {
      if (!currentRate.clinicType || !currentRate.meetingType || !currentRate.staffRole || !currentRate.rate) {
        toast.error("Please fill in all fields");
        return;
      }

      if (isEditing && currentRate.id) {
        await updateClinicRate(currentRate as ClinicRate);
        toast.success("Rate updated successfully");
      } else {
        await addClinicRate(currentRate as Omit<ClinicRate, "id">);
        toast.success("Rate added successfully");
      }
      
      setIsDialogOpen(false);
      setCurrentRate({
        clinicType: "MCB",
        meetingType: "Intake", 
        staffRole: "Psychiatrist",
        rate: 0
      });
    } catch (error) {
      toast.error(isEditing ? "Failed to update rate" : "Failed to add rate");
    }
  };

  const handleEdit = (rate: ClinicRate) => {
    setCurrentRate(rate);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this rate?")) {
      try {
        await deleteClinicRate(id);
        toast.success("Rate deleted successfully");
      } catch (error) {
        toast.error("Failed to delete rate");
      }
    }
  };

  const handleAddNew = () => {
    setCurrentRate({
      clinicType: "MCB",
      meetingType: "Intake",
      staffRole: "Psychiatrist", 
      rate: 0
    });
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  // Group rates by clinic type for better display
  const groupedRates = clinicTypes.reduce((acc, clinicType) => {
    acc[clinicType] = clinicRates.filter(rate => rate.clinicType === clinicType);
    return acc;
  }, {} as Record<ClinicType, ClinicRate[]>);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg font-medium">Clinic Rates Configuration</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Manage rates for different clinic types, meeting types, and staff roles
            </p>
          </div>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" /> Add Rate
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Clinic Type</TableHead>
              <TableHead>Meeting Type</TableHead>
              <TableHead>Staff Role</TableHead>
              <TableHead className="text-right">Rate</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clinicRates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No rates configured. Click "Add Rate" to get started.
                </TableCell>
              </TableRow>
            ) : (
              clinicRates.map((rate) => (
                <TableRow key={rate.id}>
                  <TableCell className="font-medium">{rate.clinicType}</TableCell>
                  <TableCell>{rate.meetingType}</TableCell>
                  <TableCell>{rate.staffRole}</TableCell>
                  <TableCell className="text-right">{formatCurrency(rate.rate)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(rate)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(rate.id)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEditing ? "Edit Rate" : "Add New Rate"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="clinicType">Clinic Type</Label>
                <Select 
                  value={currentRate.clinicType} 
                  onValueChange={(value) => setCurrentRate({...currentRate, clinicType: value as ClinicType})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {clinicTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="meetingType">Meeting Type</Label>
                <Select 
                  value={currentRate.meetingType} 
                  onValueChange={(value) => setCurrentRate({...currentRate, meetingType: value as MeetingType})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {meetingTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid w-full items-center gap-2">
                <Label htmlFor="staffRole">Staff Role</Label>
                <Select 
                  value={currentRate.staffRole} 
                  onValueChange={(value) => setCurrentRate({...currentRate, staffRole: value as StaffRole})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {staffRoles.map(role => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid w-full items-center gap-2">
                <Label htmlFor="rate">Rate (ILS)</Label>
                <Input 
                  id="rate"
                  type="number"
                  value={currentRate.rate || ''}
                  onChange={(e) => setCurrentRate({...currentRate, rate: Number(e.target.value)})}
                  min={0}
                  step={0.01}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {isEditing ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ClinicRatesTab;
