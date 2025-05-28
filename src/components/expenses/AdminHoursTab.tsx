
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash } from "lucide-react";
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

  // Load admin hours from Supabase
  useEffect(() => {
    loadAdminHours();
  }, [currentPeriod]);

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

  // Handle save hours
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

  // Calculate totals
  const totalAdminHours = filteredAdminHours.reduce((sum, h) => sum + h.adminHours, 0);
  const totalTrainingHours = filteredAdminHours.reduce((sum, h) => sum + h.trainingHours, 0);
  const totalCost = filteredAdminHours.reduce((sum, h) => 
    sum + calculateHoursCost(h.staffId, h.adminHours, h.trainingHours), 0
  );

  if (loading) {
    return <div>Loading admin/training hours...</div>;
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" /> Add Admin/Training Hours
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-medium">
            Administrative & Training Hours ({totalAdminHours + totalTrainingHours} total hours)
          </CardTitle>
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
              {filteredAdminHours.length > 0 ? (
                filteredAdminHours.map((hours) => {
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
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No administrative or training hours recorded for this period
                  </TableCell>
                </TableRow>
              )}
              {filteredAdminHours.length > 0 && (
                <TableRow className="border-t-2">
                  <TableCell className="font-bold">Total</TableCell>
                  <TableCell className="text-right font-bold">{totalAdminHours}</TableCell>
                  <TableCell className="text-right font-bold">{totalTrainingHours}</TableCell>
                  <TableCell className="text-right font-bold">{totalAdminHours + totalTrainingHours}</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(totalCost)}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
