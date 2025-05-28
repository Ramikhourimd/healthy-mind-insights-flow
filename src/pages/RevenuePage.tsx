import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useFinance } from "@/context/FinanceContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const RevenuePage: React.FC = () => {
  const { 
    revenueSources, 
    addRevenueSource, 
    updateRevenueSource, 
    deleteRevenueSource, 
    currentPeriod,
    isLoading,
    clinicalSessions,
    staffMembers,
    getClinicRate
  } = useFinance();
  
  // Filter sources for current period
  const filteredSources = revenueSources.filter(
    source => source.month === currentPeriod.month && source.year === currentPeriod.year
  );
  
  // Calculate revenue from clinical sessions automatically using database rates
  const calculateRevenueFromSessions = () => {
    const filteredSessions = clinicalSessions.filter(
      session => session.month === currentPeriod.month && session.year === currentPeriod.year
    );

    // Group sessions by clinic type to create revenue sources
    const revenueByClinic: { [key: string]: { total: number; sessions: number; avgRate: number } } = {};
    
    filteredSessions.forEach(session => {
      const sessionCount = Number(session.count) || 0;
      if (sessionCount > 0) {
        // Get staff member to determine role
        const staffMember = staffMembers.find(staff => staff.id === session.staffId);
        const staffRole = staffMember?.role || "Psychiatrist"; // Default to Psychiatrist
        
        // Get rate from database
        const rateRecord = getClinicRate(session.clinicType, session.meetingType, staffRole as any);
        const revenuePerSession = rateRecord ? rateRecord.rate : 0;

        // Only count revenue for "Show" sessions (not no-shows)
        if (session.showStatus === "Show") {
          const clinicName = `${session.clinicType} - ${session.meetingType} (${staffRole})`;
          if (!revenueByClinic[clinicName]) {
            revenueByClinic[clinicName] = { total: 0, sessions: 0, avgRate: revenuePerSession };
          }
          revenueByClinic[clinicName].total += revenuePerSession * sessionCount;
          revenueByClinic[clinicName].sessions += sessionCount;
        }
      }
    });

    return Object.entries(revenueByClinic).map(([name, data]) => ({
      name,
      quantity: data.sessions,
      ratePerUnit: data.avgRate,
      total: data.total,
      isAutoCalculated: true
    }));
  };

  // Get auto-calculated revenue from sessions
  const autoRevenueData = calculateRevenueFromSessions();

  // Combine manual and auto revenue for totals
  const manualRevenue = filteredSources.reduce(
    (sum, source) => sum + source.quantity * source.ratePerUnit, 
    0
  );
  
  const autoRevenue = autoRevenueData.reduce(
    (sum, source) => sum + source.total,
    0
  );
  
  const totalRevenue = manualRevenue + autoRevenue;
  
  // State for the form
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSource, setCurrentSource] = useState({
    id: "",
    name: "",
    quantity: 0,
    ratePerUnit: 0,
    month: currentPeriod.month,
    year: currentPeriod.year,
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IL', { 
      style: 'currency', 
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentSource({
      ...currentSource,
      [name]: name === "name" ? value : Number(value),
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      await updateRevenueSource(currentSource);
    } else {
      await addRevenueSource({
        name: currentSource.name,
        quantity: currentSource.quantity,
        ratePerUnit: currentSource.ratePerUnit,
        month: currentPeriod.month,
        year: currentPeriod.year,
      });
    }
    handleCloseDialog();
  };

  // Edit a revenue source
  const handleEdit = (source: typeof currentSource) => {
    setCurrentSource(source);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  // Delete a revenue source
  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this revenue source?")) {
      deleteRevenueSource(id);
    }
  };

  // Open dialog for adding new source
  const handleAddNew = () => {
    setCurrentSource({
      id: "",
      name: "",
      quantity: 0,
      ratePerUnit: 0,
      month: currentPeriod.month,
      year: currentPeriod.year,
    });
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  // Close dialog and reset form
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Revenue Management</h1>
          <p className="text-gray-500 mt-1">
            Complete revenue breakdown for {new Date(currentPeriod.year, currentPeriod.month - 1).toLocaleString('default', { month: 'long' })} {currentPeriod.year}
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" /> Add Manual Revenue Source
        </Button>
      </div>

      {/* Auto-calculated Revenue from Clinical Sessions */}
      {autoRevenueData.length > 0 && (
        <Card className="shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Revenue from Clinical Sessions</CardTitle>
            <p className="text-sm text-muted-foreground">
              Automatically calculated from clinical session data using database rates
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source Name</TableHead>
                  <TableHead className="text-right">Sessions</TableHead>
                  <TableHead className="text-right">Rate Per Session</TableHead>
                  <TableHead className="text-right">Total Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {autoRevenueData.map((source, index) => (
                  <TableRow key={`auto-${index}`}>
                    <TableCell>{source.name}</TableCell>
                    <TableCell className="text-right">{source.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(source.ratePerUnit)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(source.total)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-t-2">
                  <TableCell colSpan={3} className="font-semibold">Subtotal - Clinical Sessions</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(autoRevenue)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Manual Revenue Sources */}
      <Card className="shadow-sm mb-6">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Manual Revenue Sources</CardTitle>
          <p className="text-sm text-muted-foreground">
            Manually entered revenue sources
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading revenue data...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source Name</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Rate Per Unit</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSources.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No manual revenue sources found for this period. Click "Add Manual Revenue Source" to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {filteredSources.map((source) => (
                      <TableRow key={source.id}>
                        <TableCell>{source.name}</TableCell>
                        <TableCell className="text-right">{source.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(source.ratePerUnit)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(source.quantity * source.ratePerUnit)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(source)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(source.id)}>
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredSources.length > 0 && (
                      <TableRow className="border-t-2">
                        <TableCell colSpan={3} className="font-semibold">Subtotal - Manual Sources</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(manualRevenue)}</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Total Revenue Summary */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center text-xl font-bold">
            <span>Total Revenue for {new Date(currentPeriod.year, currentPeriod.month - 1).toLocaleString('default', { month: 'long' })} {currentPeriod.year}</span>
            <span className="text-green-600">{formatCurrency(totalRevenue)}</span>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Clinical Sessions:</span>
              <span>{formatCurrency(autoRevenue)}</span>
            </div>
            <div className="flex justify-between">
              <span>Manual Sources:</span>
              <span>{formatCurrency(manualRevenue)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Revenue Source" : "Add Manual Revenue Source"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-2">
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="name">Source Name</Label>
                <Input 
                  id="name"
                  name="name"
                  value={currentSource.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input 
                  id="quantity"
                  name="quantity"
                  type="number"
                  value={currentSource.quantity}
                  onChange={handleChange}
                  required
                  min={0}
                />
              </div>
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="ratePerUnit">Rate Per Unit (ILS)</Label>
                <Input 
                  id="ratePerUnit"
                  name="ratePerUnit"
                  type="number"
                  value={currentSource.ratePerUnit}
                  onChange={handleChange}
                  required
                  min={0}
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {isEditing ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RevenuePage;
