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
import { Bot, Upload, FileSpreadsheet, Info, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ExcelImporterProps {
  staffMembers: StaffMember[];
  currentPeriod: TimePeriod;
  onImport: (sessions: Omit<ClinicalSession, "id">[]) => void;
}

interface StaffNameMapping {
  excelName: string;
  systemStaffId: string;
}

const ExcelImporter: React.FC<ExcelImporterProps> = ({ 
  staffMembers, 
  currentPeriod, 
  onImport 
}) => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [extractedSessions, setExtractedSessions] = useState<Omit<ClinicalSession, "id">[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showFormatHelp, setShowFormatHelp] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [staffNameLookup, setStaffNameLookup] = useState<Record<string, string>>({});
  
  // New state for staff mapping
  const [showStaffMappingDialog, setShowStaffMappingDialog] = useState(false);
  const [unmappedStaffNames, setUnmappedStaffNames] = useState<string[]>([]);
  const [staffMappings, setStaffMappings] = useState<StaffNameMapping[]>([]);
  const [rawExcelData, setRawExcelData] = useState<any[]>([]);
  const [parseOptions, setParseOptions] = useState({ 
    manualMapping: false 
  });

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
    setUnmappedStaffNames([]);
    setStaffMappings([]);
    
    // Simulate processing progress
    const progressInterval = setInterval(() => {
      setProcessingProgress(prev => {
        const newProgress = prev + 5;
        return newProgress >= 90 ? 90 : newProgress;
      });
    }, 150);
    
    try {
      console.log('Excel import: Starting with staff members:', staffMembers.length);
      console.log('Staff map for import:', staffMap);
      
      // First extract raw data to identify staff names
      const { rawData, unmappedStaff } = await extractClinicalSessionsFromExcel(
        file,
        staffMap,
        currentPeriod.month,
        currentPeriod.year,
        { extractRawData: true }
      );
      
      console.log('Excel import: Raw data extracted, found rows:', rawData.length);
      console.log('Excel import: Unmapped staff:', unmappedStaff);
      
      setRawExcelData(rawData);
      
      // If there are unmapped staff names, show the mapping dialog
      if (unmappedStaff && unmappedStaff.length > 0) {
        console.log('Found unmapped staff names:', unmappedStaff);
        setUnmappedStaffNames(unmappedStaff);
        
        clearInterval(progressInterval);
        setProcessingProgress(100);
        
        setTimeout(() => {
          setIsUploading(false);
          setProcessingProgress(0);
          setShowStaffMappingDialog(true);
        }, 500);
        
        return;
      }
      
      // Process with automatic mapping
      const extractedData = await extractClinicalSessionsFromExcel(
        file,
        staffMap,
        currentPeriod.month,
        currentPeriod.year
      );
      
      console.log('Excel import: Extracted sessions data:', extractedData);
      
      clearInterval(progressInterval);
      setProcessingProgress(100);
      
      setExtractedSessions(extractedData);
      
      if (extractedData.length > 0) {
        setShowConfirmDialog(true);
        toast({
          title: "Processing complete",
          description: `Found ${extractedData.length} clinical sessions`,
        });
      } else {
        setImportError("No valid sessions could be extracted. Please map staff names manually.");
        toast({
          title: "Import Error",
          description: "No valid sessions could be extracted. Please try mapping staff names manually.",
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
      clearInterval(progressInterval);
      setProcessingProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        setProcessingProgress(0);
      }, 500);
    }
  };

  // Handle confirm import - add more debugging logs
  const handleConfirmImport = () => {
    console.log("Excel import: Importing sessions:", extractedSessions);
    
    if (extractedSessions.length === 0) {
      toast({
        title: "Import Error",
        description: "No sessions to import",
        variant: "destructive"
      });
      return;
    }
    
    // Call the onImport function with the extracted sessions
    onImport(extractedSessions);
    
    // Close the dialog and reset the state
    setShowConfirmDialog(false);
    setFile(null);
    
    // Add a slight delay before showing toast to allow processing
    setTimeout(() => {
      toast({
        title: "Data imported successfully",
        description: `${extractedSessions.length} sessions were imported`,
        variant: "default"
      });
      
      // Log after import is complete
      console.log("Excel import: Import completed, sessions should now be visible in the UI");
    }, 300);
  };

  const handleStaffMappingChange = (excelName: string, systemStaffId: string) => {
    // Update the mapping for this Excel staff name
    setStaffMappings(prevMappings => {
      const existingIndex = prevMappings.findIndex(m => m.excelName === excelName);
      
      if (existingIndex >= 0) {
        // Update existing mapping
        const newMappings = [...prevMappings];
        newMappings[existingIndex].systemStaffId = systemStaffId;
        return newMappings;
      } else {
        // Add new mapping
        return [...prevMappings, { excelName, systemStaffId }];
      }
    });
  };

  // Handle bulk import of sessions with additional debugging
  const handleApplyMappings = async () => {
    setShowStaffMappingDialog(false);
    setIsUploading(true);
    
    // Create temporary staff map with the manual mappings included
    const enhancedStaffMap = { ...staffMap };
    const excelToSystemMap: Record<string, string> = {};
    
    // Add manual mappings to the excel-to-system map
    staffMappings.forEach(mapping => {
      if (mapping.systemStaffId) {
        excelToSystemMap[mapping.excelName] = mapping.systemStaffId;
      }
    });
    
    console.log('Manual staff mappings:', excelToSystemMap);
    
    try {
      // Process with manual mappings
      const extractedData = await extractClinicalSessionsFromExcel(
        file!,
        staffMap,
        currentPeriod.month,
        currentPeriod.year,
        { 
          manualMapping: true,
          excelToSystemMap
        }
      );
      
      console.log("Excel import: Extracted sessions with manual mapping:", extractedData);
      setExtractedSessions(extractedData);
      
      if (extractedData.length > 0) {
        setShowConfirmDialog(true);
        toast({
          title: "Processing complete with manual mappings",
          description: `Found ${extractedData.length} clinical sessions`,
        });
      } else {
        setImportError("No valid sessions could be extracted even with manual mappings.");
        toast({
          title: "Import Error",
          description: "No valid sessions could be extracted even with manual mappings. Please check your file.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error processing with manual mappings:', error);
      setImportError("An error occurred while processing with manual mappings.");
    } finally {
      setIsUploading(false);
    }
  };

  const validateAndParseData = (data: any[]) => {
    return data.map((row, index) => {
      const staffMember = staffMembers.find(s => s.name === row.staff);
      if (!staffMember) {
        console.error(`Staff member not found for row ${index + 1}: ${row.staff}`);
        return null;
      }

      const clinicType = row.clinicType || row.clinic;
      const meetingType = row.meetingType || row.meeting;
      const showStatus = row.showStatus || row.status;

      // Ensure all numeric values are properly converted
      const count = Number(row.count) || 1;
      const duration = Number(row.duration) || 60;

      return {
        staffId: staffMember.id,
        clinicType: clinicType as ClinicType,
        meetingType: meetingType as MeetingType,
        showStatus: showStatus as ShowStatus,
        count: count, // Ensure it's a number
        duration: duration, // Ensure it's a number
        month: currentPeriod.month,
        year: currentPeriod.year,
      };
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
      setProcessingProgress(0);
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
              <AlertCircle className="h-4 w-4" />
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
                
                {isUploading && (
                  <div className="w-full mt-4">
                    <p className="text-sm mb-2">Processing file...</p>
                    <Progress value={processingProgress} className="h-2" />
                  </div>
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
              {isUploading ? (
                <span className="flex items-center">Processing...</span>
              ) : (
                <span className="flex items-center"><Upload className="h-4 w-4 mr-1" /> Process File</span>
              )}
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
            
            <Alert className="mt-4">
              <AlertTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                NEW: Manual Staff Mapping
              </AlertTitle>
              <AlertDescription>
                <p>If automatic staff name matching fails, you can now manually map Excel staff names to your system staff.</p>
              </AlertDescription>
            </Alert>
            
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
              <h3 className="font-medium text-amber-800 mb-1">חשוב לדעת</h3>
              <ul className="list-disc pl-6 text-sm text-amber-800">
                <li>וודא ששמות המטפלים בקובץ האקסל תואמים לשמות המטפלים במערכת</li>
                <li>הכותרת חייבת להכיל את קוד המרפאה בפורמט HM-XXX-123 או MH-XXX-123</li>
                <li>שדות חובה: שם מטפל, כותרת, סוג מפגש וסטטוס</li>
              </ul>
            </div>
            
            <Alert className="mt-4">
              <AlertTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Staff Name Matching
              </AlertTitle>
              <AlertDescription>
                <p className="mb-2">The system attempts to match Excel staff names with system staff using multiple strategies:</p>
                <ul className="list-disc pl-6 text-sm space-y-1">
                  <li>Exact name matching</li>
                  <li>Name with/without Dr. or ד"ר prefix</li>
                  <li>First/last name matching</li>
                  <li>Partial name matching</li>
                  <li>Hebrew/English transliteration matching</li>
                </ul>
              </AlertDescription>
            </Alert>
            
            <div className="mt-4">
              <h3 className="font-medium mb-1">Available Staff Members in System</h3>
              <div className="text-xs p-3 bg-gray-50 rounded border max-h-44 overflow-y-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-1 font-medium">Name</th>
                      <th className="text-left py-1 font-medium">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffMembers.map((staff) => (
                      <tr key={staff.id} className="border-b border-gray-100">
                        <td className="py-1.5">{staff.name}</td>
                        <td className="py-1.5 text-gray-600">{staff.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Staff names in your Excel file should match one of these names using one of the matching strategies.
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

      {/* NEW: Staff Mapping Dialog */}
      <Dialog open={showStaffMappingDialog} onOpenChange={setShowStaffMappingDialog}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Map Excel Staff Names to System Staff</DialogTitle>
            <DialogDescription>
              Some staff names in the Excel file couldn't be matched automatically to your system staff. 
              Please map each Excel staff name to the corresponding staff member in your system.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {unmappedStaffNames.length > 0 ? (
              <div className="space-y-4">
                {unmappedStaffNames.map((excelName, index) => (
                  <div key={index} className="grid grid-cols-5 items-center gap-4">
                    <div className="col-span-2">
                      <p className="text-sm font-medium">{excelName}</p>
                      <p className="text-xs text-muted-foreground">Excel staff name</p>
                    </div>
                    <div className="col-span-3">
                      <Select 
                        value={staffMappings.find(m => m.excelName === excelName)?.systemStaffId || ""}
                        onValueChange={(value) => handleStaffMappingChange(excelName, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select system staff" />
                        </SelectTrigger>
                        <SelectContent>
                          {staffMembers.map(staff => (
                            <SelectItem key={staff.id} value={staff.id}>
                              {staff.name} ({staff.role})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Alert>
                <AlertDescription>
                  No unmapped staff names found. This dialog shouldn't appear.
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          <DialogFooter className="flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={() => setShowStaffMappingDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApplyMappings}
              disabled={unmappedStaffNames.some(name => 
                !staffMappings.find(m => m.excelName === name && m.systemStaffId)
              )}
            >
              Apply Mappings & Continue
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
