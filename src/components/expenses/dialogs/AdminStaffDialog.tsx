
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AdminStaffDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingStaff: any;
  currentPeriod: { month: number; year: number };
  onAdd: (staff: any) => void;
  onUpdate: (staff: any) => void;
}

export const AdminStaffDialog: React.FC<AdminStaffDialogProps> = ({
  isOpen,
  onClose,
  editingStaff,
  currentPeriod,
  onAdd,
  onUpdate
}) => {
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    baseSalary: 0,
    commission: 0
  });

  useEffect(() => {
    if (editingStaff) {
      setFormData({
        name: editingStaff.name,
        role: editingStaff.role,
        baseSalary: editingStaff.baseSalary,
        commission: editingStaff.commission
      });
    } else {
      setFormData({
        name: "",
        role: "",
        baseSalary: 0,
        commission: 0
      });
    }
  }, [editingStaff, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "name" || name === "role" ? value : Number(value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStaff) {
        await onUpdate({
          ...editingStaff,
          ...formData
        });
      } else {
        await onAdd({
          ...formData,
          month: currentPeriod.month,
          year: currentPeriod.year
        });
      }
      onClose();
    } catch (error) {
      console.error("Error with admin staff operation:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingStaff ? "Edit Admin Staff" : "Add Admin Staff"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="role">Role</Label>
              <Input 
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="baseSalary">Base Salary (ILS)</Label>
              <Input 
                id="baseSalary"
                name="baseSalary"
                type="number"
                value={formData.baseSalary}
                onChange={handleChange}
                required
                min={0}
              />
            </div>
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="commission">Commission (ILS)</Label>
              <Input 
                id="commission"
                name="commission"
                type="number"
                value={formData.commission}
                onChange={handleChange}
                required
                min={0}
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {editingStaff ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
