
// This is a debugging helper to extract and display the addClinicalSession function from FinanceContext.tsx
// We'll delete this file when done debugging

import { useEffect } from "react";
import { useFinance } from "./FinanceContext";
import { ClinicType, MeetingType, ShowStatus } from "@/types/finance";

export const FinanceContextDebugger = () => {
  const { addClinicalSession, clinicalSessions, updateFinancialSummary } = useFinance();
  
  useEffect(() => {
    console.log("FinanceContext addClinicalSession check:");
    // Check if addClinicalSession is a function
    console.log("Is addClinicalSession a function?", typeof addClinicalSession === 'function');
    
    // Log current sessions
    console.log("Current clinical sessions:", clinicalSessions);
    
    // Test adding a session
    const testSession = {
      staffId: "test-staff-id",
      clinicType: "MCB" as ClinicType,
      meetingType: "Intake" as MeetingType,
      showStatus: "Show" as ShowStatus,
      count: 1,
      duration: 30,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear()
    };
    
    console.log("Will try to add test session:", testSession);
    // Actually test the function - uncomment to activate
    addClinicalSession(testSession);
    
    // Force summary update after adding sessions
    setTimeout(() => {
      console.log("Attempting to force financial summary update");
      updateFinancialSummary();
      console.log("After update attempt, sessions count:", clinicalSessions.length);
    }, 500);
  }, []);
  
  return null;
};
