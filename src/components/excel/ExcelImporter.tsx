
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { extractClinicalSessionsFromExcel } from '@/utils/excelParser';
import { 
  ClinicalSession, 
  StaffMember,
  TimePeriod
} from '@/types/finance';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { useToast } from '@/components/ui/use-toast';
import { Bot, Upload, FileSpreadsheet, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ExcelImporterProps {
  staffMembers: StaffMember[];
  currentPeriod: TimePeriod;
  onImport: (sessions: Omit<ClinicalSession, "id">[]) => void;
}

const ExcelImporter: React.FC<ExcelImporterProps> = ({ 
  staffMembers, 
  currentPeriod, 
  onImport 
}) => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [extractedSessions, setExtractedSessions] = useState<Omit<ClinicalSession, "id">[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showFormatHelp, setShowFormatHelp] = useState(false);

  // Create staff name to ID mapping
  const staffMap: Record<string, string> = {};
  staffMembers.forEach((staff) => {
    staffMap[staff.id] = staff.name;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select an Excel file to upload",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const extractedData = await extractClinicalSessionsFromExcel(
        file,
        staffMap,
        currentPeriod.month,
        currentPeriod.year
      );
      
      setExtractedSessions(extractedData);
      
      if (extractedData.length > 0) {
        setShowConfirmDialog(true);
      } else {
        toast({
          title: "No valid data found",
          description: "Couldn't find any valid clinical sessions in the Excel file. Check staff names match your system.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Error processing file",
        description: "An error occurred while trying to process the Excel file",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmImport = () => {
    onImport(extractedSessions);
    setShowConfirmDialog(false);
    setFile(null);
    toast({
      title: "Data imported successfully",
      description: `${extractedSessions.length} sessions were imported`,
      variant: "default"
    });
  };

  const getStaffNameById = (id: string) => {
    const staff = staffMembers.find(s => s.id === id);
    return staff ? staff.name : "Unknown Staff";
  };

  return (
    <>
      <Button 
        className="flex items-center gap-2"
        onClick={() => setIsOpen(true)}
      >
        <Bot size={16} />
        <span>AI Excel Import</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Import Clinical Sessions from Excel
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setShowFormatHelp(true)}
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    View file format guidelines
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </DialogTitle>
            <DialogDescription>
              Upload an Excel file with your clinical sessions data and our AI will extract the relevant information.
            </DialogDescription>
          </DialogHeader>

          <Card className="border-dashed border-2 border-primary/50">
            <CardContent className="pt-6 pb-4 text-center">
              <div className="flex flex-col items-center justify-center">
                <FileSpreadsheet className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="mb-2 text-sm text-muted-foreground">
                  Upload an Excel file with your sessions data
                </p>
                <Input
                  id="excel-file"
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="max-w-xs"
                />
                {file && (
                  <p className="mt-2 text-sm">Selected: {file.name}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="gap-1"
            >
              <Upload className="h-4 w-4" />
              {isUploading ? "Processing..." : "Process File"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Help dialog for file format */}
      <Dialog open={showFormatHelp} onOpenChange={setShowFormatHelp}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Excel File Format Guidelines</DialogTitle>
            <DialogDescription>
              The Excel importer supports files with Hebrew column headers and can extract data from various column formats.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div>
              <h3 className="font-medium mb-1">Supported Columns (Hebrew)</h3>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li><strong>שם מטפל/פרובידר/רופא</strong> - שם המטפל (יועבר אוטומטית למזהה מטפל במערכת)</li>
                <li><strong>כותרת/שם מלא</strong> - צריך להכיל קוד מרפאה (למשל MH-MCB-123)</li>
                <li><strong>סוג מפגש/סוג שירות</strong> - סוג הטיפול, אם מכיל "אינטייק" או "הערכה ראשונית" יסווג כ-Intake</li>
                <li><strong>סטטוס/מצב</strong> - אם מכיל "המשתתף לא הופיע" יסווג כ-NoShow</li>
                <li><strong>משך (דק׳)/משך</strong> - משך הפגישה בדקות</li>
                <li><strong>שעת התחלה/סיום</strong> - אם משך לא נמסר, יחושב מהפרש השעות</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium mb-1">מידע שהמערכת מחלצת</h3>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li><strong>מטפל</strong> - מזהה את המטפל לפי שם</li>
                <li><strong>סוג מרפאה (Clinic Type)</strong> - מחולץ מכותרת/שם מלא (MH-XXX-123) כאשר XXX הוא סוג המרפאה</li>
                <li><strong>סוג מפגש (Meeting Type)</strong> - Intake או FollowUp לפי תיאור השירות</li>
                <li><strong>סטטוס הגעה (Show Status)</strong> - Show או NoShow לפי סטטוס</li>
                <li><strong>כמות</strong> - מספר המפגשים (ברירת מחדל: 1)</li>
                <li><strong>משך</strong> - משך המפגש בדקות</li>
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowFormatHelp(false)}>
              הבנתי
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Confirm Import</DialogTitle>
            <DialogDescription>
              We found {extractedSessions.length} clinical sessions. Would you like to import them?
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Staff</th>
                  <th className="text-left py-2">Clinic</th>
                  <th className="text-left py-2">Type</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-right py-2">Count</th>
                  <th className="text-right py-2">Duration</th>
                </tr>
              </thead>
              <tbody>
                {extractedSessions.map((session, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{getStaffNameById(session.staffId)}</td>
                    <td className="py-2">{session.clinicType}</td>
                    <td className="py-2">{session.meetingType}</td>
                    <td className="py-2">{session.showStatus}</td>
                    <td className="py-2 text-right">{session.count}</td>
                    <td className="py-2 text-right">{session.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmImport}>
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ExcelImporter;
