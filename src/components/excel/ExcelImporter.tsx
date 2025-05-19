
import React, { useState, useEffect } from 'react';
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  const [importError, setImportError] = useState<string | null>(null);
  const [staffNameLookup, setStaffNameLookup] = useState<Record<string, string>>({});

  // Create reverse staff mapping (name to ID) for debug display
  useEffect(() => {
    const lookup: Record<string, string> = {};
    staffMembers.forEach(staff => {
      lookup[staff.name] = staff.id;
    });
    setStaffNameLookup(lookup);
  }, [staffMembers]);

  // Create staff ID to name mapping
  const staffMap: Record<string, string> = {};
  staffMembers.forEach((staff) => {
    staffMap[staff.id] = staff.name;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setImportError(null);
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
    setImportError(null);
    
    try {
      console.log('Staff map for import:', staffMap);
      
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
        setImportError("No valid sessions could be extracted. Please make sure staff names in the Excel file match those in the system.");
        toast({
          title: "No valid data found",
          description: "Couldn't find any valid clinical sessions in the Excel file. Check staff names match your system.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error processing file:', error);
      setImportError("An error occurred while processing the file. Please check the file format and try again.");
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

  // Reset state when dialog is closed
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setFile(null);
      setImportError(null);
    }
    setIsOpen(open);
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

      <Dialog open={isOpen} onOpenChange={handleDialogClose}>
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

          {importError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Import Error</AlertTitle>
              <AlertDescription>{importError}</AlertDescription>
            </Alert>
          )}

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
              The Excel importer supports files with Hebrew column headers, typically exported from scheduling systems.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div>
              <h3 className="font-medium mb-1">Expected Columns (Hebrew)</h3>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li><strong>מזהה יומן</strong> - UID ייחודי לכל פגישה</li>
                <li><strong>שם יוצר</strong> - מי יצר את השורה (שמות המטפלים)</li>
                <li><strong>משאבים</strong> - שמות המטפלים/רופאים</li>
                <li><strong>סוג מפגש</strong> - סוג השירות (אינטייק, מעקב CM, מעקב פסיכיאטרי וכו')</li>
                <li><strong>כותרת</strong> - כולל סוג ומזהה-מטופל (למשל HM-MHS-530)</li>
                <li><strong>תאריך + שעה התחלה/סיום</strong> - תאריכי הפגישות</li>
                <li><strong>משך (דק׳)</strong> - משך הפגישה בדקות</li>
                <li><strong>סטטוס</strong> - מצב הפגישה, כולל "המשתתף לא הופיע" לפגישות שלא התקיימו</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium mb-1">איך המערכת מעבדת את המידע</h3>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li><strong>שם מטפל</strong> - נלקח מעמודת "משאבים" או "שם יוצר" ומועבר למזהה המטפל במערכת</li>
                <li><strong>סוג מרפאה (Clinic Type)</strong> - מחולץ מהכותרת, לדוגמה: HM-MHS-530 → MHS</li>
                <li><strong>סוג מפגש (Meeting Type)</strong> - נקבע כ-Intake אם "סוג מפגש" כולל "אינטייק" או "הערכה ראשונית", אחרת FollowUp</li>
                <li><strong>מצב הגעה (Show Status)</strong> - נקבע כ-NoShow אם "סטטוס" מכיל "המשתתף לא הופיע", אחרת Show</li>
                <li><strong>משך</strong> - נלקח מעמודת "משך (דק׳)" או מחושב מזמני התחלה וסיום</li>
              </ul>
            </div>
            
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
              <h3 className="font-medium text-amber-800 mb-1">חשוב לדעת</h3>
              <ul className="list-disc pl-6 text-sm text-amber-800">
                <li>וודא ששמות המטפלים בקובץ האקסל תואמים לשמות המטפלים במערכת</li>
                <li>הכותרת חייבת להכיל את קוד המרפאה בפורמט HM-XXX-123 או MH-XXX-123</li>
                <li>שדות חובה: שם מטפל, כותרת, סוג מפגש וסטטוס</li>
              </ul>
            </div>
            
            <div className="mt-4">
              <h3 className="font-medium mb-1">Staff Members in System</h3>
              <div className="text-xs p-2 bg-gray-50 rounded border max-h-32 overflow-y-auto">
                <ul className="list-disc pl-4 space-y-1">
                  {Object.entries(staffNameLookup).map(([name, id]) => (
                    <li key={id}>{name}</li>
                  ))}
                </ul>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Staff names in your Excel file should match one of these names.
              </p>
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
