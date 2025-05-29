
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileSpreadsheet } from "lucide-react";
import * as XLSX from 'xlsx';

interface DoctorScore {
  doctor_name: string;
  average_psy_score: number;
  number_of_reviews: number;
}

interface CMScore {
  cm_name: string;
  average_cm1_score: number;
  number_of_reviews: number;
}

interface RawSatisfactionData {
  id_serial: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  start_time?: string;
  doctor?: string;
  cm?: string;
  psy?: number;
  psy_wait?: number;
  cm_1?: number;
  recommand?: number;
  comment?: string;
}

const SatisfactionScoreTab: React.FC = () => {
  const { toast } = useToast();
  
  const [doctorScores, setDoctorScores] = useState<DoctorScore[]>([]);
  const [cmScores, setCMScores] = useState<CMScore[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Fetch doctor and CM scores from database
  const fetchScores = async () => {
    try {
      // Fetch doctor scores
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctor_average_scores')
        .select('*')
        .order('average_psy_score', { ascending: false });

      if (doctorError) throw doctorError;
      setDoctorScores(doctorData || []);

      // Fetch CM scores
      const { data: cmData, error: cmError } = await supabase
        .from('cm_average_scores')
        .select('*')
        .order('average_cm1_score', { ascending: false });

      if (cmError) throw cmError;
      setCMScores(cmData || []);

    } catch (error) {
      console.error("Error fetching satisfaction scores:", error);
      toast({
        title: "Error",
        description: "Failed to fetch satisfaction scores.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchScores();
  }, []);

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.includes('sheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setSelectedFile(file);
      } else {
        toast({
          title: "Invalid File",
          description: "Please select an Excel file (.xlsx or .xls)",
          variant: "destructive",
        });
      }
    }
  };

  // Parse Excel file
  const parseExcelFile = (file: File): Promise<RawSatisfactionData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);

          console.log('Parsed Excel data:', jsonData);

          const parsedData: RawSatisfactionData[] = jsonData.map((row: any) => ({
            id_serial: String(row.ID_serial || row.id_serial || ''),
            first_name: row.first_name || row.FirstName || '',
            last_name: row.last_name || row.LastName || '',
            phone: row.phone || row.Phone || '',
            start_time: row.start_time || row.StartTime || '',
            doctor: row.Doctor || row.doctor || '',
            cm: row.CM || row.cm || '',
            psy: row.PSY || row.psy ? Number(row.PSY || row.psy) : undefined,
            psy_wait: row.PSYwait || row.psy_wait ? Number(row.PSYwait || row.psy_wait) : undefined,
            cm_1: row.CM_1 || row.cm_1 ? Number(row.CM_1 || row.cm_1) : undefined,
            recommand: row.Recommand || row.recommand ? Number(row.Recommand || row.recommand) : undefined,
            comment: row.comment || row.Comment || '',
          }));

          resolve(parsedData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  // Process and upload Excel data
  const handleProcessUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select an Excel file first.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Parse the Excel file
      const parsedData = await parseExcelFile(selectedFile);
      
      console.log('Processing', parsedData.length, 'records');

      // Clear existing raw data (replace strategy as requested)
      // Fix: Use a proper WHERE clause that will match all records
      const { error: deleteError } = await supabase
        .from('raw_satisfaction_data')
        .delete()
        .gte('created_at', '1900-01-01'); // This will match all records

      if (deleteError) throw deleteError;

      // Insert new raw data
      const insertData = parsedData.map(record => ({
        id_serial: record.id_serial,
        first_name: record.first_name || null,
        last_name: record.last_name || null,
        phone: record.phone || null,
        start_time: record.start_time ? new Date(record.start_time).toISOString() : null,
        doctor: record.doctor || null,
        cm: record.cm || null,
        psy: record.psy || null,
        psy_wait: record.psy_wait || null,
        cm_1: record.cm_1 || null,
        recommand: record.recommand || null,
        comment: record.comment || null,
      }));

      const { error: insertError } = await supabase
        .from('raw_satisfaction_data')
        .insert(insertData);

      if (insertError) throw insertError;

      // Calculate and update averages using the stored functions
      const { error: doctorCalcError } = await supabase.rpc('calculate_doctor_averages');
      if (doctorCalcError) throw doctorCalcError;

      const { error: cmCalcError } = await supabase.rpc('calculate_cm_averages');
      if (cmCalcError) throw cmCalcError;

      // Refresh the displayed data
      await fetchScores();

      toast({
        title: "Upload Successful",
        description: `Processed ${parsedData.length} records and updated satisfaction scores.`,
      });

      setSelectedFile(null);
      // Reset file input
      const fileInput = document.getElementById('excel-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error("Error processing upload:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to process the Excel file. Please check the format and try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Satisfaction Score Excel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="excel-upload">Select Excel File</Label>
            <Input
              id="excel-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
          </div>
          
          {selectedFile && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileSpreadsheet className="h-4 w-4" />
              <span>{selectedFile.name}</span>
            </div>
          )}

          <Button 
            onClick={handleProcessUpload} 
            disabled={!selectedFile || isUploading}
            className="w-full"
          >
            {isUploading ? "Processing..." : "Process & Upload Excel"}
          </Button>

          <div className="text-sm text-muted-foreground">
            <p><strong>Expected columns:</strong> ID_serial, first_name, last_name, phone, start_time, Doctor, CM, PSY, PSYwait, CM_1, Recommand, comment</p>
            <p><strong>Note:</strong> This will replace all existing satisfaction data with the new upload.</p>
          </div>
        </CardContent>
      </Card>

      {/* Doctor Average Scores */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Doctor Average PSY Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor Name</TableHead>
                <TableHead className="text-right">Average PSY Score</TableHead>
                <TableHead className="text-right">Number of Reviews</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doctorScores.length > 0 ? (
                doctorScores.map((doctor) => (
                  <TableRow key={doctor.doctor_name}>
                    <TableCell>{doctor.doctor_name}</TableCell>
                    <TableCell className="text-right">
                      {doctor.average_psy_score.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {doctor.number_of_reviews}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4">
                    No doctor scores available. Upload an Excel file to see data.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* CM Average Scores */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-medium">CM Average CM_1 Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CM Name</TableHead>
                <TableHead className="text-right">Average CM_1 Score</TableHead>
                <TableHead className="text-right">Number of Reviews</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cmScores.length > 0 ? (
                cmScores.map((cm) => (
                  <TableRow key={cm.cm_name}>
                    <TableCell>{cm.cm_name}</TableCell>
                    <TableCell className="text-right">
                      {cm.average_cm1_score.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {cm.number_of_reviews}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4">
                    No CM scores available. Upload an Excel file to see data.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SatisfactionScoreTab;
