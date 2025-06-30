
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
import { StaffMember } from "@/types/finance";

interface StaffMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isEditing: boolean;
  currentStaff: Omit<StaffMember, "id"> & { id?: string };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRoleChange: (value: "Psychiatrist" | "CaseManager" | "Admin") => void;
  onStartDateChange: (date: string | undefined) => void;
  onEndDateChange: (date: string | undefined) => void;
}

export const StaffMemberDialog: React.FC<StaffMemberDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isEditing,
  currentStaff,
  onChange,
  onRoleChange,
  onStartDateChange,
  onEndDateChange,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Staff Member" : "Add Staff Member"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <div className="space-y-4 py-2">
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={currentStaff.name}
                onChange={onChange}
                required
              />
            </div>
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={currentStaff.role}
                onValueChange={onRoleChange}
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
                      onStartDateChange(selectedDate);
                    }}
                    disabled={(date) => date > new Date()}
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
                      onEndDateChange(selectedDate);
                    }}
                    disabled={(date) => date > new Date()}
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
                onChange={onChange}
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
