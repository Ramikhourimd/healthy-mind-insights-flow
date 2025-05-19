
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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ExpensesPage: React.FC = () => {
  const { fixedOverheads, addFixedOverhead, updateFixedOverhead, deleteFixedOverhead, currentPeriod, financialSummary } = useFinance();
  
  // Filter overheads for current period
  const filteredOverheads = fixedOverheads.filter(
    overhead => overhead.month === currentPeriod.month && overhead.year === currentPeriod.year
  );
  
  // State for the form
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentOverhead, setCurrentOverhead] = useState({
    id: "",
    name: "",
    monthlyCost: 0,
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
    setCurrentOverhead({
      ...currentOverhead,
      [name]: name === "name" ? value : Number(value),
    });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      updateFixedOverhead(currentOverhead);
    } else {
      addFixedOverhead({
        name: currentOverhead.name,
        monthlyCost: currentOverhead.monthlyCost,
        month: currentPeriod.month,
        year: currentPeriod.year,
      });
    }
    handleCloseDialog();
  };

  // Edit an overhead
  const handleEdit = (overhead: typeof currentOverhead) => {
    setCurrentOverhead(overhead);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  // Delete an overhead
  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this overhead expense?")) {
      deleteFixedOverhead(id);
    }
  };

  // Open dialog for adding new overhead
  const handleAddNew = () => {
    setCurrentOverhead({
      id: "",
      name: "",
      monthlyCost: 0,
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
          <h1 className="text-3xl font-bold text-gray-800">Expense Management</h1>
          <p className="text-gray-500 mt-1">
            Manage expenses for {new Date(currentPeriod.year, currentPeriod.month - 1).toLocaleString('default', { month: 'long' })} {currentPeriod.year}
          </p>
        </div>
      </div>

      <Tabs defaultValue="fixed" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="fixed">Fixed Overheads</TabsTrigger>
          <TabsTrigger value="clinical">Clinical Staff</TabsTrigger>
          <TabsTrigger value="admin">Administrative Staff</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Expense Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Clinical Staff Costs</TableCell>
                    <TableCell className="text-right">{formatCurrency(financialSummary.totalClinicalCosts)}</TableCell>
                    <TableCell className="text-right">
                      {(financialSummary.totalClinicalCosts / financialSummary.totalExpenses * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Administrative Staff Costs</TableCell>
                    <TableCell className="text-right">{formatCurrency(financialSummary.totalAdminCosts)}</TableCell>
                    <TableCell className="text-right">
                      {(financialSummary.totalAdminCosts / financialSummary.totalExpenses * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Fixed Overheads</TableCell>
                    <TableCell className="text-right">{formatCurrency(financialSummary.totalFixedOverheads)}</TableCell>
                    <TableCell className="text-right">
                      {(financialSummary.totalFixedOverheads / financialSummary.totalExpenses * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-bold">Total Expenses</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(financialSummary.totalExpenses)}</TableCell>
                    <TableCell className="text-right font-bold">100%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fixed">
          <div className="flex justify-end mb-4">
            <Button onClick={handleAddNew}>
              <Plus className="mr-2 h-4 w-4" /> Add Fixed Overhead
            </Button>
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Fixed Overheads</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Overhead Name</TableHead>
                    <TableHead className="text-right">Monthly Cost</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOverheads.map((overhead) => (
                    <TableRow key={overhead.id}>
                      <TableCell>{overhead.name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(overhead.monthlyCost)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(overhead)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(overhead.id)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="font-bold">Total Fixed Overheads</TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(financialSummary.totalFixedOverheads)}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clinical">
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium">Clinical Staff Costs</CardTitle>
                <p className="text-sm text-muted-foreground">(Demo data - will be editable in full version)</p>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Sessions</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Dr. Smith</TableCell>
                    <TableCell>Psychiatrist</TableCell>
                    <TableCell className="text-right">35</TableCell>
                    <TableCell className="text-right">{formatCurrency(29750)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Dr. Johnson</TableCell>
                    <TableCell>Psychiatrist</TableCell>
                    <TableCell className="text-right">30</TableCell>
                    <TableCell className="text-right">{formatCurrency(25500)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Sarah Miller</TableCell>
                    <TableCell>Case Manager</TableCell>
                    <TableCell className="text-right">28</TableCell>
                    <TableCell className="text-right">{formatCurrency(14000)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={3} className="font-bold">Total Clinical Staff Costs</TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(financialSummary.totalClinicalCosts)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin">
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium">Administrative Staff Costs</CardTitle>
                <p className="text-sm text-muted-foreground">(Demo data - will be editable in full version)</p>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Base Salary</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Shira Lachmann</TableCell>
                    <TableCell>Clinic Manager</TableCell>
                    <TableCell className="text-right">{formatCurrency(15000)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(2500)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(17500)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Maya Cohen</TableCell>
                    <TableCell>Admin Assistant</TableCell>
                    <TableCell className="text-right">{formatCurrency(8500)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(0)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(8500)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={4} className="font-bold">Total Administrative Staff Costs</TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(financialSummary.totalAdminCosts)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Fixed Overhead" : "Add Fixed Overhead"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-2">
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="name">Overhead Name</Label>
                <Input 
                  id="name"
                  name="name"
                  value={currentOverhead.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="monthlyCost">Monthly Cost (ILS)</Label>
                <Input 
                  id="monthlyCost"
                  name="monthlyCost"
                  type="number"
                  value={currentOverhead.monthlyCost}
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

export default ExpensesPage;
