import { Injectable, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Candidate, PipelineStage, InterviewScorecard, CandidateTimelineEvent } from '../models/recruitment.model';
import candidatesMock from '../../../assets/mock/candidates.json';

@Injectable({
  providedIn: 'root'
})
export class CandidateService {
  private candidatesState = signal<Candidate[]>(candidatesMock as Candidate[]);

  readonly candidates = this.candidatesState.asReadonly();

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
      }
    }
    return map;
  });

  getCandidates(): Observable<Candidate[]> {
    return of(this.candidatesState());
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
      recruiter: 'Rahul Sharma',
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
