
import * as XLSX from 'xlsx';
import { ClinicalSession, ClinicType, MeetingType, ShowStatus } from '@/types/finance';

// This function extracts clinical sessions from an Excel file with Hebrew columns
export const extractClinicalSessionsFromExcel = async (
  file: File, 
  staffMap: Record<string, string>,
  currentMonth: number,
  currentYear: number
): Promise<Omit<ClinicalSession, "id">[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        console.log('Extracted Excel data:', jsonData);

        // Map the Excel data to our clinical session format
        const sessions: Omit<ClinicalSession, "id">[] = [];
        
        // Hebrew column mappings (with possible variations)
        const hebrewMappings = {
          providerName: ['פרובידר', 'שם מטפל', 'מטפל', 'רופא', 'שם'],
          fullName: ['כותרת', 'שם מלא', 'לקוח'],
          serviceType: ['סוג מפגש', 'סוג שירות', 'סוג פגישה'],
          status: ['סטטוס', 'מצב'],
          duration: ['משך (דק׳)', 'משך', 'משך בדקות'],
          startTime: ['שעת התחלה', 'התחלה', 'תאריך + שעה התחלה'],
          endTime: ['שעת סיום', 'סיום', 'תאריך + שעה סיום']
        };
        
        // Process each row in the Excel data
        jsonData.forEach((row: any) => {
          // Find the provider/staff name
          let staffName = '';
          for (const key of hebrewMappings.providerName) {
            if (row[key]) {
              staffName = row[key];
              break;
            }
          }
          
          // Find staff ID from name
          const staffId = findStaffIdByName(staffName, staffMap);
          
          // Find service type
          let serviceType = '';
          for (const key of hebrewMappings.serviceType) {
            if (row[key]) {
              serviceType = row[key];
              break;
            }
          }
          
          // Find status
          let status = '';
          for (const key of hebrewMappings.status) {
            if (row[key]) {
              status = row[key];
              break;
            }
          }
          
          // Find full name / title containing clinic code
          let fullName = '';
          for (const key of hebrewMappings.fullName) {
            if (row[key]) {
              fullName = row[key];
              break;
            }
          }
          
          // Find duration
          let duration = 0;
          for (const key of hebrewMappings.duration) {
            if (row[key] && !isNaN(Number(row[key]))) {
              duration = Number(row[key]);
              break;
            }
          }
          
          // If we couldn't find duration directly, try to calculate it from start/end times
          if (duration === 0) {
            let startTime = null;
            let endTime = null;
            
            for (const key of hebrewMappings.startTime) {
              if (row[key]) {
                startTime = new Date(row[key]);
                break;
              }
            }
            
            for (const key of hebrewMappings.endTime) {
              if (row[key]) {
                endTime = new Date(row[key]);
                break;
              }
            }
            
            if (startTime && endTime && !isNaN(startTime.getTime()) && !isNaN(endTime.getTime())) {
              // Calculate duration in minutes
              duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
            } else {
              // Default duration if we can't calculate
              duration = 60;
            }
          }
          
          // Extract clinic type from fullName (format: "MH-MCB-123")
          let clinicType: ClinicType = 'MCB'; // Default
          if (fullName && typeof fullName === 'string') {
            const match = fullName.match(/MH[-_]([A-Za-z]+)[-_]/);
            if (match && match[1]) {
              clinicType = mapClinicType(match[1]);
            }
          }
          
          // Determine meeting type based on serviceType
          let meetingType: MeetingType = 'FollowUp'; // Default
          if (serviceType && typeof serviceType === 'string') {
            if (serviceType.includes('אינטייק') || serviceType.includes('הערכה ראשונית')) {
              meetingType = 'Intake';
            }
          }
          
          // Determine show status
          let showStatus: ShowStatus = 'Show'; // Default
          if (status && typeof status === 'string') {
            if (status === 'המשתתף לא הופיע') {
              showStatus = 'NoShow';
            }
          }
          
          // Count is always 1 for individual sessions
          const count = 1;
          
          // Only add if we have a valid staff ID
          if (staffId) {
            sessions.push({
              staffId,
              clinicType: clinicType as ClinicType,
              meetingType: meetingType as MeetingType,
              showStatus: showStatus as ShowStatus,
              count: count,
              duration: duration,
              month: currentMonth,
              year: currentYear
            });
          } else if (staffName) {
            // Log if we have a staff name but couldn't find the ID
            console.warn(`Could not find staff ID for name: ${staffName}`);
          }
        });
        
        // Aggregate sessions with the same properties
        const aggregatedSessions = aggregateSessions(sessions);
        
        console.log('Mapped and aggregated sessions:', aggregatedSessions);
        resolve(aggregatedSessions);
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsArrayBuffer(file);
  });
};

// Aggregate sessions with the same properties (staff, clinic, type, status)
const aggregateSessions = (sessions: Omit<ClinicalSession, "id">[]) => {
  const aggregated: Omit<ClinicalSession, "id">[] = [];
  const sessionMap = new Map<string, Omit<ClinicalSession, "id">>();
  
  sessions.forEach(session => {
    const key = `${session.staffId}-${session.clinicType}-${session.meetingType}-${session.showStatus}-${session.duration}`;
    
    if (sessionMap.has(key)) {
      const existing = sessionMap.get(key)!;
      existing.count += session.count;
    } else {
      sessionMap.set(key, {...session});
    }
  });
  
  sessionMap.forEach(session => {
    aggregated.push(session);
  });
  
  return aggregated;
};

// Helper to find staff ID by name
const findStaffIdByName = (name: string, staffMap: Record<string, string>): string => {
  if (!name) return '';
  
  // First, check exact match
  for (const [id, staffName] of Object.entries(staffMap)) {
    if (staffName.toLowerCase() === name.toLowerCase()) {
      return id;
    }
  }
  
  // Then, check partial match
  for (const [id, staffName] of Object.entries(staffMap)) {
    if (staffName.toLowerCase().includes(name.toLowerCase()) || 
        name.toLowerCase().includes(staffName.toLowerCase())) {
      return id;
    }
  }
  
  return '';
};

// Map various clinic abbreviations/names to our standard types
const mapClinicType = (rawClinic: string): ClinicType => {
  const normalized = rawClinic.toUpperCase().trim();
  
  if (normalized.includes('MCB')) return 'MCB';
  if (normalized.includes('PRV')) return 'PRV';
  if (normalized.includes('MHS')) return 'MHS';
  if (normalized.includes('MHN')) return 'MHN';
  if (normalized.includes('MHY')) return 'MHY';
  if (normalized.includes('MSY')) return 'MSY';
  if (normalized.includes('SPC')) return 'SPC';
  if (normalized.includes('MHB')) return 'MHB';
  
  // Default to MCB if no match
  return 'MCB';
};
