
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ClinicalSession, ClinicType, MeetingType, ShowStatus, ServiceType } from "@/types/finance";

const FinanceContext = createContext(null);

export const FinanceProvider = ({ children }) => {
  const [clinicalSessions, setClinicalSessions] = useState<ClinicalSession[]>([]);

  // Fetch clinical sessions data from Supabase
  const fetchClinicalSessions = async (): Promise<ClinicalSession[]> => {
    try {
      const { data, error } = await supabase
        .from('clinical_sessions')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (error) {
        console.error('Error fetching clinical sessions:', error);
        throw error;
      }

      console.log('Fetched clinical sessions from Supabase:', data);

      // Transform database rows to match our TypeScript interface
      const transformedSessions: ClinicalSession[] = data.map(row => ({
        id: row.id,
        staffId: row.staff_id,
        clinicType: row.clinic_type as ClinicType,
        meetingType: row.meeting_type as MeetingType,
        showStatus: row.show_status as ShowStatus,
        serviceAgeGroup: (row.service_age_group || 'Adult') as ServiceType,
        count: row.count,
        duration: row.duration,
        month: row.month,
        year: row.year,
      }));

      return transformedSessions;
    } catch (error) {
      console.error('Failed to fetch clinical sessions:', error);
      return [];
    }
  };

  // Update financial summary (placeholder function)
  const updateFinancialSummary = () => {
    console.log('Financial summary update triggered');
    // This is a placeholder - actual implementation would calculate financial metrics
  };

  // Add a new clinical session
  const addClinicalSession = async (sessionData: Omit<ClinicalSession, "id">) => {
    try {
      console.log('Adding clinical session:', sessionData);
      
      const { data, error } = await supabase
        .from('clinical_sessions')
        .insert([{
          staff_id: sessionData.staffId,
          clinic_type: sessionData.clinicType,
          meeting_type: sessionData.meetingType,
          show_status: sessionData.showStatus,
          service_age_group: sessionData.serviceAgeGroup || 'Adult',
          count: sessionData.count,
          duration: sessionData.duration,
          month: sessionData.month,
          year: sessionData.year,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding clinical session:', error);
        throw error;
      }

      console.log('Successfully added clinical session:', data);

      // Transform the returned data to match our interface
      const newSession: ClinicalSession = {
        id: data.id,
        staffId: data.staff_id,
        clinicType: data.clinic_type as ClinicType,
        meetingType: data.meeting_type as MeetingType,
        showStatus: data.show_status as ShowStatus,
        serviceAgeGroup: (data.service_age_group || 'Adult') as ServiceType,
        count: data.count,
        duration: data.duration,
        month: data.month,
        year: data.year,
      };

      // Update local state
      setClinicalSessions(prev => [...prev, newSession]);
      
      // Trigger financial summary update
      setTimeout(() => {
        updateFinancialSummary();
      }, 100);

      return newSession;
    } catch (error) {
      console.error('Failed to add clinical session:', error);
      throw error;
    }
  };

  // Bulk import multiple clinical sessions
  const importClinicalSessions = async (sessionsData: Omit<ClinicalSession, "id">[]) => {
    try {
      console.log('Importing clinical sessions:', sessionsData);
      
      const transformedData = sessionsData.map(session => ({
        staff_id: session.staffId,
        clinic_type: session.clinicType,
        meeting_type: session.meetingType,
        show_status: session.showStatus,
        service_age_group: session.serviceAgeGroup || 'Adult',
        count: session.count,
        duration: session.duration,
        month: session.month,
        year: session.year,
      }));

      const { data, error } = await supabase
        .from('clinical_sessions')
        .insert(transformedData)
        .select();

      if (error) {
        console.error('Error importing clinical sessions:', error);
        throw error;
      }

      console.log('Successfully imported clinical sessions:', data);

      // Transform the returned data to match our interface
      const newSessions: ClinicalSession[] = data.map(row => ({
        id: row.id,
        staffId: row.staff_id,
        clinicType: row.clinic_type as ClinicType,
        meetingType: row.meeting_type as MeetingType,
        showStatus: row.show_status as ShowStatus,
        serviceAgeGroup: (row.service_age_group || 'Adult') as ServiceType,
        count: row.count,
        duration: row.duration,
        month: row.month,
        year: row.year,
      }));

      // Update local state
      setClinicalSessions(prev => [...prev, ...newSessions]);
      
      // Trigger financial summary update
      setTimeout(() => {
        updateFinancialSummary();
      }, 100);

      return newSessions;
    } catch (error) {
      console.error('Failed to import clinical sessions:', error);
      throw error;
    }
  };

  return (
    <FinanceContext.Provider value={{ 
      clinicalSessions, 
      fetchClinicalSessions, 
      addClinicalSession, 
      importClinicalSessions,
      updateFinancialSummary
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  return useContext(FinanceContext);
};
