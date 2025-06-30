
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash, Copy } from "lucide-react";

interface AdminStaffTabProps {
  filteredAdminStaff: any[];
  calculations: any;
  formatCurrency: (amount: number) => string;
  onAddNew: () => void;
  onEdit: (staff: any) => void;
  onDelete: (id: string) => void;
  onCopyFromPreviousMonth: () => void;
}

export const AdminStaffTab: React.FC<AdminStaffTabProps> = ({
  filteredAdminStaff,
  calculations,
  formatCurrency,
  onAddNew,
  onEdit,
  onDelete,
  onCopyFromPreviousMonth
}) => {
  return (
    <>
      <div className="flex justify-end gap-2 mb-4">
        <Button variant="outline" onClick={onCopyFromPreviousMonth}>
          <Copy className="mr-2 h-4 w-4" /> Copy from Previous Month
        </Button>
        <Button onClick={onAddNew}>
          <Plus className="mr-2 h-4 w-4" /> Add Admin Staff
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Administrative Staff Costs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Base Salary</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead className="text-right">Bonus</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdminStaff.map((staff) => (
                <TableRow key={staff.id}>
                  <TableCell>{staff.name}</TableCell>
                  <TableCell>{staff.role}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(staff.baseSalary) || 0)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(staff.commission) || 0)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(staff.bonus) || 0)}</TableCell>
                  <TableCell className="text-right">{formatCurrency((Number(staff.baseSalary) || 0) + (Number(staff.commission) || 0) + (Number(staff.bonus) || 0))}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => onEdit(staff)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onDelete(staff.id)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={5} className="font-bold">Total Administrative Staff Costs</TableCell>
                <TableCell className="text-right font-bold">
                  {formatCurrency(calculations.totalAdminCosts)}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
};
