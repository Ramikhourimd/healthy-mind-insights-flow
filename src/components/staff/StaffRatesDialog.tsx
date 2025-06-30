import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { StaffMember, ClinicalStaffRates } from "@/types/finance";

interface StaffRatesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isEditing: boolean;
  currentRates: Omit<ClinicalStaffRates, "id"> & { id?: string };
  staffMembers: StaffMember[];
  onRateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStaffChange: (staffId: string) => void;
  onEffectiveDateChange: (date: string) => void;
  isLoading: boolean;
}

export const StaffRatesDialog: React.FC<StaffRatesDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isEditing,
  currentRates,
  staffMembers,
  onRateChange,
  onStaffChange,
  onEffectiveDateChange,
  isLoading,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Staff Rates" : "Add Staff Rates"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <div className="space-y-4 py-2">
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="staffId">Staff Member</Label>
              <Select
                value={currentRates.staffId}
                onValueChange={onStaffChange}
                disabled={isEditing}
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
              <Label htmlFor="contract_type_identifier">Contract Type Identifier</Label>
              <Input
                id="contract_type_identifier"
                name="contract_type_identifier"
                value={currentRates.contract_type_identifier}
                onChange={(e) => onRateChange(e)}
                placeholder="e.g., Special Contract, Standard, etc."
              />
            </div>

            {/* Adult Rates Section */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-medium">Adult Service Rates</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="adult_intake_rate">Adult Intake Rate (ILS)</Label>
                  <Input
                    id="adult_intake_rate"
                    name="adult_intake_rate"
                    type="number"
                    value={currentRates.adult_intake_rate}
                    onChange={onRateChange}
                    min={0}
                    step="0.01"
                  />
                </div>
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="adult_follow_up_rate">Adult Follow-Up Rate (ILS)</Label>
                  <Input
                    id="adult_follow_up_rate"
                    name="adult_follow_up_rate"
                    type="number"
                    value={currentRates.adult_follow_up_rate}
                    onChange={onRateChange}
                    min={0}
                    step="0.01"
                  />
                </div>
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="adult_no_show_intake_rate">Adult No-Show Intake Rate (ILS)</Label>
                  <Input
                    id="adult_no_show_intake_rate"
                    name="adult_no_show_intake_rate"
                    type="number"
                    value={currentRates.adult_no_show_intake_rate}
                    onChange={onRateChange}
                    min={0}
                    step="0.01"
                  />
                </div>
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="adult_no_show_follow_up_rate">Adult No-Show Follow-Up Rate (ILS)</Label>
                  <Input
                    id="adult_no_show_follow_up_rate"
                    name="adult_no_show_follow_up_rate"
                    type="number"
                    value={currentRates.adult_no_show_follow_up_rate}
                    onChange={onRateChange}
                    min={0}
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            {/* Child Rates Section */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-medium">Child Service Rates</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="child_intake_rate">Child Intake Rate (ILS)</Label>
                  <Input
                    id="child_intake_rate"
                    name="child_intake_rate"
                    type="number"
                    value={currentRates.child_intake_rate}
                    onChange={onRateChange}
                    min={0}
                    step="0.01"
                  />
                </div>
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="child_follow_up_rate">Child Follow-Up Rate (ILS)</Label>
                  <Input
                    id="child_follow_up_rate"
                    name="child_follow_up_rate"
                    type="number"
                    value={currentRates.child_follow_up_rate}
                    onChange={onRateChange}
                    min={0}
                    step="0.01"
                  />
                </div>
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="child_no_show_intake_rate">Child No-Show Intake Rate (ILS)</Label>
                  <Input
                    id="child_no_show_intake_rate"
                    name="child_no_show_intake_rate"
                    type="number"
                    value={currentRates.child_no_show_intake_rate}
                    onChange={onRateChange}
                    min={0}
                    step="0.01"
                  />
                </div>
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="child_no_show_follow_up_rate">Child No-Show Follow-Up Rate (ILS)</Label>
                  <Input
                    id="child_no_show_follow_up_rate"
                    name="child_no_show_follow_up_rate"
                    type="number"
                    value={currentRates.child_no_show_follow_up_rate}
                    onChange={onRateChange}
                    min={0}
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            {/* Other Rates Section */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-medium">Other Rates</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="availability_retainer_rate">Availability Retainer Rate (ILS)</Label>
                  <Input
                    id="availability_retainer_rate"
                    name="availability_retainer_rate"
                    type="number"
                    value={currentRates.availability_retainer_rate}
                    onChange={onRateChange}
                    min={0}
                    step="0.01"
                  />
                </div>
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="admin_rate">Admin Rate (ILS)</Label>
                  <Input
                    id="admin_rate"
                    name="admin_rate"
                    type="number"
                    value={currentRates.admin_rate}
                    onChange={onRateChange}
                    min={0}
                    step="0.01"
                  />
                </div>
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="training_rate">Training Rate (ILS)</Label>
                  <Input
                    id="training_rate"
                    name="training_rate"
                    type="number"
                    value={currentRates.training_rate}
                    onChange={onRateChange}
                    min={0}
                    step="0.01"
                  />
                </div>
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="effective_date">Effective Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] justify-start text-left font-normal",
                          !currentRates.effective_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {currentRates.effective_date ? (
                          format(new Date(currentRates.effective_date), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={currentRates.effective_date ? new Date(currentRates.effective_date) : undefined}
                        onSelect={(date) => {
                          const selectedDate = date ? date.toISOString() : new Date().toISOString();
                          onEffectiveDateChange(selectedDate);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isEditing ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
