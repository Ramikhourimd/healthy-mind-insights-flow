
import { describe, it, expect } from 'vitest';
import { getSessionCost } from '../utils/getSessionCost';
import { ClinicalSession, ClinicalStaffRates, ClinicType, MeetingType, ShowStatus, ServiceType } from '../types/finance';

describe('getSessionCost', () => {
  const mockStaffRates: ClinicalStaffRates = {
    id: 'test-rate-id',
    staffId: 'test-staff-id',
    adult_intake_rate: 600,
    adult_follow_up_rate: 450,
    adult_no_show_intake_rate: 300,
    adult_no_show_follow_up_rate: 225,
    child_intake_rate: 600,
    child_follow_up_rate: 450,
    child_no_show_intake_rate: 300,
    child_no_show_follow_up_rate: 225,
    availability_retainer_rate: 150,
    admin_rate: 250,
    training_rate: 250,
    effective_date: '2024-01-01',
  };

  const createMockSession = (
    meetingType: MeetingType,
    showStatus: ShowStatus,
    count: number = 1,
    serviceAgeGroup: ServiceType = "Adult"
  ): ClinicalSession => ({
    id: 'test-session-id',
    staffId: 'test-staff-id',
    clinicType: 'MCB' as ClinicType,
    meetingType,
    showStatus,
    serviceAgeGroup,
    count,
    duration: 60,
    month: 4,
    year: 2025,
  });

  it('should calculate cost for adult intake session with show status', () => {
    const session = createMockSession('Intake', 'Show', 2, 'Adult');
    const cost = getSessionCost(session, mockStaffRates);
    expect(cost).toBe(1200); // 600 * 2
  });

  it('should calculate cost for child intake session with show status', () => {
    const session = createMockSession('Intake', 'Show', 2, 'Child');
    const cost = getSessionCost(session, mockStaffRates);
    expect(cost).toBe(1200); // 600 * 2
  });

  it('should calculate cost for adult follow-up session with show status', () => {
    const session = createMockSession('FollowUp', 'Show', 3, 'Adult');
    const cost = getSessionCost(session, mockStaffRates);
    expect(cost).toBe(1350); // 450 * 3
  });

  it('should calculate cost for child follow-up session with show status', () => {
    const session = createMockSession('FollowUp', 'Show', 3, 'Child');
    const cost = getSessionCost(session, mockStaffRates);
    expect(cost).toBe(1350); // 450 * 3
  });

  it('should calculate cost for adult intake session with no-show status', () => {
    const session = createMockSession('Intake', 'NoShow', 1, 'Adult');
    const cost = getSessionCost(session, mockStaffRates);
    expect(cost).toBe(300); // 300 * 1
  });

  it('should calculate cost for child intake session with no-show status', () => {
    const session = createMockSession('Intake', 'NoShow', 1, 'Child');
    const cost = getSessionCost(session, mockStaffRates);
    expect(cost).toBe(300); // 300 * 1
  });

  it('should calculate cost for adult follow-up session with no-show status', () => {
    const session = createMockSession('FollowUp', 'NoShow', 2, 'Adult');
    const cost = getSessionCost(session, mockStaffRates);
    expect(cost).toBe(450); // 225 * 2
  });

  it('should calculate cost for child follow-up session with no-show status', () => {
    const session = createMockSession('FollowUp', 'NoShow', 2, 'Child');
    const cost = getSessionCost(session, mockStaffRates);
    expect(cost).toBe(450); // 225 * 2
  });

  it('should return 0 when staff rates are missing', () => {
    const session = createMockSession('Intake', 'Show', 1);
    const cost = getSessionCost(session, null);
    expect(cost).toBe(0);
  });

  it('should return 0 when session count is 0 or negative', () => {
    const session = createMockSession('Intake', 'Show', 0);
    const cost = getSessionCost(session, mockStaffRates);
    expect(cost).toBe(0);
  });

  it('should default to Adult service when serviceAgeGroup is not specified', () => {
    const session = {
      ...createMockSession('Intake', 'Show', 1),
      serviceAgeGroup: undefined as any
    };
    const cost = getSessionCost(session, mockStaffRates);
    expect(cost).toBe(600); // Should use adult_intake_rate
  });
});
