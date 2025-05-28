import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFinance } from "@/context/FinanceContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ExcelImporter from "@/components/excel/ExcelImporter";

const ClinicalStaffTab: React.FC = () => {
  const { 
    clinicalSessions, 
    staffMembers, 
    currentPeriod,
    addClinicalSession,
    deleteClinicalSession
  } = useFinance();

  const { toast } = useToast();

  // Filter sessions for current period
  const filteredSessions = clinicalSessions.filter(
    session => session.month === currentPeriod.month && session.year === currentPeriod.year
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

  // Handle import sessions
  const handleImportSessions = async (sessions: any[]) => {
    try {
      for (const session of sessions) {
        await addClinicalSession({
          staffId: session.staffId,
          clinicType: session.clinicType,
          meetingType: session.meetingType,
          showStatus: session.showStatus,
          serviceAgeGroup: session.serviceAgeGroup || "Adult",
          count: session.count,
          duration: session.duration,
          month: currentPeriod.month,
          year: currentPeriod.year,
        });
      }
      toast({
        title: "Import Successful",
        description: `Imported ${sessions.length} clinical sessions.`,
      });
    } catch (error) {
      console.error("Error importing sessions:", error);
      toast({
        title: "Import Failed",
        description: "There was an error importing the sessions.",
        variant: "destructive",
      });
    }
  };

  // Handle clear all data
  const handleClearData = async () => {
    if (!confirm(`Are you sure you want to clear all clinical sessions for ${new Date(currentPeriod.year, currentPeriod.month - 1).toLocaleString('default', { month: 'long' })} ${currentPeriod.year}? This action cannot be undone.`)) {
      return;
    }

    try {
      const deletePromises = filteredSessions.map(session => 
        deleteClinicalSession(session.id)
      );
      
      await Promise.all(deletePromises);
      
      toast({
        title: "Data Cleared",
        description: `Cleared ${filteredSessions.length} clinical sessions.`,
      });
    } catch (error) {
      console.error("Error clearing sessions:", error);
      toast({
        title: "Clear Failed",
        description: "There was an error clearing the sessions.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="flex justify-between mb-4">
        <div className="flex gap-2">
          <ExcelImporter 
            staffMembers={staffMembers}
            currentPeriod={currentPeriod}
            onImport={handleImportSessions}
          />
          {filteredSessions.length > 0 && (
            <Button 
              variant="destructive" 
              onClick={handleClearData}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Clear All Data
            </Button>
          )}
        </div>
        <Button onClick={() => window.location.href = '/clinical-sessions'}>
          <Plus className="mr-2 h-4 w-4" /> Add Clinical Session
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-medium">
            Clinical Staff Sessions ({filteredSessions.reduce((sum, session) => sum + (Number(session.count) || 0), 0)} total sessions)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff</TableHead>
                <TableHead>Clinic</TableHead>
                <TableHead>Meeting Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Age Group</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead className="text-right">Duration (min)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSessions.length > 0 ? (
                filteredSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>{getStaffNameById(session.staffId)}</TableCell>
                    <TableCell>{session.clinicType}</TableCell>
                    <TableCell>{session.meetingType}</TableCell>
                    <TableCell>{session.showStatus}</TableCell>
                    <TableCell>{session.serviceAgeGroup}</TableCell>
                    <TableCell className="text-right">{session.count}</TableCell>
                    <TableCell className="text-right">{session.duration}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">No clinical sessions recorded for this period</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Session Summary by Staff */}
      {staffMembers.filter(s => s.role === "Psychiatrist" || s.role === "CaseManager").length > 0 && (
        <div className="mt-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Session Summary by Staff</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead className="text-right">Intakes</TableHead>
                    <TableHead className="text-right">Follow-Ups</TableHead>
                    <TableHead className="text-right">No-Shows</TableHead>
                    <TableHead className="text-right">Total Sessions</TableHead>
                    <TableHead className="text-right">Total Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffMembers
                    .filter(staff => staff.role === "Psychiatrist" || staff.role === "CaseManager")
                    .map(staff => {
                      const staffSessions = filteredSessions.filter(s => s.staffId === staff.id);
                      const intakes = staffSessions.filter(s => s.meetingType === "Intake").reduce((sum, s) => sum + (Number(s.count) || 0), 0);
                      const followUps = staffSessions.filter(s => s.meetingType === "FollowUp").reduce((sum, s) => sum + (Number(s.count) || 0), 0);
                      const noShows = staffSessions.filter(s => s.showStatus === "NoShow").reduce((sum, s) => sum + (Number(s.count) || 0), 0);
                      const totalSessions = staffSessions.reduce((sum, s) => sum + (Number(s.count) || 0), 0);
                      const totalMinutes = staffSessions.reduce((sum, s) => sum + ((Number(s.count) || 0) * (Number(s.duration) || 0)), 0);
                      const totalHours = Math.round(totalMinutes / 60 * 10) / 10;

                      return (
                        <TableRow key={staff.id}>
                          <TableCell>{staff.name}</TableCell>
                          <TableCell className="text-right">{intakes}</TableCell>
                          <TableCell className="text-right">{followUps}</TableCell>
                          <TableCell className="text-right">{noShows}</TableCell>
                          <TableCell className="text-right">{totalSessions}</TableCell>
                          <TableCell className="text-right">{totalHours}</TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default ClinicalStaffTab;
