
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";

interface ExpenseSummaryProps {
  calculations: any;
  filteredData: any;
  clinicalBreakdownOpen: boolean;
  setClinicalBreakdownOpen: (open: boolean) => void;
  adminBreakdownOpen: boolean;
  setAdminBreakdownOpen: (open: boolean) => void;
  overheadBreakdownOpen: boolean;
  setOverheadBreakdownOpen: (open: boolean) => void;
  staffDetailBreakdowns: { [staffId: string]: boolean };
  toggleStaffDetailBreakdown: (staffId: string) => void;
  formatCurrency: (amount: number) => string;
}

export const ExpenseSummaryCard: React.FC<ExpenseSummaryProps> = ({
  calculations,
  filteredData,
  clinicalBreakdownOpen,
  setClinicalBreakdownOpen,
  adminBreakdownOpen,
  setAdminBreakdownOpen,
  overheadBreakdownOpen,
  setOverheadBreakdownOpen,
  staffDetailBreakdowns,
  toggleStaffDetailBreakdown,
  formatCurrency
}) => {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Expense Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">% of Total</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Clinical Staff Costs */}
            <TableRow>
              <TableCell>
                <Collapsible open={clinicalBreakdownOpen} onOpenChange={setClinicalBreakdownOpen}>
                  <CollapsibleTrigger className="flex items-center gap-2 hover:text-blue-600">
                    {clinicalBreakdownOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    Clinical Staff Costs
                  </CollapsibleTrigger>
                </Collapsible>
              </TableCell>
              <TableCell className="text-right">{formatCurrency(calculations.totalClinicalCosts)}</TableCell>
              <TableCell className="text-right">
                {calculations.totalExpenses > 0 ? (calculations.totalClinicalCosts / calculations.totalExpenses * 100).toFixed(1) : 0}%
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
            
            {/* Clinical Staff Breakdown */}
            <Collapsible open={clinicalBreakdownOpen} onOpenChange={setClinicalBreakdownOpen}>
              <CollapsibleContent>
                {Object.entries(calculations.clinicalBreakdown).map(([staffId, data]: [string, any]) => (
                  <React.Fragment key={staffId}>
                    <TableRow className="bg-gray-50">
                      <TableCell className="pl-8 text-sm text-gray-600">
                        <button 
                          onClick={() => toggleStaffDetailBreakdown(staffId)}
                          className="flex items-center gap-2 hover:text-blue-600"
                        >
                          {staffDetailBreakdowns[staffId] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                          {data.name} ({data.totalSessionCount} sessions)
                        </button>
                      </TableCell>
                      <TableCell className="text-right text-sm">{formatCurrency(data.totalCost)}</TableCell>
                      <TableCell className="text-right text-sm">
                        {calculations.totalClinicalCosts > 0 ? (data.totalCost / calculations.totalClinicalCosts * 100).toFixed(1) : 0}%
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                    
                    {/* Detailed Session Breakdown */}
                    {staffDetailBreakdowns[staffId] && (
                      <TableRow className="bg-blue-25">
                        <TableCell colSpan={4} className="pl-12">
                          <div className="space-y-1">
                            <div className="text-xs font-medium text-gray-700 mb-2">Session Details:</div>
                            {Object.entries(data.sessionTypeBreakdown).map(([sessionType, breakdown]: [string, any]) => (
                              <div key={sessionType} className="flex justify-between text-xs text-gray-600">
                                <span>{sessionType}: {breakdown.count} sessions @ {formatCurrency(breakdown.rate)} each</span>
                                <span>{formatCurrency(breakdown.cost)}</span>
                              </div>
                            ))}
                            <div className="border-t border-gray-200 pt-1 mt-2">
                              <div className="flex justify-between text-xs font-medium text-gray-700">
                                <span>Total: {data.totalSessionCount} sessions</span>
                                <span>{formatCurrency(data.totalCost)}</span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </CollapsibleContent>
            </Collapsible>

            {/* Administrative Staff Costs */}
            <TableRow>
              <TableCell>
                <Collapsible open={adminBreakdownOpen} onOpenChange={setAdminBreakdownOpen}>
                  <CollapsibleTrigger className="flex items-center gap-2 hover:text-blue-600">
                    {adminBreakdownOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    Administrative Staff Costs
                  </CollapsibleTrigger>
                </Collapsible>
              </TableCell>
              <TableCell className="text-right">{formatCurrency(calculations.totalAdminCosts)}</TableCell>
              <TableCell className="text-right">
                {calculations.totalExpenses > 0 ? (calculations.totalAdminCosts / calculations.totalExpenses * 100).toFixed(1) : 0}%
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
            
            {/* Admin Staff Breakdown */}
            <Collapsible open={adminBreakdownOpen} onOpenChange={setAdminBreakdownOpen}>
              <CollapsibleContent>
                {filteredData.filteredAdminStaff.map((staff: any) => (
                  <TableRow key={staff.id} className="bg-gray-50">
                    <TableCell className="pl-8 text-sm text-gray-600">
                      {staff.name} - {staff.role}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatCurrency((Number(staff.baseSalary) || 0) + (Number(staff.commission) || 0))}
                      <div className="text-xs text-gray-500">
                        Salary: {formatCurrency(Number(staff.baseSalary) || 0)} + Commission: {formatCurrency(Number(staff.commission) || 0)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {calculations.totalAdminCosts > 0 ? (((Number(staff.baseSalary) || 0) + (Number(staff.commission) || 0)) / calculations.totalAdminCosts * 100).toFixed(1) : 0}%
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                ))}
              </CollapsibleContent>
            </Collapsible>

            {/* Fixed Overheads */}
            <TableRow>
              <TableCell>
                <Collapsible open={overheadBreakdownOpen} onOpenChange={setOverheadBreakdownOpen}>
                  <CollapsibleTrigger className="flex items-center gap-2 hover:text-blue-600">
                    {overheadBreakdownOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    Fixed Overheads
                  </CollapsibleTrigger>
                </Collapsible>
              </TableCell>
              <TableCell className="text-right">{formatCurrency(calculations.totalFixedOverheads)}</TableCell>
              <TableCell className="text-right">
                {calculations.totalExpenses > 0 ? (calculations.totalFixedOverheads / calculations.totalExpenses * 100).toFixed(1) : 0}%
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
            
            {/* Fixed Overheads Breakdown */}
            <Collapsible open={overheadBreakdownOpen} onOpenChange={setOverheadBreakdownOpen}>
              <CollapsibleContent>
                {filteredData.filteredOverheads.map((overhead: any) => (
                  <TableRow key={overhead.id} className="bg-gray-50">
                    <TableCell className="pl-8 text-sm text-gray-600">
                      {overhead.name}
                    </TableCell>
                    <TableCell className="text-right text-sm">{formatCurrency(Number(overhead.monthlyCost) || 0)}</TableCell>
                    <TableCell className="text-right text-sm">
                      {calculations.totalFixedOverheads > 0 ? ((Number(overhead.monthlyCost) || 0) / calculations.totalFixedOverheads * 100).toFixed(1) : 0}%
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                ))}
              </CollapsibleContent>
            </Collapsible>

            {/* Total */}
            <TableRow className="border-t-2 border-gray-300">
              <TableCell className="font-bold">Total Expenses</TableCell>
              <TableCell className="text-right font-bold">{formatCurrency(calculations.totalExpenses)}</TableCell>
              <TableCell className="text-right font-bold">100%</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
