
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash } from "lucide-react";
import { useFinance } from "@/context/FinanceContext";
import { AdminHoursDialog } from "./dialogs/AdminHoursDialog";

interface AdminHour {
  id: string;
  staffId: string;
  adminHours: number;
  trainingHours: number;
  month: number;
  year: number;
}

const AdminHoursTab: React.FC = () => {
  const { 
    staffMembers, 
    currentPeriod,
    clinicalStaffRates
  } = useFinance();

  const [adminHours, setAdminHours] = useState<AdminHour[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHours, setEditingHours] = useState<AdminHour | null>(null);

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
  const handleEdit = (hours: AdminHour) => {
    setEditingHours(hours);
    setIsDialogOpen(true);
  };

  // Handle delete hours
  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete these hours?")) {
      setAdminHours(prev => prev.filter(h => h.id !== id));
    }
  };

  // Handle save hours
  const handleSave = (hoursData: Omit<AdminHour, 'id'>) => {
    if (editingHours) {
      setAdminHours(prev => prev.map(h => 
        h.id === editingHours.id 
          ? { ...hoursData, id: editingHours.id }
          : h
      ));
    } else {
      const newHours: AdminHour = {
        ...hoursData,
        id: crypto.randomUUID(),
      };
      setAdminHours(prev => [...prev, newHours]);
    }
    setIsDialogOpen(false);
  };

  // Calculate totals
  const totalAdminHours = filteredAdminHours.reduce((sum, h) => sum + h.adminHours, 0);
  const totalTrainingHours = filteredAdminHours.reduce((sum, h) => sum + h.trainingHours, 0);
  const totalCost = filteredAdminHours.reduce((sum, h) => 
    sum + calculateHoursCost(h.staffId, h.adminHours, h.trainingHours), 0
  );

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
