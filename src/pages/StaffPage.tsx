
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinance } from "@/context/FinanceContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const StaffPage: React.FC = () => {
  const { staffMembers, currentPeriod } = useFinance();

  // Helper function for role badge
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "Psychiatrist":
        return <Badge className="bg-clinic-blue">Psychiatrist</Badge>;
      case "CaseManager":
        return <Badge className="bg-clinic-purple">Case Manager</Badge>;
      case "Admin":
        return <Badge className="bg-clinic-teal">Admin</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Staff Management</h1>
        <p className="text-gray-500 mt-1">
          Manage staff information and performance
        </p>
      </div>
      
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Staff Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffMembers.map((staff) => (
                <TableRow key={staff.id}>
                  <TableCell>{staff.name}</TableCell>
                  <TableCell>{getRoleBadge(staff.role)}</TableCell>
                  <TableCell>
                    <Badge variant={staff.active ? "default" : "outline"}>
                      {staff.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <span className="text-sm text-muted-foreground">
                        (Full functionality in the complete version)
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <p className="text-center text-sm text-muted-foreground mt-8">
        Full staff management functionality will be available in the complete version,
        including work tracking, rates management, and bonus calculations.
      </p>
    </div>
  );
};

export default StaffPage;
