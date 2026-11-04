import { Candidate } from '../models/recruitment.model';

export type DelayAssessmentStatus = 'delayed' | 'within_sla' | 'not_assessable' | 'candidate_specific';

export interface ApplicationDelayAssessment {
  key: string;
  label: string;
  timestamp?: string;
  slaLabel: string;
  status: DelayAssessmentStatus;
  elapsedMs?: number;
  overByMs?: number;
  reportedDelay?: string;
  startAt?: string;
  endAt?: string;
  isOpenInterval?: boolean;
  observedAt?: number;
  basis: string;
  remarks?: string;
  dropOffReason?: string;
  delayReason?: string;
}

interface StageRule {
  key: string;
  label: string;
  timestamp?: string;
  slaDays?: number;
  slaLabel: string;
  startAt?: string;
  endAt?: string;
  recordedDelayFlag?: string;
  basis: string;
  remarks?: string;
  dropOffReason?: string;
  delayReason?: string;
  candidateSpecific?: boolean;
  pendingWhenCurrentStage?: Candidate['currentStage'];
  pendingStatus?: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Strictly parse the database timestamp formats used by Zoho and SQL Server. */
export function parseApplicationTimestamp(value?: string): number | undefined {
  const raw = value?.trim();
  if (!raw) return undefined;

  // ISO timestamps and standard SQL datetime strings; reject ambiguous locale dates.
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(\.\d{1,7})?)?(Z|[+-]\d{2}:\d{2})?)?$/);
  if (iso) {
    const [, year, month, day, hour = '00', minute = '00', second = '00'] = iso;
    const calendar = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    if (calendar.getUTCFullYear() !== Number(year) || calendar.getUTCMonth() !== Number(month) - 1 || calendar.getUTCDate() !== Number(day)) return undefined;
    if (Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59) return undefined;
    if (!iso[4]) return new Date(Number(year), Number(month) - 1, Number(day)).getTime();
    const parsed = new Date(raw).getTime();
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  // Zoho text timestamps such as 25-May-2026 18:39:00.
  const zoho = raw.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})(?:[ T](\d{1,2}:\d{2}(?::\d{2})(?:\.\d{1,7})?))?$/);
  if (zoho) {
    const time = (zoho[4] || '00:00:00').match(/^(\d{1,2}):(\d{2}):(\d{2})(?:\.(\d{1,7}))?$/)!;
    if (Number(time[1]) > 23 || Number(time[2]) > 59 || Number(time[3]) > 59) return undefined;
    const parsedDate = new Date(`${zoho[2]} ${zoho[1]}, ${zoho[3]} ${zoho[4] || '00:00:00'}`);
    const expectedMonth = new Date(`${zoho[2]} 1, 2000`).getMonth();
    if (parsedDate.getFullYear() !== Number(zoho[3]) || parsedDate.getMonth() !== expectedMonth || parsedDate.getDate() !== Number(zoho[1])) return undefined;
    const parsed = parsedDate.getTime();
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function classifyRecordedDelayFlag(value?: string): 'delayed' | 'within_sla' | undefined {
  const normalized = value?.trim().toLowerCase().replace(/[\s_-]+/g, ' ');
  if (!normalized) return undefined;
  if (['yes', 'true', 'delayed', 'late', 'breached', 'breach', '1'].includes(normalized)) return 'delayed';
  if (['no', 'false', 'no delay', 'on time', 'within sla', 'within limit', 'not delayed', 'not late', 'not breached', 'on track', '0'].includes(normalized)) return 'within_sla';
  if (/^\d+(?:\.\d+)?$/.test(normalized)) return Number(normalized) > 0 ? 'delayed' : 'within_sla';
  if (/\d+(?:\.\d+)?\s*(?:d|day|days|h|hr|hrs|hour|hours|min|mins|minute|minutes)\b/.test(normalized)) return 'delayed';
  return undefined;
}

function getRecordedDelayText(value?: string): string | undefined {
  const normalized = value?.trim();
  if (!normalized) return undefined;
  return /\d/.test(normalized) ? normalized : undefined;
}

function isExplicitlyPending(value?: string): boolean {
  const normalized = value?.trim().toLowerCase().replace(/[\s_-]+/g, ' ');
  return !!normalized && ['scheduled', 'pending', 'in progress', 'awaiting', 'not started', 'follow up', 'followup'].some(token => normalized.includes(token));
}

/**
 * Computes only evidence-backed stage intervals. Missing or invalid endpoints are
 * unassessable unless a recognized pending status identifies an open current stage;
 * only then is elapsed time measured to the supplied report snapshot.
 */
export function assessApplicationDelays(application: Candidate, asOf = Date.now()): ApplicationDelayAssessment[] {
  const telecallingScheduled = application.telecallingDateTime;
  const telecallingCompleted = application.telleCallingTime;
  const secondRoundStart = application.managerRoundScheduleDateTime;
  const secondRoundEnd = application.managerRoundCompletedTime;
  const stages: StageRule[] = [
    {
      key: 'requisition', label: 'Requisition Fulfillment', slaDays: 7, slaLabel: '7 days',
      timestamp: application.appointmentLetterDateTime,
      startAt: application.positionOpeningDate, endAt: application.appointmentLetterDateTime,
      basis: 'Requisition opening date → appointment letter timestamp',
      remarks: application.approvalRemarks, delayReason: application.delayReason
    },
    {
      key: 'telecalling', label: 'Telecalling', slaDays: 2, slaLabel: '2 days',
      timestamp: telecallingCompleted || telecallingScheduled,
      startAt: telecallingScheduled, endAt: telecallingCompleted,
      pendingWhenCurrentStage: 'Screening',
      pendingStatus: application.telecallingStatus,
      basis: 'Telecalling scheduled time → recorded telecalling time',
      remarks: application.telecallingFeedback, delayReason: application.delayReason
    },
    {
      key: 'first_round', label: 'First Round', slaDays: 5, slaLabel: '5 days',
      timestamp: application.firstRoundDateTime,
      basis: 'A stage-specific completion timestamp is not currently stored',
      remarks: application.firstRoundFeedback, dropOffReason: application.firstRoundDropOffReason,
      delayReason: application.delayReason
    },
    {
      key: 'second_round', label: 'Second Round', slaDays: 5, slaLabel: '5 days',
      timestamp: secondRoundEnd || application.secondRoundDateTime || secondRoundStart,
      startAt: secondRoundStart, endAt: secondRoundEnd, recordedDelayFlag: application.secondRoundDelayFlag,
      pendingWhenCurrentStage: 'Interview',
      pendingStatus: application.secondRoundStatus,
      basis: 'Manager round scheduled time → manager round completion time',
      remarks: application.managerRoundFeedback, dropOffReason: application.secondRoundDropOffReason,
      delayReason: application.secondRoundDelayReason
    },
    {
      key: 'director_round', label: 'Director Round', slaDays: 5, slaLabel: '5 days',
      timestamp: application.thirdRoundDateTime,
      recordedDelayFlag: application.thirdRoundDelayFlag,
      basis: 'A stage-specific completion timestamp is not currently stored',
      remarks: application.directorialRoundFeedback, dropOffReason: application.thirdRoundDropOffReason,
      delayReason: application.thirdRoundDelayReason
    },
    {
      key: 'salary_negotiation', label: 'Salary Negotiation', slaDays: 5, slaLabel: '5 days',
      timestamp: application.salaryNegotiationDateTime,
      recordedDelayFlag: application.salaryNegotiationDelayFlag,
      basis: 'A stage-specific completion timestamp is not currently stored',
      remarks: application.approvalRemarks, dropOffReason: application.salaryNegotiationDropOffReason,
      delayReason: application.salaryNegotiationDelayReason
    },
    {
      key: 'appointment_letter', label: 'Appointment Letter', slaDays: 1, slaLabel: '1 day',
      timestamp: application.appointmentLetterDateTime,
      startAt: application.qualifiedDateTime, endAt: application.appointmentLetterDateTime,
      recordedDelayFlag: application.offerLetterDelayFlag,
      basis: 'Qualified timestamp → appointment letter timestamp',
      remarks: application.approvalRemarks, delayReason: application.offerLetterDelayReason
    },
    {
      key: 'joining', label: 'Joining', slaDays: 90, slaLabel: '30–90 days · candidate-dependent',
      timestamp: application.joiningDateTime || application.dateOfJoining,
      startAt: application.appointmentLetterDateTime, endAt: application.joiningDateTime || application.dateOfJoining,
      basis: 'Appointment letter timestamp → joining date; only durations over 90 days are definite breaches',
      candidateSpecific: true, pendingWhenCurrentStage: 'Offered'
    }
  ];

  return stages.map(stage => {
    const explicitFlag = classifyRecordedDelayFlag(stage.recordedDelayFlag);
    const start = parseApplicationTimestamp(stage.startAt);
    const end = parseApplicationTimestamp(stage.endAt);
    const openStageConfirmed = stage.pendingWhenCurrentStage === 'Offered' ||
      (stage.pendingStatus !== undefined && isExplicitlyPending(stage.pendingStatus));
    const isOpenInterval = end === undefined && start !== undefined && application.status === 'Active' &&
      stage.pendingWhenCurrentStage !== undefined && application.currentStage === stage.pendingWhenCurrentStage &&
      openStageConfirmed;
    const effectiveEnd = isOpenInterval ? asOf : end;
    const measured = start !== undefined && effectiveEnd !== undefined && effectiveEnd >= start;
    const elapsedMs = measured ? effectiveEnd - start : undefined;
    const invalidOrder = start !== undefined && end !== undefined && end < start;
    const observedFields = { isOpenInterval, observedAt: isOpenInterval ? asOf : undefined };
    const basis = isOpenInterval ? `${stage.basis}; open interval measured as of current time` : stage.basis;

    if (stage.candidateSpecific && elapsedMs !== undefined) {
      const definitelyOverMaximum = elapsedMs > 90 * DAY_MS;
      if (explicitFlag === 'within_sla' && definitelyOverMaximum) {
        return { ...stage, ...observedFields, status: 'not_assessable', elapsedMs, basis: 'Zoho marks this within SLA, but the recorded interval exceeds the 90-day maximum' };
      }
      if (explicitFlag) {
        return {
          ...stage,
          ...observedFields,
          status: explicitFlag,
          elapsedMs,
          overByMs: explicitFlag === 'delayed' && definitelyOverMaximum ? elapsedMs - 90 * DAY_MS : undefined,
          reportedDelay: explicitFlag === 'delayed' ? getRecordedDelayText(stage.recordedDelayFlag) : undefined,
          basis: `${basis}; explicit Zoho delay flag`
        };
      }
      const status: DelayAssessmentStatus = definitelyOverMaximum ? 'delayed' : 'candidate_specific';
      return {
        ...stage, ...observedFields, status, elapsedMs, overByMs: status === 'delayed' ? elapsedMs - 90 * DAY_MS : undefined,
        basis: basis + '; no candidate-specific target date is available',
      };
    }

    if (explicitFlag) {
      if (elapsedMs !== undefined && stage.slaDays !== undefined) {
        const calculatedFlag = elapsedMs > stage.slaDays * DAY_MS ? 'delayed' : 'within_sla';
        if (calculatedFlag !== explicitFlag) {
          return { ...stage, ...observedFields, status: 'not_assessable', basis: 'Zoho delay flag conflicts with the recorded timestamp calculation' };
        }
      }
      const limitMs = stage.slaDays ? stage.slaDays * DAY_MS : undefined;
      return {
        ...stage,
        ...observedFields,
        status: explicitFlag,
        elapsedMs,
        overByMs: explicitFlag === 'delayed' && elapsedMs !== undefined && limitMs !== undefined ? elapsedMs - limitMs : undefined,
        reportedDelay: explicitFlag === 'delayed' ? getRecordedDelayText(stage.recordedDelayFlag) : undefined,
        basis: elapsedMs === undefined ? `${basis}; explicit Zoho delay flag` : `${basis}; explicit Zoho delay flag agrees with timestamps`
      };
    }

    if (elapsedMs !== undefined && stage.slaDays !== undefined) {
      const limitMs = stage.slaDays * DAY_MS;
      const status: DelayAssessmentStatus = elapsedMs > limitMs ? 'delayed' : 'within_sla';
      return { ...stage, ...observedFields, status, elapsedMs, overByMs: status === 'delayed' ? elapsedMs - limitMs : 0, basis };
    }

    return {
      ...stage,
      ...observedFields,
      status: 'not_assessable' as const,
      basis: invalidOrder ? 'Recorded end timestamp is earlier than the start timestamp' : basis,
    };
  });
}

export function formatElapsed(milliseconds?: number): string {
  if (milliseconds === undefined || !Number.isFinite(milliseconds) || milliseconds < 0) return '—';
  const totalMinutes = Math.floor(milliseconds / 60000);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  if (days) return `${days}d ${hours}h`;
  if (hours) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
