
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OverheadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingOverhead: any;
  currentPeriod: { month: number; year: number };
  onAdd: (overhead: any) => void;
  onUpdate: (overhead: any) => void;
}

export const OverheadDialog: React.FC<OverheadDialogProps> = ({
  isOpen,
  onClose,
  editingOverhead,
  currentPeriod,
  onAdd,
  onUpdate
}) => {
  const [formData, setFormData] = useState({
    name: "",
    monthlyCost: 0
  });

  useEffect(() => {
    if (editingOverhead) {
      setFormData({
        name: editingOverhead.name,
        monthlyCost: editingOverhead.monthlyCost
      });
    } else {
      setFormData({
        name: "",
        monthlyCost: 0
      });
    }
  }, [editingOverhead, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "name" ? value : Number(value)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingOverhead) {
      onUpdate({
        ...editingOverhead,
        ...formData
      });
    } else {
      onAdd({
        ...formData,
        month: currentPeriod.month,
        year: currentPeriod.year
      });
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingOverhead ? "Edit Fixed Overhead" : "Add Fixed Overhead"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="name">Overhead Name</Label>
              <Input 
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="monthlyCost">Monthly Cost (ILS)</Label>
              <Input 
                id="monthlyCost"
                name="monthlyCost"
                type="number"
                value={formData.monthlyCost}
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
              {editingOverhead ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
