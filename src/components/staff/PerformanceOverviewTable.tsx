
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil } from "lucide-react";
import { StaffMember, StaffPerformanceMetrics } from "@/types/finance";
import EditableTableCell from "./EditableTableCell";

interface PerformanceOverviewTableProps {
  clinicalStaff: StaffMember[];
  getMetricsForStaff: (staffId: string) => StaffPerformanceMetrics | undefined;
  noShowRates: {[key: string]: number};
  onSaveMetrics: (staffId: string, field: 'satisfactionScore' | 'availableHours', value: number | undefined) => Promise<void>;
  onEditMetrics: (metrics: StaffPerformanceMetrics) => void;
  onAddMetrics: (staffId: string) => void;
}

const PerformanceOverviewTable: React.FC<PerformanceOverviewTableProps> = ({
  clinicalStaff,
  getMetricsForStaff,
  noShowRates,
  onSaveMetrics,
  onEditMetrics,
  onAddMetrics,
}) => {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Performance Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff Member</TableHead>
              <TableHead className="text-right">Satisfaction Score (%)</TableHead>
              <TableHead className="text-right">Available Hours</TableHead>
              <TableHead className="text-right">No-Show Rate (%)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clinicalStaff.length > 0 ? (
              clinicalStaff.map((staff) => {
                const metrics = getMetricsForStaff(staff.id);
                const noShowRate = noShowRates[staff.id];
                
                return (
                  <TableRow key={staff.id}>
                    <TableCell>{staff.name}</TableCell>
                    <TableCell className="text-right">
                      <EditableTableCell
                        value={metrics?.satisfactionScore}
                        onSave={(value) => onSaveMetrics(staff.id, 'satisfactionScore', value)}
                        type="satisfactionScore"
                        displaySuffix="%"
                        placeholder="Not set"
                        min="0"
                        max="100"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <EditableTableCell
                        value={metrics?.availableHours}
                        onSave={(value) => onSaveMetrics(staff.id, 'availableHours', value)}
                        type="availableHours"
                        placeholder="Not set"
                        min="0"
                        step="0.1"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      {noShowRate !== undefined ? `${noShowRate}%` : "Calculating..."}
                    </TableCell>
                    <TableCell className="text-right">
                      {metrics ? (
                        <Button variant="ghost" size="icon" onClick={() => onEditMetrics(metrics)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => onAddMetrics(staff.id)}>
                          Add Metrics
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">No clinical staff members found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PerformanceOverviewTable;
