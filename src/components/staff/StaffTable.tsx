
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash } from "lucide-react";
import { StaffMember } from "@/types/finance";

interface StaffTableProps {
  staffMembers: StaffMember[];
  onEditStaff: (staff: StaffMember) => void;
  onDeleteStaff: (id: string) => void;
  onEditRates: (staffId: string) => void;
}

export const StaffTable: React.FC<StaffTableProps> = ({
  staffMembers,
  onEditStaff,
  onDeleteStaff,
  onEditRates,
}) => {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Staff Members</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staffMembers.map((staff) => (
              <TableRow key={staff.id}>
                <TableCell>{staff.name}</TableCell>
                <TableCell>{staff.role}</TableCell>
                <TableCell>{staff.active ? "Yes" : "No"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => onEditStaff(staff)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDeleteStaff(staff.id)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => onEditRates(staff.id)}>
                      Edit Rates
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
