
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useFinance } from "@/context/FinanceContext";
import { toast } from "sonner";
import { FinancialSettings } from "@/types/finance";

const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useFinance();
  const [formData, setFormData] = useState<FinancialSettings>(
    settings as FinancialSettings
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      // Handle nested objects like bonusCsatThresholds.level1
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent as keyof typeof formData],
          [child]: parseFloat(value)
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: parseFloat(value)
      });
    }
  };

  const handleSaveSettings = () => {
    updateSettings(formData);
    toast.success("Settings saved successfully");
  };

  // Format percentage for display and input
  const formatPercentForInput = (value: number) => {
    return (value * 100).toString();
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Financial Settings</h1>
        <p className="text-gray-500 mt-1">
          Configure rates, thresholds, and other financial parameters
        </p>
      </div>

      <Tabs defaultValue="general" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General Settings</TabsTrigger>
          <TabsTrigger value="bonus">Bonus Calculation</TabsTrigger>
          <TabsTrigger value="rates">Standard Rates</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-medium">General Financial Settings</CardTitle>
              <CardDescription>Configure key financial targets and parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="vatRate">VAT Rate (%)</Label>
                  <div className="flex items-center mt-1">
                    <Input 
                      id="vatRate"
                      name="vatRate"
                      type="number"
                      value={formatPercentForInput(formData.vatRate)}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      step="0.1"
                      className="w-32"
                    />
                    <span className="ml-2">%</span>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-base font-medium mb-3">Target Payroll Ratios</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="targetClinicalPayrollToRevenueRatio">Clinical Payroll to Revenue Target (%)</Label>
                      <div className="flex items-center mt-1">
                        <Input 
                          id="targetClinicalPayrollToRevenueRatio"
                          name="targetClinicalPayrollToRevenueRatio"
                          type="number"
                          value={formatPercentForInput(formData.targetClinicalPayrollToRevenueRatio)}
                          onChange={handleInputChange}
                          min="0"
                          max="100"
                          step="0.5"
                          className="w-32"
                        />
                        <span className="ml-2">%</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Clinical staff costs should not exceed this percentage of total revenue
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="targetTotalPayrollToRevenueRatio">Total Payroll to Revenue Target (%)</Label>
                      <div className="flex items-center mt-1">
                        <Input 
                          id="targetTotalPayrollToRevenueRatio"
                          name="targetTotalPayrollToRevenueRatio"
                          type="number"
                          value={formatPercentForInput(formData.targetTotalPayrollToRevenueRatio)}
                          onChange={handleInputChange}
                          min="0"
                          max="100"
                          step="0.5"
                          className="w-32"
                        />
                        <span className="ml-2">%</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        All staff costs (clinical + admin) should not exceed this percentage of total revenue
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveSettings}>Save Settings</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bonus">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Bonus Calculation Settings</CardTitle>
              <CardDescription>Configure thresholds and percentages for the quarterly bonus system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-medium mb-3">CSAT Score Thresholds</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="bonusCsatThresholds.level1">Level 1 (1 point)</Label>
                      <Input 
                        id="bonusCsatThresholds.level1"
                        name="bonusCsatThresholds.level1"
                        type="number"
                        value={formData.bonusCsatThresholds.level1}
                        onChange={handleInputChange}
                        min="0"
                        max="5"
                        step="0.1"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bonusCsatThresholds.level2">Level 2 (2 points)</Label>
                      <Input 
                        id="bonusCsatThresholds.level2"
                        name="bonusCsatThresholds.level2"
                        type="number"
                        value={formData.bonusCsatThresholds.level2}
                        onChange={handleInputChange}
                        min="0"
                        max="5"
                        step="0.1"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bonusCsatThresholds.level3">Level 3 (3 points)</Label>
                      <Input 
                        id="bonusCsatThresholds.level3"
                        name="bonusCsatThresholds.level3"
                        type="number"
                        value={formData.bonusCsatThresholds.level3}
                        onChange={handleInputChange}
                        min="0"
                        max="5"
                        step="0.1"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-base font-medium mb-3">No-Show Rate Thresholds</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="bonusNoShowThresholds.level1">Level 1 (1 point)</Label>
                      <div className="flex items-center mt-1">
                        <Input 
                          id="bonusNoShowThresholds.level1"
                          name="bonusNoShowThresholds.level1"
                          type="number"
                          value={formatPercentForInput(formData.bonusNoShowThresholds.level1)}
                          onChange={handleInputChange}
                          min="0"
                          max="100"
                          step="0.5"
                          className="w-20"
                        />
                        <span className="ml-2">%</span>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="bonusNoShowThresholds.level2">Level 2 (2 points)</Label>
                      <div className="flex items-center mt-1">
                        <Input 
                          id="bonusNoShowThresholds.level2"
                          name="bonusNoShowThresholds.level2"
                          type="number"
                          value={formatPercentForInput(formData.bonusNoShowThresholds.level2)}
                          onChange={handleInputChange}
                          min="0"
                          max="100"
                          step="0.5"
                          className="w-20"
                        />
                        <span className="ml-2">%</span>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="bonusNoShowThresholds.level3">Level 3 (3 points)</Label>
                      <div className="flex items-center mt-1">
                        <Input 
                          id="bonusNoShowThresholds.level3"
                          name="bonusNoShowThresholds.level3"
                          type="number"
                          value={formatPercentForInput(formData.bonusNoShowThresholds.level3)}
                          onChange={handleInputChange}
                          min="0"
                          max="100"
                          step="0.5"
                          className="w-20"
                        />
                        <span className="ml-2">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveSettings}>Save Settings</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rates">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Standard Rates Configuration</CardTitle>
              <CardDescription>Configure standard rates for services and staff compensation</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-center text-muted-foreground">
                The rates configuration module will be available in the complete version.
                <br />
                This will allow setting standard service rates and staff compensation rates.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
