
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { StaffMemberDialog } from "@/components/staff/StaffMemberDialog";
import { StaffRatesDialog } from "@/components/staff/StaffRatesDialog";
import { StaffTable } from "@/components/staff/StaffTable";
import { useStaffManagement } from "@/hooks/useStaffManagement";
import { useRatesManagement } from "@/hooks/useRatesManagement";

const StaffPage: React.FC = () => {
  const {
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
  } = useStaffManagement();

  const {
    isRatesDialogOpen,
    isRatesEditing,
    currentRates,
    isLoading,
    handleRateChange,
    handleRatesSubmit,
    handleEditRates,
    handleCloseRatesDialog,
    handleStaffChange,
    handleEffectiveDateChange,
  } = useRatesManagement();

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

      <StaffTable
        staffMembers={staffMembers}
        onEditStaff={handleEditStaff}
        onDeleteStaff={handleDeleteStaff}
        onEditRates={handleEditRates}
      />

      <StaffMemberDialog
        isOpen={isStaffDialogOpen}
        onClose={handleCloseStaffDialog}
        onSubmit={handleStaffSubmit}
        isEditing={isStaffEditing}
        currentStaff={currentStaff}
        onChange={handleStaffChange}
        onRoleChange={handleRoleChange}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
      />

      <StaffRatesDialog
        isOpen={isRatesDialogOpen}
        onClose={handleCloseRatesDialog}
        onSubmit={handleRatesSubmit}
        isEditing={isRatesEditing}
        currentRates={currentRates}
        staffMembers={staffMembers}
        onRateChange={handleRateChange}
        onStaffChange={handleStaffChange}
        onEffectiveDateChange={handleEffectiveDateChange}
        isLoading={isLoading}
      />
    </div>
  );
};

export default StaffPage;
