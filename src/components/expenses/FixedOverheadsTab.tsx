
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash, Copy } from "lucide-react";

interface FixedOverheadsTabProps {
  filteredOverheads: any[];
  calculations: any;
  formatCurrency: (amount: number) => string;
  onAddNew: () => void;
  onEdit: (overhead: any) => void;
  onDelete: (id: string) => void;
  onCopyFromPreviousMonth: () => void;
}

export const FixedOverheadsTab: React.FC<FixedOverheadsTabProps> = ({
  filteredOverheads,
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
                  <TableCell className="text-right">{formatCurrency(Number(overhead.monthlyCost) || 0)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => onEdit(overhead)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onDelete(overhead.id)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell className="font-bold">Total Fixed Overheads</TableCell>
                <TableCell className="text-right font-bold">
                  {formatCurrency(calculations.totalFixedOverheads)}
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
