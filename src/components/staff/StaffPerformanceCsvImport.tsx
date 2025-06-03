
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StaffMember } from "@/types/finance";

interface StaffPerformanceCsvImportProps {
  staffMembers: StaffMember[];
  onImportComplete: () => void;
}

interface CsvRecord {
  staff_name: string;
  month: string;
  year: string;
  satisfaction_score?: string;
  available_hours?: string;
}

const StaffPerformanceCsvImport: React.FC<StaffPerformanceCsvImportProps> = ({
  staffMembers,
  onImportComplete,
}) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file);
      } else {
        toast({
          title: "Invalid File",
          description: "Please select a CSV file (.csv)",
          variant: "destructive",
        });
      }
    }
  };

  // Parse CSV file
  const parseCSV = (csvText: string): CsvRecord[] => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const records: CsvRecord[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const record: any = {};
      
      headers.forEach((header, index) => {
        record[header] = values[index] || '';
      });
      
      records.push(record as CsvRecord);
    }
    
    return records;
  };

  // Process and upload CSV data
  const handleProcessUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file first.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const csvText = await selectedFile.text();
      const records = parseCSV(csvText);
      
      console.log('Parsed CSV records:', records);

      if (records.length === 0) {
        throw new Error('No data found in CSV file');
      }

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const record of records) {
        try {
          // Find staff member by name
          const staffMember = staffMembers.find(s => 
            s.name.toLowerCase() === record.staff_name.toLowerCase()
          );

          if (!staffMember) {
            errors.push(`Staff member "${record.staff_name}" not found`);
            errorCount++;
            continue;
          }

          // Validate month and year
          const month = parseInt(record.month);
          const year = parseInt(record.year);
          
          if (isNaN(month) || month < 1 || month > 12) {
            errors.push(`Invalid month "${record.month}" for ${record.staff_name}`);
            errorCount++;
            continue;
          }

          if (isNaN(year) || year < 2020 || year > 2030) {
            errors.push(`Invalid year "${record.year}" for ${record.staff_name}`);
            errorCount++;
            continue;
          }

          // Parse satisfaction score and available hours
          const satisfactionScore = record.satisfaction_score && record.satisfaction_score !== '' 
            ? parseFloat(record.satisfaction_score) 
            : null;
          
          const availableHours = record.available_hours && record.available_hours !== '' 
            ? parseFloat(record.available_hours) 
            : null;

          // Validate satisfaction score if provided
          if (satisfactionScore !== null && (isNaN(satisfactionScore) || satisfactionScore < 0 || satisfactionScore > 100)) {
            errors.push(`Invalid satisfaction score "${record.satisfaction_score}" for ${record.staff_name}`);
            errorCount++;
            continue;
          }

          // Validate available hours if provided
          if (availableHours !== null && (isNaN(availableHours) || availableHours < 0)) {
            errors.push(`Invalid available hours "${record.available_hours}" for ${record.staff_name}`);
            errorCount++;
            continue;
          }

          // Check if record already exists
          const { data: existing } = await supabase
            .from('staff_performance_metrics')
            .select('id')
            .eq('staff_id', staffMember.id)
            .eq('month', month)
            .eq('year', year)
            .single();

          const metricsData = {
            staff_id: staffMember.id,
            month,
            year,
            satisfaction_score: satisfactionScore,
            available_hours: availableHours || 0,
          };

          if (existing) {
            // Update existing record
            const { error } = await supabase
              .from('staff_performance_metrics')
              .update(metricsData)
              .eq('id', existing.id);

            if (error) throw error;
          } else {
            // Insert new record
            const { error } = await supabase
              .from('staff_performance_metrics')
              .insert(metricsData);

            if (error) throw error;
          }

          successCount++;
        } catch (error) {
          console.error(`Error processing record for ${record.staff_name}:`, error);
          errors.push(`Error processing ${record.staff_name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          errorCount++;
        }
      }

      // Show results
      if (successCount > 0) {
        toast({
          title: "Import Completed",
          description: `Successfully imported ${successCount} records. ${errorCount > 0 ? `${errorCount} errors occurred.` : ''}`,
        });
        onImportComplete();
      }

      if (errors.length > 0) {
        console.error('Import errors:', errors);
        toast({
          title: "Import Errors",
          description: `${errorCount} records failed to import. Check console for details.`,
          variant: "destructive",
        });
      }

      setSelectedFile(null);
      // Reset file input
      const fileInput = document.getElementById('csv-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error("Error processing CSV:", error);
      toast({
        title: "Import Failed",
        description: `Failed to process the CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Download CSV template
  const downloadTemplate = () => {
    const csvContent = `staff_name,month,year,satisfaction_score,available_hours
Dr. John Smith,11,2024,85,40
Jane Doe,11,2024,,35
Dr. Sarah Wilson,11,2024,92,45`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'staff_performance_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import Staff Performance Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid w-full items-center gap-2">
          <Label htmlFor="csv-upload">Select CSV File</Label>
          <Input
            id="csv-upload"
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
        </div>
        
        {selectedFile && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>{selectedFile.name}</span>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={handleProcessUpload} 
            disabled={!selectedFile || isUploading}
            className="flex-1"
          >
            {isUploading ? "Processing..." : "Import CSV"}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={downloadTemplate}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Template
          </Button>
        </div>

        <div className="text-sm text-muted-foreground space-y-2">
          <p><strong>CSV Format:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>staff_name:</strong> Exact name as it appears in the system</li>
            <li><strong>month:</strong> Month number (1-12)</li>
            <li><strong>year:</strong> Year (e.g., 2024)</li>
            <li><strong>satisfaction_score:</strong> Score 0-100 (optional, leave empty if not available)</li>
            <li><strong>available_hours:</strong> Decimal number (optional, leave empty if not available)</li>
          </ul>
          <p><strong>Note:</strong> Existing records will be updated, new records will be created.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default StaffPerformanceCsvImport;
