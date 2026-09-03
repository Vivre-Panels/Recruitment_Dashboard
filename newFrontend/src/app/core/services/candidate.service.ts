import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
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
        console.warn('Backend candidates API connection failed, using fallback:', err);
        this.isLoading.set(false);
        return of(this.candidatesState());
      })
    );
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

    if (found.length === 0) {
      if (postingTitle) found.push(postingTitle);
      else found.push('Verified Candidate');
    }
    return Array.from(new Set(found));
  }

  private mapApiAppToCandidate(app: any): Candidate {
    let stage: PipelineStage = 'Sourced';
    const statusLower = (app.Application_Status || '').toLowerCase();
    
    if (statusLower.includes('joined')) stage = 'Joined';
    else if (statusLower.includes('offer')) stage = 'Offered';
    else if (statusLower.includes('approved') || statusLower.includes('select')) stage = 'Selected';
    else if (statusLower.includes('interview') || app.Manager_Round_Schedule_DateTime) stage = 'Interview';
    else if (app.Tellecalling_Status || app.TelleCalling_Time) stage = 'Screening';

    const cvScoreNum = app.CV_Score ? parseFloat(app.CV_Score) : (app.Call_Audit_Score ? parseFloat(app.Call_Audit_Score) : 70);
    const feedback = app.Tellecalling_Feedback || '';
    const summary = app.Profile_Summary || '';

    const expYears = this.parseExperience(feedback, summary);
    const currentSal = this.parseSalary(feedback, 'current');
    const expectedSal = this.parseSalary(feedback, 'expected');
    const noticeDays = this.parseNoticePeriod(feedback);
    const skillList = this.extractSkills(summary, feedback, app.Posting_Title);

    return {
      id: app.Application_ID || `CAN-${app.id}`,
      name: app.Candidate_Name || 'Applicant',
      email: `${(app.Candidate_Name || 'candidate').toLowerCase().replace(/[^a-z0-9]/g, '.')}@vivrepanels.com`,
      phone: app.Mobile || '',
      positionId: app.Job_Opening_ID || 'POS-101',
      positionTitle: app.Posting_Title || 'Role Title',
      department: app.Department || 'Operations',
      currentStage: stage,
      recruiter: app.Recruiter_Name || 'Recruiter',
      experienceYears: expYears,
      currentCompany: app.Source || 'Direct Sourced',
      currentDesignation: app.Posting_Title || 'Candidate',
      noticePeriodDays: noticeDays,
      expectedSalary: expectedSal,
      currentSalary: currentSal,
      location: app.Location || 'Kolkata, IN',
      qualityScore: cvScoreNum,
      status: stage === 'Joined' ? 'Joined' : (statusLower.includes('reject') ? 'Rejected' : 'Active'),
      skills: skillList,
      timeline: [
        {
          id: `TL-${app.id}`,
          stage: stage,
          date: (app.Application_Created_Time || '').split('T')[0] || new Date().toISOString().split('T')[0],
          actor: app.Recruiter_Name || 'System',
          title: `Status: ${app.Application_Status || 'Active'}`,
          description: app.Tellecalling_Feedback || app.Profile_Summary || 'Application tracked in pipeline',
          type: 'info'
        }
      ],
      interviews: [],
      notes: app.Tellecalling_Feedback ? [{ author: app.Recruiter_Name || 'Recruiter', date: new Date().toISOString().split('T')[0], content: app.Tellecalling_Feedback }] : [],
      resumeUrl: app.CV_Link,
      matchScore: Math.round(cvScoreNum)
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

  assignTalentToPosition(talent: { name: string; email: string; phone: string; skills: string[]; experienceYears: number; location: string }, positionId: string, positionTitle: string, department: string): Candidate {
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
      experienceYears: talent.experienceYears,
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
