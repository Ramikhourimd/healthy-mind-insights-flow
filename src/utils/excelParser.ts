
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

        console.log('Extracted raw Excel data:', jsonData);

        // Map the Excel data to our clinical session format
        const sessions: Omit<ClinicalSession, "id">[] = [];
        
        // Hebrew column mappings based on the provided template
        const hebrewMappings = {
          providerName: ['פרובידר', 'שם מטפל', 'מטפל', 'רופא', 'שם', 'שם יוצר', 'תאריך יצירה / שם יוצר'],
          resourceName: ['משאבים', 'משאב', 'ספק'], // Add specific column for resources/providers
          fullName: ['כותרת', 'שם מלא', 'לקוח', 'פרטי מטופל'],
          serviceType: ['סוג מפגש', 'סוג שירות', 'סוג פגישה'],
          status: ['סטטוס', 'מצב'],
          duration: ['משך (דק׳)', 'משך', 'משך בדקות', 'משך זמן בדקות'],
          startTime: ['שעת התחלה', 'התחלה', 'תאריך + שעה התחלה'],
          endTime: ['שעת סיום', 'סיום', 'תאריך + שעה סיום']
        };
        
        // Create a reverse map of staff names to IDs for easier lookup
        const staffNameToIdMap = createStaffNameToIdMap(staffMap);
        
        // Process each row in the Excel data
        jsonData.forEach((row: any) => {
          // Try to find the provider/staff name from different possible columns
          let staffName = '';
          
          // First try resource columns which typically have the actual provider name
          for (const key of hebrewMappings.resourceName) {
            if (row[key]) {
              staffName = String(row[key]).trim();
              break;
            }
          }
          
          // If not found in resource columns, try other provider name columns
          if (!staffName) {
            for (const key of hebrewMappings.providerName) {
              if (row[key]) {
                staffName = String(row[key]).trim();
                break;
              }
            }
          }
          
          // Skip rows where provider/staff name is empty
          if (!staffName) {
            console.log('Skipping row with no provider/staff name:', row);
            return; // Skip this iteration
          }
          
          // Find staff ID from name using improved matching
          const staffId = findStaffIdByName(staffName, staffMap, staffNameToIdMap);
          
          if (!staffId) {
            console.warn(`Could not find staff ID for name: ${staffName}`);
            return; // Skip this iteration
          }
          
          // Find service type
          let serviceType = '';
          for (const key of hebrewMappings.serviceType) {
            if (row[key]) {
              serviceType = String(row[key]).trim();
              break;
            }
          }
          
          // Find status
          let status = '';
          for (const key of hebrewMappings.status) {
            if (row[key]) {
              status = String(row[key]).trim();
              break;
            }
          }
          
          // Find full name / title containing clinic code
          let fullName = '';
          for (const key of hebrewMappings.fullName) {
            if (row[key]) {
              fullName = String(row[key]).trim();
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
          
          // Extract clinic type from fullName (format: "MH-MCB-123" or "HM-MHS-530")
          let clinicType: ClinicType = 'MCB'; // Default
          if (fullName && typeof fullName === 'string') {
            // More flexible regex to capture clinic code pattern
            const match = fullName.match(/[MH]{1,2}[-_\s]?([A-Za-z]{2,5})[-_\s]/i);
            if (match && match[1]) {
              clinicType = mapClinicType(match[1]);
            }
          }
          
          // Determine meeting type based on serviceType
          let meetingType: MeetingType = 'FollowUp'; // Default
          if (serviceType && typeof serviceType === 'string') {
            const serviceTypeLower = serviceType.toLowerCase();
            if (serviceTypeLower.includes('אינטייק') || 
                serviceTypeLower.includes('הערכה ראשונית') ||
                serviceTypeLower.includes('intake') ||
                serviceTypeLower.includes('ראשוני')) {
              meetingType = 'Intake';
            }
          }
          
          // Determine show status
          let showStatus: ShowStatus = 'Show'; // Default
          if (status && typeof status === 'string') {
            const statusLower = status.toLowerCase();
            if (statusLower.includes('לא הופיע') || 
                statusLower.includes('noshow') ||
                statusLower.includes('no show') ||
                statusLower.includes('ביטל')) {
              showStatus = 'NoShow';
            }
          }
          
          // Count is always 1 for individual sessions
          const count = 1;
          
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
        });
        
        // Aggregate sessions with the same properties
        const aggregatedSessions = aggregateSessions(sessions);
        
        console.log('Mapped and aggregated sessions:', aggregatedSessions);
        
        if (aggregatedSessions.length === 0) {
          console.warn('No sessions were found after mapping and aggregation. Check column names and staff mapping.');
        }
        
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

// Create a map of normalized staff names to IDs for fuzzy matching
const createStaffNameToIdMap = (staffMap: Record<string, string>): Record<string, string> => {
  const nameToIdMap: Record<string, string> = {};
  
  for (const [id, name] of Object.entries(staffMap)) {
    // Add the full name
    const normalizedName = normalizeString(name);
    nameToIdMap[normalizedName] = id;
    
    // Add first name only
    const firstName = name.split(' ')[0];
    const normalizedFirstName = normalizeString(firstName);
    if (!nameToIdMap[normalizedFirstName]) {
      nameToIdMap[normalizedFirstName] = id;
    }
    
    // Add last name only
    const nameParts = name.split(' ');
    if (nameParts.length > 1) {
      const lastName = nameParts[nameParts.length - 1];
      const normalizedLastName = normalizeString(lastName);
      if (!nameToIdMap[normalizedLastName]) {
        nameToIdMap[normalizedLastName] = id;
      }
    }
    
    // Add with/without prefixes like ד"ר
    if (name.includes('ד"ר') || name.includes('דר ') || name.includes('ד\'ר') || name.includes('דוקטור')) {
      const nameWithoutPrefix = name.replace(/^(ד"ר|דר |ד'ר|דוקטור)\s+/i, '');
      const normalizedNameWithoutPrefix = normalizeString(nameWithoutPrefix);
      nameToIdMap[normalizedNameWithoutPrefix] = id;
    }
  }
  
  return nameToIdMap;
};

// Normalize string for better matching
const normalizeString = (str: string): string => {
  return str.toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/["']/g, '') // Remove quotes
    .replace(/[״"]/g, ''); // Remove Hebrew quotes
};

// Helper to find staff ID by name with improved fuzzy matching
const findStaffIdByName = (
  name: string, 
  staffMap: Record<string, string>,
  nameToIdMap: Record<string, string>
): string => {
  if (!name) return '';
  
  // First clean the name - remove quotes, normalize spaces
  const cleanName = name.replace(/["'״"]/g, '').trim();
  
  // Normalize the name for consistent comparison
  const normalizedName = normalizeString(cleanName);
  
  // Handle common prefixes by trying both with and without prefixes
  const nameWithoutPrefix = normalizedName.replace(/^(ד"ר|דר |ד'ר|דוקטור)\s+/i, '');
  
  // 1. First, check exact match in the normalized name-to-id map
  if (nameToIdMap[normalizedName]) {
    return nameToIdMap[normalizedName];
  }
  
  // 2. Try without prefix 
  if (nameToIdMap[nameWithoutPrefix]) {
    return nameToIdMap[nameWithoutPrefix];
  }
  
  // 3. Check for exact match in the original staff map
  for (const [id, staffName] of Object.entries(staffMap)) {
    if (normalizeString(staffName) === normalizedName) {
      return id;
    }
    
    // Try matching without prefix
    if (normalizeString(staffName) === nameWithoutPrefix) {
      return id;
    }
  }
  
  // 4. Check if the provided name contains or is contained by any staff name
  for (const [id, staffName] of Object.entries(staffMap)) {
    const normalizedStaffName = normalizeString(staffName);
    if (normalizedStaffName.includes(nameWithoutPrefix) || 
        nameWithoutPrefix.includes(normalizedStaffName)) {
      return id;
    }
  }
  
  // 5. Try finding last name match (often doctors are referred to by last name)
  const nameParts = nameWithoutPrefix.split(' ');
  if (nameParts.length > 0) {
    const lastName = nameParts[nameParts.length - 1];
    if (lastName.length > 2) { // Only consider substantive last names
      for (const [id, staffName] of Object.entries(staffMap)) {
        const staffNameParts = normalizeString(staffName).split(' ');
        const staffLastName = staffNameParts[staffNameParts.length - 1];
        if (lastName === staffLastName) {
          return id;
        }
      }
    }
  }
  
  // 6. Last attempt: check if any part of the name matches
  for (const [id, staffName] of Object.entries(staffMap)) {
    const staffParts = normalizeString(staffName).split(' ');
    for (const part of nameParts) {
      if (part.length > 2 && staffParts.some(staffPart => 
        staffPart.includes(part) || part.includes(staffPart))) {
        return id;
      }
    }
  }
  
  // 7. Debug log to help identify missing matches
  console.error(`No staff match found for: "${name}" (normalized: "${normalizedName}", without prefix: "${nameWithoutPrefix}")`);
  console.error(`Available staff: ${JSON.stringify(staffMap)}`);
  
  return '';
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
