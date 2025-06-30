
import { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { ClinicalStaffRates } from "@/types/finance";
import { useToast } from "@/components/ui/use-toast";

export const useRatesManagement = () => {
  const { toast } = useToast();
  const {
    addStaffRates,
    updateStaffRates,
    getStaffRates,
    isLoading,
  } = useFinance();

  const [isRatesDialogOpen, setIsRatesDialogOpen] = useState(false);
  const [isRatesEditing, setIsRatesEditing] = useState(false);
  const [currentRates, setCurrentRates] = useState<Omit<ClinicalStaffRates, "id"> & { id?: string }>({
    staffId: "",
    adult_intake_rate: 0,
    adult_follow_up_rate: 0,
    adult_no_show_intake_rate: 0,
    adult_no_show_follow_up_rate: 0,
    child_intake_rate: 0,
    child_follow_up_rate: 0,
    child_no_show_intake_rate: 0,
    child_no_show_follow_up_rate: 0,
    availability_retainer_rate: 0,
    admin_rate: 0,
    training_rate: 0,
    contract_type_identifier: "",
    effective_date: new Date().toISOString(),
  });

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "contract_type_identifier") {
      setCurrentRates({
        ...currentRates,
        [name]: value,
      });
    } else {
      setCurrentRates({
        ...currentRates,
        [name]: Number(value) || 0,
      });
    }
  };

  const handleRatesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentRates.staffId) {
      toast({
        title: "Error",
        description: "Please select a valid staff member.",
        variant: "destructive",
      });
      return;
    }

    console.log("Submitting rates for staff:", currentRates.staffId);
    console.log("Current rates data:", currentRates);
    console.log("Is editing:", isRatesEditing);
    console.log("Current rates ID:", currentRates.id);

    try {
      const ratesData = {
        staffId: currentRates.staffId,
        adult_intake_rate: Number(currentRates.adult_intake_rate) || 0,
        adult_follow_up_rate: Number(currentRates.adult_follow_up_rate) || 0,
        adult_no_show_intake_rate: Number(currentRates.adult_no_show_intake_rate) || 0,
        adult_no_show_follow_up_rate: Number(currentRates.adult_no_show_follow_up_rate) || 0,
        child_intake_rate: Number(currentRates.child_intake_rate) || 0,
        child_follow_up_rate: Number(currentRates.child_follow_up_rate) || 0,
        child_no_show_intake_rate: Number(currentRates.child_no_show_intake_rate) || 0,
        child_no_show_follow_up_rate: Number(currentRates.child_no_show_follow_up_rate) || 0,
        availability_retainer_rate: Number(currentRates.availability_retainer_rate) || 0,
        admin_rate: Number(currentRates.admin_rate) || 0,
        training_rate: Number(currentRates.training_rate) || 0,
        contract_type_identifier: currentRates.contract_type_identifier || "",
        effective_date: currentRates.effective_date,
      };

      const hasValidId = currentRates.id && !currentRates.id.startsWith('default-');
      
      if (isRatesEditing && hasValidId) {
        console.log("Updating existing rates with ID:", currentRates.id);
        await updateStaffRates({
          id: currentRates.id,
          ...ratesData
        });
        toast({
          title: "Success",
          description: "Staff rates updated successfully.",
        });
      } else {
        console.log("Adding new rates");
        await addStaffRates(ratesData);
        toast({
          title: "Success", 
          description: "Staff rates added successfully.",
        });
      }
      handleCloseRatesDialog();
    } catch (error) {
      console.error("Error with rates operation:", error);
      toast({
        title: "Error",
        description: "Failed to save staff rates. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditRates = async (staffId: string) => {
    console.log("Editing rates for staff ID:", staffId);
    
    try {
      const rates = await getStaffRates(staffId);
      if (rates && rates.id && !rates.id.startsWith('default-')) {
        console.log("Found existing rates:", rates);
        setCurrentRates({
          id: rates.id,
          staffId: staffId,
          adult_intake_rate: rates.adult_intake_rate || 0,
          adult_follow_up_rate: rates.adult_follow_up_rate || 0,
          adult_no_show_intake_rate: rates.adult_no_show_intake_rate || 0,
          adult_no_show_follow_up_rate: rates.adult_no_show_follow_up_rate || 0,
          child_intake_rate: rates.child_intake_rate || 0,
          child_follow_up_rate: rates.child_follow_up_rate || 0,
          child_no_show_intake_rate: rates.child_no_show_intake_rate || 0,
          child_no_show_follow_up_rate: rates.child_no_show_follow_up_rate || 0,
          availability_retainer_rate: rates.availability_retainer_rate || 0,
          admin_rate: rates.admin_rate || 0,
          training_rate: rates.training_rate || 0,
          contract_type_identifier: rates.contract_type_identifier || "",
          effective_date: rates.effective_date,
        });
        setIsRatesEditing(true);
      } else {
        console.log("No existing rates found, creating new");
        setCurrentRates({
          staffId: staffId,
          adult_intake_rate: 0,
          adult_follow_up_rate: 0,
          adult_no_show_intake_rate: 0,
          adult_no_show_follow_up_rate: 0,
          child_intake_rate: 0,
          child_follow_up_rate: 0,
          child_no_show_intake_rate: 0,
          child_no_show_follow_up_rate: 0,
          availability_retainer_rate: 0,
          admin_rate: 0,
          training_rate: 0,
          contract_type_identifier: "",
          effective_date: new Date().toISOString(),
        });
        setIsRatesEditing(false);
      }
      setIsRatesDialogOpen(true);
    } catch (error) {
      console.error("Error loading staff rates:", error);
      toast({
        title: "Error",
        description: "Failed to load staff rates. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCloseRatesDialog = () => {
    setIsRatesDialogOpen(false);
  };

  const handleStaffChange = (staffId: string) => {
    console.log("Selected staff ID:", staffId);
    setCurrentRates({ ...currentRates, staffId: staffId });
  };

  const handleEffectiveDateChange = (date: string) => {
    setCurrentRates({ ...currentRates, effective_date: date });
  };

  return {
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
  };
};
