
import { ClinicalSession, ClinicalStaffRates } from "../types/finance";

/**
 * Calculate the cost of a clinical session based on staff rates
 * @param session The clinical session data
 * @param staffRates The staff rates for the specific staff member
 * @returns The calculated cost for the session
 */
export const getSessionCost = (
  session: ClinicalSession,
  staffRates: ClinicalStaffRates | null | undefined
): number => {
  // If no rates found, return 0 and let the calling code handle the error
  if (!staffRates) {
    return 0;
  }

  // Ensure count is a valid number
  const sessionCount = Number(session.count) || 0;
  if (sessionCount <= 0) {
    return 0;
  }

  let rate = 0;

  // Select the appropriate rate based on meeting type and show status
  if (session.showStatus === "Show") {
    if (session.meetingType === "Intake") {
      rate = Number(staffRates.intakeSessionRate) || 0;
    } else if (session.meetingType === "FollowUp") {
      rate = Number(staffRates.followUpSessionRate) || 0;
    }
  } else if (session.showStatus === "NoShow") {
    if (session.meetingType === "Intake") {
      rate = Number(staffRates.noShowIntakeRate) || 0;
    } else if (session.meetingType === "FollowUp") {
      rate = Number(staffRates.noShowFollowUpRate) || 0;
    }
  }

  return rate * sessionCount;
};
