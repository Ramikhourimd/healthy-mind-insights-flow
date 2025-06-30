
import { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { StaffMember } from "@/types/finance";
import { useToast } from "@/components/ui/use-toast";

export const useStaffManagement = () => {
  const { toast } = useToast();
  const {
    staffMembers,
    addStaffMember,
    updateStaffMember,
    deleteStaffMember,
  } = useFinance();

  const [isStaffDialogOpen, setIsStaffDialogOpen] = useState(false);
  const [isStaffEditing, setIsStaffEditing] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<Omit<StaffMember, "id"> & { id?: string }>({
    name: "",
    role: "Psychiatrist",
    startDate: undefined,
    endDate: undefined,
    active: true,
  });

  const handleStaffChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const checked = e.target.type === 'checkbox' ? e.target.checked : undefined;
    setCurrentStaff({
      ...currentStaff,
      [name]: type === "checkbox" ? checked : value,
    });
  };

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

  const handleEditStaff = (staff: StaffMember) => {
    setCurrentStaff(staff);
    setIsStaffEditing(true);
    setIsStaffDialogOpen(true);
  };

  const handleDeleteStaff = (id: string) => {
    if (confirm("Are you sure you want to delete this staff member?")) {
      deleteStaffMember(id);
    }
  };

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

  const handleCloseStaffDialog = () => {
    setIsStaffDialogOpen(false);
  };

  const handleRoleChange = (value: "Psychiatrist" | "CaseManager" | "Admin") => {
    setCurrentStaff({ ...currentStaff, role: value });
  };

  const handleStartDateChange = (date: string | undefined) => {
    setCurrentStaff({ ...currentStaff, startDate: date });
  };

  const handleEndDateChange = (date: string | undefined) => {
    setCurrentStaff({ ...currentStaff, endDate: date });
  };

  return {
    staffMembers,
    isStaffDialogOpen,
    isStaffEditing,
    currentStaff,
    handleStaffChange,
    handleStaffSubmit,
    handleEditStaff,
    handleDeleteStaff,
    handleAddNewStaff,
    handleCloseStaffDialog,
    handleRoleChange,
    handleStartDateChange,
    handleEndDateChange,
  };
};
