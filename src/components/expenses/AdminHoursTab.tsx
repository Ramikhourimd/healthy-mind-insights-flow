
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash, Save } from "lucide-react";
import { useFinance } from "@/context/FinanceContext";
import { AdminHoursDialog } from "./dialogs/AdminHoursDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { AdminTrainingHours } from "@/types/finance";

const AdminHoursTab: React.FC = () => {
  const { toast } = useToast();
  const { 
    staffMembers, 
    currentPeriod,
    clinicalStaffRates,
    updateFinancialSummary
  } = useFinance();

  const [adminHours, setAdminHours] = useState<AdminTrainingHours[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHours, setEditingHours] = useState<AdminTrainingHours | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editableData, setEditableData] = useState<{[staffId: string]: {adminHours: number, trainingHours: number}}>({});

  // Load admin hours from Supabase
  useEffect(() => {
    loadAdminHours();
  }, [currentPeriod]);

  // Initialize editable data when staff members or admin hours change
  useEffect(() => {
    initializeEditableData();
  }, [staffMembers, adminHours, currentPeriod]);

  const loadAdminHours = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_training_hours')
        .select('*')
        .eq('month', currentPeriod.month)
        .eq('year', currentPeriod.year);

      if (error) throw error;

      const formattedData: AdminTrainingHours[] = data.map(item => ({
        id: item.id,
        staffId: item.staff_id,
        adminHours: Number(item.admin_hours),
        trainingHours: Number(item.training_hours),
        month: item.month,
        year: item.year
      }));

      setAdminHours(formattedData);
    } catch (error) {
      console.error('Error loading admin hours:', error);
      toast({
        title: "Error",
        description: "Failed to load admin/training hours",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeEditableData = () => {
    const clinicalStaff = staffMembers.filter(
      staff => staff.role === "Psychiatrist" || staff.role === "CaseManager"
    );

    const newEditableData: {[staffId: string]: {adminHours: number, trainingHours: number}} = {};

    clinicalStaff.forEach(staff => {
      const existingHours = adminHours.find(h => h.staffId === staff.id);
      newEditableData[staff.id] = {
        adminHours: existingHours ? existingHours.adminHours : 2, // Default 2 hours admin
        trainingHours: existingHours ? existingHours.trainingHours : 1 // Default 1 hour training
      };
    });

    setEditableData(newEditableData);
  };

  // Filter admin hours for current period
  const filteredAdminHours = adminHours.filter(
    hours => hours.month === currentPeriod.month && hours.year === currentPeriod.year
  );

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IL', { 
      style: 'currency', 
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get staff name by ID
  const getStaffNameById = (id: string) => {
    const staff = staffMembers.find(s => s.id === id);
    return staff ? staff.name : "Unknown Staff";
  };

  // Get staff rates synchronously from the existing rates array
  const getStaffRatesSync = (staffId: string) => {
    return clinicalStaffRates.find(rate => rate.staffId === staffId);
  };

  // Calculate cost for admin/training hours
  const calculateHoursCost = (staffId: string, adminHours: number, trainingHours: number) => {
    const rates = getStaffRatesSync(staffId);
    if (!rates) return 0;
    
    const adminCost = adminHours * (rates.admin_rate || 0);
    const trainingCost = trainingHours * (rates.training_rate || 0);
    return adminCost + trainingCost;
  };

  // Handle input changes in editable table
  const handleEditableChange = (staffId: string, field: 'adminHours' | 'trainingHours', value: string) => {
    const numValue = Number(value) || 0;
    setEditableData(prev => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        [field]: numValue
      }
    }));
  };

  // Save all editable data
  const handleSaveAll = async () => {
    try {
      setSaving(true);

      // Prepare data for upsert
      const dataToSave = Object.entries(editableData).map(([staffId, data]) => ({
        staff_id: staffId,
        admin_hours: data.adminHours,
        training_hours: data.trainingHours,
        month: currentPeriod.month,
        year: currentPeriod.year
      }));

      // Delete existing records for this period first
      const { error: deleteError } = await supabase
        .from('admin_training_hours')
        .delete()
        .eq('month', currentPeriod.month)
        .eq('year', currentPeriod.year);

      if (deleteError) throw deleteError;

      // Insert new records
      const { error: insertError } = await supabase
        .from('admin_training_hours')
        .insert(dataToSave);

      if (insertError) throw insertError;

      await loadAdminHours();
      updateFinancialSummary();
      
      toast({
        title: "Success",
        description: "All admin/training hours saved successfully",
      });
    } catch (error) {
      console.error('Error saving admin hours:', error);
      toast({
        title: "Error",
        description: "Failed to save admin/training hours",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle add new hours
  const handleAddNew = () => {
    setEditingHours(null);
    setIsDialogOpen(true);
  };

  // Handle edit hours
  const handleEdit = (hours: AdminTrainingHours) => {
    setEditingHours(hours);
    setIsDialogOpen(true);
  };

  // Handle delete hours
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete these hours?")) {
      try {
        const { error } = await supabase
          .from('admin_training_hours')
          .delete()
          .eq('id', id);

        if (error) throw error;

        await loadAdminHours();
        updateFinancialSummary();
        
        toast({
          title: "Success",
          description: "Admin/training hours deleted successfully",
        });
      } catch (error) {
        console.error('Error deleting admin hours:', error);
        toast({
          title: "Error",
          description: "Failed to delete admin/training hours",
          variant: "destructive",
        });
      }
    }
  };

  // Handle save hours from dialog
  const handleSave = async (hoursData: Omit<AdminTrainingHours, 'id'>) => {
    try {
      if (editingHours) {
        // Update existing hours
        const { error } = await supabase
          .from('admin_training_hours')
          .update({
            staff_id: hoursData.staffId,
            admin_hours: hoursData.adminHours,
            training_hours: hoursData.trainingHours,
            month: hoursData.month,
            year: hoursData.year,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingHours.id);

        if (error) throw error;
      } else {
        // Insert new hours
        const { error } = await supabase
          .from('admin_training_hours')
          .insert({
            staff_id: hoursData.staffId,
            admin_hours: hoursData.adminHours,
            training_hours: hoursData.trainingHours,
            month: hoursData.month,
            year: hoursData.year
          });

        if (error) throw error;
      }

      await loadAdminHours();
      updateFinancialSummary();
      setIsDialogOpen(false);
      
      toast({
        title: "Success",
        description: `Admin/training hours ${editingHours ? 'updated' : 'added'} successfully`,
      });
    } catch (error) {
      console.error('Error saving admin hours:', error);
      toast({
        title: "Error",
        description: "Failed to save admin/training hours",
        variant: "destructive",
      });
    }
  };

  // Get clinical staff members
  const clinicalStaff = staffMembers.filter(
    staff => staff.role === "Psychiatrist" || staff.role === "CaseManager"
  );

  // Calculate totals for editable data
  const totalAdminHours = Object.values(editableData).reduce((sum, data) => sum + data.adminHours, 0);
  const totalTrainingHours = Object.values(editableData).reduce((sum, data) => sum + data.trainingHours, 0);
  const totalCost = Object.entries(editableData).reduce((sum, [staffId, data]) => 
    sum + calculateHoursCost(staffId, data.adminHours, data.trainingHours), 0
  );

  if (loading) {
    return <div>Loading admin/training hours...</div>;
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <Button 
          onClick={handleSaveAll} 
          disabled={saving}
          className="bg-green-600 hover:bg-green-700"
        >
          <Save className="mr-2 h-4 w-4" /> 
          {saving ? "Saving..." : "Save All Changes"}
        </Button>
        <Button onClick={handleAddNew} variant="outline">
          <Plus className="mr-2 h-4 w-4" /> Add Individual Entry
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-medium">
            Administrative & Training Hours - Quick Edit ({totalAdminHours + totalTrainingHours} total hours)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead className="text-center">Admin Hours</TableHead>
                <TableHead className="text-center">Training Hours</TableHead>
                <TableHead className="text-right">Total Hours</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clinicalStaff.map((staff) => {
                const staffData = editableData[staff.id] || { adminHours: 2, trainingHours: 1 };
                const totalHours = staffData.adminHours + staffData.trainingHours;
                const cost = calculateHoursCost(staff.id, staffData.adminHours, staffData.trainingHours);
                
                return (
                  <TableRow key={staff.id}>
                    <TableCell className="font-medium">{staff.name}</TableCell>
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        value={staffData.adminHours}
                        onChange={(e) => handleEditableChange(staff.id, 'adminHours', e.target.value)}
                        className="w-20 text-center"
                        min={0}
                        step={0.5}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        value={staffData.trainingHours}
                        onChange={(e) => handleEditableChange(staff.id, 'trainingHours', e.target.value)}
                        className="w-20 text-center"
                        min={0}
                        step={0.5}
                      />
                    </TableCell>
                    <TableCell className="text-right">{totalHours}</TableCell>
                    <TableCell className="text-right">{formatCurrency(cost)}</TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="border-t-2 bg-gray-50">
                <TableCell className="font-bold">Total</TableCell>
                <TableCell className="text-center font-bold">{totalAdminHours}</TableCell>
                <TableCell className="text-center font-bold">{totalTrainingHours}</TableCell>
                <TableCell className="text-right font-bold">{totalAdminHours + totalTrainingHours}</TableCell>
                <TableCell className="text-right font-bold">{formatCurrency(totalCost)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {filteredAdminHours.length > 0 && (
        <Card className="shadow-sm mt-6">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Individual Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead className="text-right">Admin Hours</TableHead>
                  <TableHead className="text-right">Training Hours</TableHead>
                  <TableHead className="text-right">Total Hours</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAdminHours.map((hours) => {
                  const totalHours = hours.adminHours + hours.trainingHours;
                  const cost = calculateHoursCost(hours.staffId, hours.adminHours, hours.trainingHours);
                  
                  return (
                    <TableRow key={hours.id}>
                      <TableCell>{getStaffNameById(hours.staffId)}</TableCell>
                      <TableCell className="text-right">{hours.adminHours}</TableCell>
                      <TableCell className="text-right">{hours.trainingHours}</TableCell>
                      <TableCell className="text-right">{totalHours}</TableCell>
                      <TableCell className="text-right">{formatCurrency(cost)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(hours)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(hours.id)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AdminHoursDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSave}
        editingHours={editingHours}
        staffMembers={staffMembers}
        currentPeriod={currentPeriod}
      />
    </>
  );
};

export default AdminHoursTab;
