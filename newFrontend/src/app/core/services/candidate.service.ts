import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap, catchError, concatMap } from 'rxjs/operators';
import { Candidate, PipelineStage, InterviewScorecard, CandidateTimelineEvent } from '../models/recruitment.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CandidateService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  private candidatesState = signal<Candidate[]>([]);
  readonly candidates = this.candidatesState.asReadonly();
  readonly isLoading = signal<boolean>(true);

  readonly totalCandidates = computed(() => this.candidatesState().length);

  readonly candidatesByStage = computed(() => {
    const map: Record<PipelineStage, Candidate[]> = {
      'Sourced': [],
      'Screening': [],
      'Interview': [],
      'Selected': [],
      'Offered': [],
      'Accepted': [],
      'Joined': [],
      'Successful': []
    };

    for (const c of this.candidatesState()) {
      if (map[c.currentStage]) {
        map[c.currentStage].push(c);
      } else {
        map['Screening'].push(c);
      }
    }
    return map;
  });

  constructor() {
    this.loadCandidates().subscribe();
  }

  loadCandidates(): Observable<Candidate[]> {
    if (this.candidatesState().length === 0) {
      this.isLoading.set(true);
    }
    return this.http.get<{ success: boolean; data: any[] }>(`${this.apiUrl}/applications`).pipe(
      map(res => {
        if (!res.success || !res.data) return this.candidatesState();
        return res.data.map(app => this.mapApiAppToCandidate(app));
      }),
      tap(mapped => {
        this.candidatesState.set(mapped);
        this.isLoading.set(false);
      }),
      catchError(err => {
        console.warn('Backend candidates API connection failed; displaying no records:', err);
        this.isLoading.set(false);
        return of(this.candidatesState());
      })
    );
  }

  loadAllApplicationsForReport(pageSize = 1000): Observable<{
    applications: Candidate[];
    databaseTotal: number;
    complete: boolean;
    duplicateRows: number;
    error?: string;
  }> {
    const fetchPage = (page: number, accumulated: Candidate[], databaseTotal: number): Observable<{
      applications: Candidate[];
      databaseTotal: number;
      complete: boolean;
      duplicateRows: number;
      error?: string;
    }> => this.http.get<{ success: boolean; data: any[]; total?: number }>(`${this.apiUrl}/applications?page=${page}&limit=${pageSize}`).pipe(
      concatMap(response => {
        const reportedTotal = Number(response.total);
        const total = Number.isFinite(reportedTotal) ? reportedTotal : databaseTotal;
        if (!response.success || !Array.isArray(response.data)) {
          return of({ applications: accumulated, databaseTotal: total, complete: false, duplicateRows: 0, error: 'The applications API returned an incomplete response.' });
        }

        const merged = accumulated.concat(response.data.map(app => this.mapApiAppToCandidate(app)));
        if (response.data.length === pageSize && page < 10000) return fetchPage(page + 1, merged, total);

        const unique = new Map<string, Candidate>();
        for (const application of merged) {
          const key = application.id.trim().toLowerCase();
          if (key && !unique.has(key)) unique.set(key, application);
        }
        const applications = Array.from(unique.values());
        const duplicateRows = merged.length - applications.length;
        const countConsistent = total === 0 ? applications.length === 0 : applications.length >= total;
        const complete = response.data.length < pageSize && countConsistent;
        return of({
          applications,
          databaseTotal: total,
          complete,
          duplicateRows,
          ...(!complete ? { error: 'The API row count did not match the database total; this report may be incomplete.' } : {})
        });
      }),
      catchError(() => of({
        applications: accumulated,
        databaseTotal,
        complete: false,
        duplicateRows: 0,
        error: `Could not load application page ${page}; report counts are incomplete.`
      }))
    );

    return fetchPage(1, [], 0);
  }

  private parseExperience(feedback: string, summary: string): number {
    const text = `${feedback || ''} ${summary || ''}`;
    if (!text.trim()) return 0;
    const match = text.match(/(\d+(?:\.\d+)?)\s*(?:years|year|yrs|yr)/i);
    if (match && match[1]) {
      const val = parseFloat(match[1]);
      if (val >= 0 && val <= 40) return Math.round(val);
    }
    return 0;
  }

  private parseSalary(feedback: string, type: 'current' | 'expected'): string {
    if (!feedback) return 'Not Specified';
    if (type === 'current') {
      const match = feedback.match(/Current CTC[:\s]*([^,\n\.\;]+)/i);
      if (match && match[1]) return match[1].trim();
    } else {
      const match = feedback.match(/Expected CTC[:\s]*([^,\n\.\;]+)/i);
      if (match && match[1]) return match[1].trim();
    }
    return 'Not Specified';
  }

  private parseNoticePeriod(feedback: string): number {
    if (!feedback) return 0;
    const match = feedback.match(/Notice Period[:\s]*(\d+)\s*days/i);
    if (match && match[1]) return parseInt(match[1], 10);
    const altMatch = feedback.match(/(\d+)\s*days/i);
    if (altMatch && altMatch[1]) return parseInt(altMatch[1], 10);
    return 0;
  }

  private extractSkills(summary: string, feedback: string, postingTitle: string): string[] {
    const text = `${summary || ''} ${feedback || ''}`;
    const found: string[] = [];
    
    // Extract keywords
    const keywords = ['React', 'Angular', 'Node', 'Java', 'Python', 'Go', 'SQL', 'Warehouse', 'Dispatch', 'Logistics', 'Operations', 'Sales', 'Marketing', 'Excel', 'Tally', 'HR', 'Recruitment', 'Finance', 'Audit'];
    for (const kw of keywords) {
      if (new RegExp(`\\b${kw}\\b`, 'i').test(text)) {
        found.push(kw);
      }
    }

    if (found.length === 0 && postingTitle && new RegExp(`\\b${postingTitle}\\b`, 'i').test(text)) found.push(postingTitle);
    return Array.from(new Set(found));
  }

  private mapApiAppToCandidate(app: any): Candidate {
    const statusLower = [
      app.Application_Status,
      app.Tellecalling_Status,
      app.First_Interview_Status,
      app.Final_Round_Review_Status,
      app.rd_Directorial_Round_Status,
      app.Background_Verification
    ].filter(Boolean).join(' ').toLowerCase();
    const isRejected = statusLower.includes('reject') || statusLower.includes('drop') || statusLower.includes('unsuitable') || statusLower.includes('not interested');

    let stage: PipelineStage = 'Sourced';
    if (statusLower.includes('joined')) stage = 'Joined';
    else if (statusLower.includes('offer')) stage = 'Offered';
    else if (statusLower.includes('approved') || statusLower.includes('select')) stage = 'Selected';
    else if (statusLower.includes('interview') || app.Manager_Round_Schedule_DateTime) stage = 'Interview';
    else if (app.Tellecalling_Status || app.TelleCalling_Time) stage = 'Screening';

    const cvScoreNum = app.CV_Score ? parseFloat(app.CV_Score) : (app.Call_Audit_Score ? parseFloat(app.Call_Audit_Score) : 0);
    const feedback = app.Tellecalling_Feedback || '';
    const summary = app.Profile_Summary || '';

    const expYears = this.parseExperience(feedback, summary);
    const currentSal = this.parseSalary(feedback, 'current');
    const expectedSal = this.parseSalary(feedback, 'expected');
    const noticeDays = this.parseNoticePeriod(feedback);
    const skillList = this.extractSkills(summary, feedback, app.Posting_Title);

    return {
      id: app.Application_ID || `CAN-${app.id}`,
      name: app.Candidate_Name || '',
      email: app.Email || app.email || '',
      phone: app.Mobile || '',
      positionId: app.Job_Opening_ID || '',
      positionTitle: app.Posting_Title || '',
      department: app.Department || app.department || '',
      team: app.Team || app.team || '',
      currentStage: stage,
      recruiter: app.Recruiter_Name || '',
      experienceYears: expYears,
      currentCompany: app.Source || '',
      currentDesignation: app.Current_Designation || '',
      noticePeriodDays: noticeDays,
      expectedSalary: expectedSal,
      currentSalary: currentSal,
      location: app.Location || '',
      qualityScore: cvScoreNum,
      status: isRejected ? 'Rejected' : (stage === 'Joined' ? 'Joined' : 'Active'),
      skills: skillList,
      timeline: [
        {
          id: `TL-${app.id}`,
          stage: stage,
          date: (app.Application_Created_Time || '').split('T')[0],
          actor: app.Recruiter_Name || '',
          title: `Status: ${app.Application_Status || app.Tellecalling_Status || ''}`,
          description: app.Tellecalling_Feedback || app.Profile_Summary || '',
          type: 'info'
        }
      ],
      interviews: [],
      notes: app.Tellecalling_Feedback ? [{ author: app.Recruiter_Name || 'Recruiter', date: new Date().toISOString().split('T')[0], content: app.Tellecalling_Feedback }] : [],
      resumeUrl: app.CV_Link,
      matchScore: Math.round(cvScoreNum),
      rawStatus: [
        app.Application_Status,
        app.Tellecalling_Status,
        app.First_Interview_Status,
        app.Final_Round_Review_Status,
        app.rd_Directorial_Round_Status,
        app.Background_Verification
      ].filter(Boolean).join(' ').trim(),
      applicationCreatedAt: app.Application_Created_Time || '',
      positionOpeningDate: app.Position_Opening_Date || '',
      telecallingFeedback: app.Tellecalling_Feedback || app.Interview_Feedback || '',
      approvalRemarks: app.Approval_Remarks || '',
      firstRoundFeedback: app.First_Round_Feedback || '',
      managerRoundFeedback: app.Manager_Round_Feedback || '',
      directorialRoundFeedback: app.Directorial_Round_Feedback || '',
      delayReason: app.Delay_Reason || '',
      secondRoundDelayReason: app.nd_Round_Delay_Reason || app.n_Round_Delay_Reason || '',
      thirdRoundDelayReason: app.rd_Round_Delay_Reason || '',
      salaryNegotiationDelayReason: app.Salary_Negotiation_Delay_Reason || '',
      offerLetterDelayReason: app.Offer_Letter_Delay_Reason || '',
      firstRoundDropOffReason: app.First_Round_Drop_Off_Reason || '',
      secondRoundDropOffReason: app.nd_Round_Drop_Off_Reason || '',
      thirdRoundDropOffReason: app.rd_Round_Drop_Off_Reason || '',
      salaryNegotiationDropOffReason: app.Salary_Negotiation_Drop_Off_Reason || '',
      secondRoundDelayFlag: app.n_Round_Delay || app.nd_Round_Delay || '',
      thirdRoundDelayFlag: app.rd_Round_Delay || '',
      salaryNegotiationDelayFlag: app.Salary_Negotiation_Delay || '',
      offerLetterDelayFlag: app.Offer_letter_Delay || app.Offer_Letter_Delay || '',
      telleCallingTime: app.TelleCalling_Time || app.telleCallingTime || '',
      telecallingDateTime: app.Telecalling_Date_Time || '',
      telecallingStatus: app.Tellecalling_Status || '',
      managerInterviewDateTime: app.Manager_Interview_DateTime || '',
      managerRoundScheduleDateTime: app.Manager_Round_Schedule_DateTime || '',
      managerRoundCompletedTime: app.Manager_Round_Completed_Time || '',
      salaryNegotiationDateTime: app.Salary_Negotiation_Date_Time || '',
      appointmentLetterDateTime: app.Appointment_Letter_Date_Time || '',
      joiningDateTime: app.Joining_Date_Time || '',
      dateOfJoining: app.Date_of_Joining || '',
      hiringDateTime: app.Hiring_Date_Time || '',
      qualifiedDateTime: app.Qualified_Date_Time || '',
      firstRoundDateTime: app.First_Round_Date_Time || '',
      secondRoundDateTime: app.Second_Round_Date_Time || '',
      thirdRoundDateTime: app.Third_Round_Date_Time || '',
      firstInterviewStatus: app.First_Interview_Status || '',
      secondRoundStatus: app.Final_Round_Review_Status || '',
      thirdRoundStatus: app.rd_Directorial_Round_Status || '',
      offerAcceptedDateTime: app.Offer_Accepted_DateTime || ''
    };
  }

  getCandidates(): Observable<Candidate[]> {
    return this.loadCandidates();
  }

  getCandidateById(id: string): Candidate | undefined {
    return this.candidatesState().find(c => c.id.toLowerCase() === id.toLowerCase());
  }

  getCandidatesByPositionId(positionId: string): Candidate[] {
    return this.candidatesState().filter(c => c.positionId.toLowerCase() === positionId.toLowerCase());
  }

  updateStage(candidateId: string, newStage: PipelineStage, remarks = 'Stage moved via pipeline control'): boolean {
    let updated = false;
    this.candidatesState.update(list =>
      list.map(c => {
        if (c.id === candidateId) {
          updated = true;
          const newEvent: CandidateTimelineEvent = {
            id: `TL-${Date.now()}`,
            stage: newStage,
            date: new Date().toISOString().split('T')[0],
            actor: 'Current User',
            title: `Stage updated to ${newStage}`,
            description: remarks,
            type: newStage === 'Joined' || newStage === 'Successful' ? 'success' : 'info'
          };
          return {
            ...c,
            currentStage: newStage,
            timeline: [newEvent, ...c.timeline]
          };
        }
        return c;
      })
    );
    return updated;
  }

  addNote(candidateId: string, author: string, content: string): void {
    this.candidatesState.update(list =>
      list.map(c => {
        if (c.id === candidateId) {
          return {
            ...c,
            notes: [
              {
                author,
                date: new Date().toISOString().split('T')[0],
                content
              },
              ...c.notes
            ]
          };
        }
        return c;
      })
    );
  }

  addInterviewScorecard(candidateId: string, scorecard: InterviewScorecard): void {
    this.candidatesState.update(list =>
      list.map(c => {
        if (c.id === candidateId) {
          const event: CandidateTimelineEvent = {
            id: `TL-${Date.now()}`,
            stage: 'Interview',
            date: scorecard.date || new Date().toISOString().split('T')[0],
            actor: scorecard.interviewer,
            title: `${scorecard.round} Scorecard Submitted`,
            description: `Rating: ${scorecard.rating}/5 (${scorecard.recommendation}) - ${scorecard.notes}`,
            type: scorecard.recommendation === 'Reject' ? 'error' : 'success'
          };
          return {
            ...c,
            interviews: [scorecard, ...c.interviews],
            timeline: [event, ...c.timeline]
          };
        }
        return c;
      })
    );
  }

  assignTalentToPosition(talent: { name: string; email: string; phone: string; skills: string[]; experienceYears: number | null; location: string }, positionId: string, positionTitle: string, department: string): Candidate {
    const newId = `CAN-${200 + this.candidatesState().length + 1}`;
    const newCandidate: Candidate = {
      id: newId,
      name: talent.name,
      email: talent.email,
      phone: talent.phone,
      positionId,
      positionTitle,
      department,
      currentStage: 'Sourced',
      recruiter: 'Priya Saha',
      experienceYears: talent.experienceYears ?? 0,
      currentCompany: 'Talent Bank Sourced',
      currentDesignation: 'Candidate',
      noticePeriodDays: 30,
      expectedSalary: '$140,000 / year',
      currentSalary: '$125,000 / year',
      location: talent.location,
      qualityScore: 90,
      status: 'Active',
      skills: talent.skills,
      timeline: [
        {
          id: `TL-${Date.now()}`,
          stage: 'Sourced',
          date: new Date().toISOString().split('T')[0],
          actor: 'Recruitment Team',
          title: `Assigned to ${positionTitle}`,
          description: 'Candidate assigned from internal Talent Bank.',
          type: 'info'
        }
      ],
      interviews: [],
      notes: [],
      matchScore: 92
    };

    this.candidatesState.update(list => [newCandidate, ...list]);
    return newCandidate;
  }
}
