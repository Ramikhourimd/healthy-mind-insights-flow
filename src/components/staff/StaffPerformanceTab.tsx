
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { StaffPerformanceMetrics } from "@/types/finance";
import SatisfactionScoreTab from "./SatisfactionScoreTab";
import PerformanceOverviewTable from "./PerformanceOverviewTable";
import PerformanceMetricsDialog from "./PerformanceMetricsDialog";
import StaffPerformanceCsvImport from "./StaffPerformanceCsvImport";
import { useStaffPerformanceMetrics } from "@/hooks/useStaffPerformanceMetrics";

const StaffPerformanceTab: React.FC = () => {
  const {
    performanceMetrics,
    noShowRates,
    getMetricsForStaff,
    saveMetrics,
    fetchPerformanceMetrics,
    currentPeriod,
    staffMembers,
  } = useStaffPerformanceMetrics();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMetrics, setCurrentMetrics] = useState<Omit<StaffPerformanceMetrics, "id"> & { id?: string }>({
    staffId: "",
    month: currentPeriod.month,
    year: currentPeriod.year,
    satisfactionScore: undefined,
    availableHours: 0,
  });

  // Handle edit metrics
  const handleEditMetrics = (metrics: StaffPerformanceMetrics) => {
    setCurrentMetrics({
      id: metrics.id,
      staffId: metrics.staffId,
      month: metrics.month,
      year: metrics.year,
      satisfactionScore: metrics.satisfactionScore,
      availableHours: metrics.availableHours,
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  // Handle add new metrics
  const handleAddMetrics = (staffId?: string) => {
    setCurrentMetrics({
      staffId: staffId || (staffMembers.length > 0 ? staffMembers[0].id : ""),
      month: currentPeriod.month,
      year: currentPeriod.year,
      satisfactionScore: undefined,
      availableHours: 0,
    });
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  // Get clinical staff members only
  const clinicalStaff = staffMembers.filter(s => s.role === "Psychiatrist" || s.role === "CaseManager");

  return (
    <Tabs defaultValue="performance" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
        <TabsTrigger value="satisfaction">Satisfaction Scores</TabsTrigger>
      </TabsList>
      
      <TabsContent value="performance" className="space-y-4">
        <div className="flex justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium">Staff Performance Metrics</h3>
            <p className="text-sm text-muted-foreground">
              Track satisfaction scores, available hours, and no-show rates for {new Date(currentPeriod.year, currentPeriod.month - 1).toLocaleString('default', { month: 'long' })} {currentPeriod.year}
            </p>
          </div>
          <Button onClick={() => handleAddMetrics()}>
            <Plus className="mr-2 h-4 w-4" /> Add Metrics
          </Button>
        </div>

        <StaffPerformanceCsvImport 
          staffMembers={clinicalStaff}
          onImportComplete={fetchPerformanceMetrics}
        />

        <PerformanceOverviewTable
          clinicalStaff={clinicalStaff}
          getMetricsForStaff={getMetricsForStaff}
          noShowRates={noShowRates}
          onSaveMetrics={saveMetrics}
          onEditMetrics={handleEditMetrics}
          onAddMetrics={handleAddMetrics}
        />

        <PerformanceMetricsDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          isEditing={isEditing}
          clinicalStaff={clinicalStaff}
          currentMetrics={currentMetrics}
          setCurrentMetrics={setCurrentMetrics}
          onSuccess={fetchPerformanceMetrics}
          currentPeriod={currentPeriod}
        />
      </TabsContent>

      <TabsContent value="satisfaction">
        <SatisfactionScoreTab />
      </TabsContent>
    </Tabs>
  );
};

export default StaffPerformanceTab;
