
// This is a debugging helper to extract and display the addClinicalSession function from FinanceContext.tsx
// We'll delete this file when done debugging

import { useEffect } from "react";
import { useFinance } from "./FinanceContext";

export const FinanceContextDebugger = () => {
  const { addClinicalSession, clinicalSessions } = useFinance();
  
  useEffect(() => {
    console.log("FinanceContext addClinicalSession check:");
    // Check if addClinicalSession is a function
    console.log("Is addClinicalSession a function?", typeof addClinicalSession === 'function');
    
    // Log current sessions
    console.log("Current clinical sessions:", clinicalSessions);
    
    // Test adding a session
    const testSession = {
      staffId: "test-staff-id",
      clinicType: "MCB",
      meetingType: "Intake",
      showStatus: "Show",
      count: 1,
      duration: 30,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear()
    };
    
    console.log("Will try to add test session:", testSession);
    // Uncomment the next line to actually test the function
    // addClinicalSession(testSession);
  }, []);
  
  return null;
};
