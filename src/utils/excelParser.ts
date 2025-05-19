
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

        // Log staff members for debugging
        console.log('Available staff members:', Object.entries(staffMap).map(([id, name]) => ({ id, name })));

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

        // Create more specialized name-to-ID maps with variations for matching
        const nameVariations = createStaffNameVariations(staffMap);
        
        // First, show available columns in the Excel file for debugging
        if (jsonData.length > 0) {
          console.log('Available columns in Excel file:', Object.keys(jsonData[0]));
        }
        
        // Process each row in the Excel data
        jsonData.forEach((row: any, index: number) => {
          console.log(`Processing row ${index + 1}:`, row);
          
          // Try to find the provider/staff name from different possible columns
          let staffName = '';
          
          // First try resource columns which typically have the actual provider name
          for (const key of hebrewMappings.resourceName) {
            if (row[key]) {
              staffName = String(row[key]).trim();
              console.log(`Found staff name in resource column '${key}': "${staffName}"`);
              break;
            }
          }
          
          // If not found in resource columns, try other provider name columns
          if (!staffName) {
            for (const key of hebrewMappings.providerName) {
              if (row[key]) {
                staffName = String(row[key]).trim();
                console.log(`Found staff name in provider column '${key}': "${staffName}"`);
                break;
              }
            }
          }
          
          // Skip rows where provider/staff name is empty
          if (!staffName) {
            console.log('Skipping row with no provider/staff name:', row);
            return; // Skip this iteration
          }
          
          // Find staff ID from name using improved matching with variations
          const staffId = findStaffIdByNameEnhanced(staffName, staffMap, nameVariations);
          
          if (!staffId) {
            console.warn(`Could not find staff ID for name: ${staffName}`);
            return; // Skip this iteration
          } else {
            console.log(`Found staff ID for name "${staffName}": ${staffId} (${staffMap[staffId]})`);
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
              console.log(`Extracted clinic type from "${fullName}": ${clinicType}`);
            } else {
              console.log(`Could not extract clinic type from "${fullName}", using default: ${clinicType}`);
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
                statusLower.includes('ביטל') ||
                statusLower.includes('ביטול')) {
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
          
          console.log(`Successfully processed session: Staff=${staffMap[staffId]}, Clinic=${clinicType}, Type=${meetingType}`);
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

// Create multiple variations of staff names for better matching
const createStaffNameVariations = (staffMap: Record<string, string>): Record<string, string> => {
  const nameToIdMap: Record<string, string> = {};
  
  for (const [id, name] of Object.entries(staffMap)) {
    // Add variations for each staff name

    // Full name variations
    addNameVariation(nameToIdMap, name, id);
    
    // For doctors, add variations with and without title
    if (name.includes('Dr.') || name.includes('ד"ר') || name.includes('דר ') || name.includes('ד\'ר')) {
      // Without title
      const nameWithoutTitle = name
        .replace(/^(Dr\.|ד"ר|דר |ד'ר|דוקטור)\s+/i, '')
        .trim();
      addNameVariation(nameToIdMap, nameWithoutTitle, id);
      
      // English to Hebrew title conversion
      if (name.includes('Dr.')) {
        const hebrewName = name.replace(/Dr\.\s+/i, 'ד"ר ');
        addNameVariation(nameToIdMap, hebrewName, id);
      }
      
      // Hebrew to English title conversion
      if (name.includes('ד"ר') || name.includes('דר ') || name.includes('ד\'ר')) {
        const englishName = name.replace(/(ד"ר|דר |ד'ר|דוקטור)\s+/i, 'Dr. ');
        addNameVariation(nameToIdMap, englishName, id);
      }
    }
    
    // Name parts (first name, last name)
    const nameParts = name.replace(/^(Dr\.|ד"ר|דר |ד'ר|דוקטור)\s+/i, '').split(' ');
    
    // First name only
    if (nameParts.length > 0) {
      const firstName = nameParts[0];
      addNameVariation(nameToIdMap, firstName, id);
    }
    
    // Last name only
    if (nameParts.length > 1) {
      const lastName = nameParts[nameParts.length - 1];
      addNameVariation(nameToIdMap, lastName, id);
    }
  }
  
  console.log('Created staff name variations for matching:', nameToIdMap);
  return nameToIdMap;
};

// Helper to add normalized name variation
const addNameVariation = (map: Record<string, string>, name: string, id: string): void => {
  const normalized = normalizeString(name);
  if (normalized && normalized.length > 1) {
    map[normalized] = id;
  }
};

// Normalize string for better matching
const normalizeString = (str: string): string => {
  if (!str) return '';
  
  return str.toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/["']/g, '') // Remove quotes
    .replace(/[״"]/g, '') // Remove Hebrew quotes
    .replace(/['`]/g, '') // Remove apostrophes
    .replace(/[^\w\sא-ת]/g, ''); // Remove special chars but keep Hebrew letters
};

// Enhanced staff ID finder with multiple strategies
const findStaffIdByNameEnhanced = (
  name: string, 
  staffMap: Record<string, string>,
  nameVariations: Record<string, string>
): string => {
  if (!name) return '';
  
  console.log(`Trying to match staff name: "${name}"`);
  
  // First clean the name - remove quotes, normalize spaces
  const cleanName = name
    .replace(/["'״"]/g, '')
    .replace(/['`]/g, '')
    .trim();
    
  // Normalize the name for consistent comparison
  const normalizedName = normalizeString(cleanName);
  
  // Get name without prefix (Dr., etc)
  const nameWithoutPrefix = normalizedName.replace(/^(דר|ד"ר|דר |ד'ר|דוקטור|dr)\s+/i, '');
  
  console.log(`Normalized name: "${normalizedName}", without prefix: "${nameWithoutPrefix}"`);
  
  // 1. Direct match in variations map
  if (nameVariations[normalizedName]) {
    console.log(`Found direct match in variations for "${normalizedName}"`);
    return nameVariations[normalizedName];
  }
  
  // 2. Try without prefix in variations map
  if (nameVariations[nameWithoutPrefix]) {
    console.log(`Found match without prefix in variations for "${nameWithoutPrefix}"`);
    return nameVariations[nameWithoutPrefix];
  }
  
  // 3. Check for substring matches in variations
  for (const [variant, id] of Object.entries(nameVariations)) {
    // Skip very short variants
    if (variant.length < 3) continue;
    
    if (normalizedName.includes(variant) || variant.includes(normalizedName)) {
      console.log(`Found substring match between "${normalizedName}" and variant "${variant}"`);
      return id;
    }
    
    if (nameWithoutPrefix.includes(variant) || variant.includes(nameWithoutPrefix)) {
      console.log(`Found substring match between "${nameWithoutPrefix}" and variant "${variant}"`);
      return id;
    }
  }
  
  // 4. Try word-by-word matching
  const nameParts = nameWithoutPrefix.split(' ').filter(part => part.length > 1);
  if (nameParts.length > 0) {
    for (const [id, staffName] of Object.entries(staffMap)) {
      const staffNameNormalized = normalizeString(staffName);
      const staffParts = staffNameNormalized.split(' ').filter(part => part.length > 1);
      
      // Check if any substantial parts match
      for (const namePart of nameParts) {
        if (namePart.length < 3) continue; // Skip very short parts
        
        if (staffParts.some(staffPart => 
          staffPart.includes(namePart) || namePart.includes(staffPart))) {
          console.log(`Found word part match between "${namePart}" and staff "${staffName}"`);
          return id;
        }
      }
    }
  }
  
  // 5. Last attempt: check for transliteration differences in Hebrew/English names
  // This is a simplified approach - in practice you might need a more sophisticated transliteration algorithm
  for (const [id, staffName] of Object.entries(staffMap)) {
    const normalizedStaffName = normalizeString(staffName);
    
    // Remove vowels/spaces and compare core consonants for potential transliteration matches
    const staffConsonants = normalizedStaffName.replace(/[aeiouy\s]/g, '');
    const nameConsonants = normalizedName.replace(/[aeiouy\s]/g, '');
    
    if (staffConsonants.length > 3 && nameConsonants.length > 3) {
      // Check if consonant patterns are similar enough
      if (staffConsonants.includes(nameConsonants) || 
          nameConsonants.includes(staffConsonants)) {
        console.log(`Found possible transliteration match between "${name}" and "${staffName}"`);
        return id;
      }
    }
  }
  
  // Debug log if no match found
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
