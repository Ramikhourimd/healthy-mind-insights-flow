
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { StaffMember, StaffPerformanceMetrics } from "@/types/finance";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PerformanceMetricsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isEditing: boolean;
  clinicalStaff: StaffMember[];
  currentMetrics: Omit<StaffPerformanceMetrics, "id"> & { id?: string };
  setCurrentMetrics: (metrics: Omit<StaffPerformanceMetrics, "id"> & { id?: string }) => void;
  onSuccess: () => void;
  currentPeriod: { month: number; year: number };
}

const PerformanceMetricsDialog: React.FC<PerformanceMetricsDialogProps> = ({
  isOpen,
  onClose,
  isEditing,
  clinicalStaff,
  currentMetrics,
  setCurrentMetrics,
  onSuccess,
  currentPeriod,
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);

      const metricsData = {
        staff_id: currentMetrics.staffId,
        month: currentMetrics.month,
        year: currentMetrics.year,
        satisfaction_score: currentMetrics.satisfactionScore || null,
        available_hours: currentMetrics.availableHours,
      };

      if (isEditing && currentMetrics.id) {
        const { error } = await supabase
          .from('staff_performance_metrics')
          .update(metricsData)
          .eq('id', currentMetrics.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Performance metrics updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from('staff_performance_metrics')
          .insert(metricsData);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Performance metrics added successfully.",
        });
      }

      onClose();
      onSuccess();
    } catch (error) {
      console.error("Error saving performance metrics:", error);
      toast({
        title: "Error",
        description: "Failed to save performance metrics.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Performance Metrics" : "Add Performance Metrics"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="staffId">Staff Member</Label>
              <select
                id="staffId"
                value={currentMetrics.staffId}
                onChange={(e) => setCurrentMetrics({ ...currentMetrics, staffId: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
                disabled={isEditing}
              >
                <option value="">Select Staff Member</option>
                {clinicalStaff.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name} ({staff.role})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="satisfactionScore">Satisfaction Score (0-100%)</Label>
              <Input
                id="satisfactionScore"
                type="number"
                min="0"
                max="100"
                value={currentMetrics.satisfactionScore || ""}
                onChange={(e) => setCurrentMetrics({ 
                  ...currentMetrics, 
                  satisfactionScore: e.target.value ? Number(e.target.value) : undefined 
                })}
                placeholder="Enter satisfaction score"
              />
            </div>

            <div className="grid w-full items-center gap-2">
              <Label htmlFor="availableHours">Available Hours (Bank Hours)</Label>
              <Input
                id="availableHours"
                type="number"
                min="0"
                step="0.1"
                value={currentMetrics.availableHours}
                onChange={(e) => setCurrentMetrics({ 
                  ...currentMetrics, 
                  availableHours: Number(e.target.value) || 0 
                })}
                required
              />
            </div>

            <div className="text-sm text-muted-foreground">
              <strong>Note:</strong> No-show rate is calculated automatically based on clinical session data.
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : (isEditing ? "Update" : "Add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PerformanceMetricsDialog;
