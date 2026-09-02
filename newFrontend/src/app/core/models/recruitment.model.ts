export type PriorityLevel = 'P0' | 'P1' | 'P2';
export type HealthStatus = 'On Track' | 'At Risk' | 'Critical';
export type SlaStatus = 'Within SLA' | 'At Risk' | 'Breached';
export type PipelineStage = 
  | 'Sourced'
  | 'Screening'
  | 'Interview'
  | 'Selected'
  | 'Offered'
  | 'Accepted'
  | 'Joined'
  | 'Successful';

export interface BottleneckInfo {
  stage: PipelineStage | string;
  issue: string;
  pendingWith: string;
  pendingSinceDays: number;
  slaStatus: SlaStatus;
  remark?: string;
  actionTaken?: string;
}

export interface FunnelMetric {
  stage: PipelineStage;
  count: number;
  conversionRate: number;
  dropOffRate: number;
  avgDaysInStage: number;
}

export interface Position {
  id: string;
  title: string;
  department: string;
  requiredHc: number;
  joinedHc: number;
  priority: PriorityLevel;
  owner: string; // Recruiter Name
  recruiterId: string;
  hiringManager: string;
  targetDate: string;
  createdAt: string;
  salaryRange: string;
  location: string;
  experienceRange: string;
  status: HealthStatus;
  mustHaveSkills: string[];
  knockoutCriteria: string[];
  description?: string;
  funnelCounts: {
    sourced: number;
    screened: number;
    interviewed: number;
    selected: number;
    offered: number;
    accepted: number;
    joined: number;
  };
  bottleneck?: BottleneckInfo;
  activeCandidatesCount: number;
}

export interface InterviewScorecard {
  interviewer: string;
  date: string;
  round: string;
  rating: number; // 1 - 5
  recommendation: 'Strong Hire' | 'Hire' | 'Hold' | 'Reject';
  notes: string;
  technicalSkillsScore: number;
  cultureFitScore: number;
  communicationScore: number;
}

export interface CandidateTimelineEvent {
  id: string;
  stage: string;
  date: string;
  actor: string;
  title: string;
  description: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  positionId: string;
  positionTitle: string;
  department: string;
  currentStage: PipelineStage;
  recruiter: string;
  experienceYears: number;
  currentCompany: string;
  currentDesignation: string;
  noticePeriodDays: number;
  expectedSalary: string;
  currentSalary: string;
  location: string;
  qualityScore: number; // e.g. 88 (out of 100)
  status: 'Active' | 'Offer Sent' | 'Joined' | 'Rejected' | 'Withdrawn';
  skills: string[];
  timeline: CandidateTimelineEvent[];
  interviews: InterviewScorecard[];
  notes: Array<{ author: string; date: string; content: string }>;
  resumeUrl?: string;
  matchScore: number; // % match with job requirements
}

export interface Recruiter {
  id: string;
  name: string;
  email: string;
  avatar: string;
  department: string;
  assignedPositions: number;
  successfulHires: number;
  deadlineAchievementPct: number;
  candidateQualityScore: number;
  processDisciplineScore: number;
  overallScore: number;
  activeCandidates: number;
  avgDaysToHire: number;
  retentionRate30Days: number;
  status: 'Top Performer' | 'On Target' | 'Needs Improvement';
}

export interface SlaRecord {
  id: string;
  positionId: string;
  positionTitle: string;
  candidateId?: string;
  candidateName?: string;
  stage: string;
  pendingWith: string;
  role: 'Hiring Manager' | 'Recruiter' | 'Management' | 'Candidate';
  elapsedHours: number;
  targetHours: number;
  status: SlaStatus;
  escalationLevel: 'None' | 'Level 1' | 'Level 2' | 'Critical';
  lastUpdated: string;
}

export interface HireQualityMetric {
  department: string;
  totalJoined: number;
  retention7DaysPct: number;
  retention30DaysPct: number;
  failure30DaysPct: number;
  replacementRatePct: number;
  successfulHireIndexPct: number;
  avgOnboardingFeedback: number;
}

export interface ReviewActionItem {
  id: string;
  issue: string;
  positionId?: string;
  positionTitle: string;
  decision: string;
  owner: string;
  dueDate: string;
  priority: PriorityLevel;
  status: 'Pending' | 'In Progress' | 'Resolved';
  createdAt: string;
}

export interface WeeklyReviewSummary {
  weekNumber: string;
  startDate: string;
  endDate: string;
  plannedClosures: number;
  actualClosures: number;
  redP0PositionsCount: number;
  openBottlenecksCount: number;
  closureRatePct: number;
  slaBreachCount: number;
  keyHighlights: string[];
  criticalRisks: Array<{
    positionTitle: string;
    department: string;
    issue: string;
    owner: string;
    daysPending: number;
  }>;
}

export interface PerformanceEvaluation {
  recruiterId: string;
  recruiterName: string;
  resultsScore: number; // /100
  qualityScore: number; // /100
  deadlinesScore: number; // /100
  ownershipScore: number; // /100
  overallPerformanceScore: number;
  strengths: string[];
  improvements: string[];
}

export interface BehaviourEvaluation {
  recruiterId: string;
  recruiterName: string;
  reliabilityScore: number; // 1-5
  transparencyScore: number; // 1-5
  initiativeScore: number; // 1-5
  teamBehaviourScore: number; // 1-5
  disciplineScore: number; // 1-5
  responsivenessScore: number; // 1-5
  processAdherenceScore: number; // 1-5
  overallBehaviourScore: number; // %
  managerNotes: string;
}

export interface SystemSettings {
  companyName: string;
  timezone: string;
  defaultCurrency: string;
  retentionBenchmarkDays: number;
  p0TargetDays: number;
  p1TargetDays: number;
  p2TargetDays: number;
  slaRules: Array<{
    stage: string;
    targetHours: number;
    warningHours: number;
    escalateTo: string;
  }>;
  pipelineStages: Array<{
    name: PipelineStage;
    description: string;
    isMandatory: boolean;
    order: number;
  }>;
}
