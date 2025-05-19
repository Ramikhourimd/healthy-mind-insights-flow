
import * as XLSX from 'xlsx';
import { ClinicalSession, ClinicType, MeetingType, ShowStatus } from '@/types/finance';

// This function extracts clinical sessions from an Excel file
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
        
        jsonData.forEach((row: any) => {
          // Try to extract staff name or ID (might be in different columns)
          const staffName = row.Staff || row.Provider || row.Doctor || row.Name || '';
          // Try to find staff ID from name
          const staffId = findStaffIdByName(staffName, staffMap);
          
          // Try to extract clinic type
          const rawClinicType = row.Clinic || row.ClinicType || row.Location || '';
          const clinicType = mapClinicType(rawClinicType);
          
          // Try to extract meeting type
          const rawMeetingType = row.MeetingType || row.Type || row.AppointmentType || '';
          const meetingType = rawMeetingType?.toLowerCase().includes('intake') ? 'Intake' : 'FollowUp';
          
          // Try to extract show status
          const rawShowStatus = row.Status || row.ShowStatus || '';
          const showStatus = rawShowStatus?.toLowerCase().includes('no') ? 'NoShow' : 'Show';
          
          // Try to extract count
          const count = Number(row.Count || row.Sessions || 1);
          
          // Try to extract duration
          const duration = Number(row.Duration || row.Length || row.Time || 60);
          
          // Only add if we have a valid staff ID
          if (staffId) {
            sessions.push({
              staffId,
              clinicType: clinicType as ClinicType,
              meetingType: meetingType as MeetingType,
              showStatus: showStatus as ShowStatus,
              count: isNaN(count) ? 1 : count,
              duration: isNaN(duration) ? 60 : duration,
              month: currentMonth,
              year: currentYear
            });
          }
        });
        
        console.log('Mapped sessions:', sessions);
        resolve(sessions);
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
