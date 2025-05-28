
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdminTrainingHours, StaffMember, TimePeriod } from "@/types/finance";

interface AdminHoursDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<AdminTrainingHours, 'id'>) => void;
  editingHours: AdminTrainingHours | null;
  staffMembers: StaffMember[];
  currentPeriod: TimePeriod;
}

export const AdminHoursDialog: React.FC<AdminHoursDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  editingHours,
  staffMembers,
  currentPeriod,
}) => {
  const [formData, setFormData] = useState({
    staffId: "",
    adminHours: 0,
    trainingHours: 0,
    month: currentPeriod.month,
    year: currentPeriod.year,
  });

  useEffect(() => {
    if (editingHours) {
      setFormData({
        staffId: editingHours.staffId,
        adminHours: editingHours.adminHours,
        trainingHours: editingHours.trainingHours,
        month: editingHours.month,
        year: editingHours.year,
      });
    } else {
      setFormData({
        staffId: "",
        adminHours: 0,
        trainingHours: 0,
        month: currentPeriod.month,
        year: currentPeriod.year,
      });
    }
  }, [editingHours, currentPeriod]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.staffId) {
      alert("Please select a staff member");
      return;
    }
    onSave(formData);
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Filter clinical staff only
  const clinicalStaff = staffMembers.filter(
    staff => staff.role === "Psychiatrist" || staff.role === "CaseManager"
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingHours ? "Edit Admin/Training Hours" : "Add Admin/Training Hours"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="staffId">Staff Member</Label>
              <Select 
                value={formData.staffId} 
                onValueChange={(value) => handleChange("staffId", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {clinicalStaff.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name} ({staff.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="adminHours">Administrative Hours</Label>
              <Input 
                id="adminHours"
                type="number"
                value={formData.adminHours}
                onChange={(e) => handleChange("adminHours", Number(e.target.value))}
                min={0}
                step={0.5}
                required
              />
            </div>
            
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="trainingHours">Training Hours</Label>
              <Input 
                id="trainingHours"
                type="number"
                value={formData.trainingHours}
                onChange={(e) => handleChange("trainingHours", Number(e.target.value))}
                min={0}
                step={0.5}
                required
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {editingHours ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
