
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
import { Plus, Pencil, Trash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const RevenuePage: React.FC = () => {
  const { revenueSources, addRevenueSource, updateRevenueSource, deleteRevenueSource, currentPeriod } = useFinance();
  
  // Filter sources for current period
  const filteredSources = revenueSources.filter(
    source => source.month === currentPeriod.month && source.year === currentPeriod.year
  );
  
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

  // Calculate total revenue
  const totalRevenue = filteredSources.reduce(
    (sum, source) => sum + source.quantity * source.ratePerUnit, 
    0
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

  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentSource({
      ...currentSource,
      [name]: name === "name" ? value : Number(value),
    });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      updateRevenueSource(currentSource);
    } else {
      addRevenueSource({
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
            Manage revenue sources for {new Date(currentPeriod.year, currentPeriod.month - 1).toLocaleString('default', { month: 'long' })} {currentPeriod.year}
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" /> Add Revenue Source
        </Button>
      </div>

      <Card className="shadow-sm mb-6">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Revenue Sources</CardTitle>
        </CardHeader>
        <CardContent>
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
              <TableRow>
                <TableCell colSpan={3} className="font-bold">Total Revenue</TableCell>
                <TableCell className="text-right font-bold">{formatCurrency(totalRevenue)}</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Revenue Source" : "Add Revenue Source"}</DialogTitle>
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
