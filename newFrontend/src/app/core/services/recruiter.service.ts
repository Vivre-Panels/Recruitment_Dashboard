import { Injectable, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Recruiter } from '../models/recruitment.model';
import recruitersMock from '../../../assets/mock/recruiters.json';

@Injectable({
  providedIn: 'root'
})
export class RecruiterService {
  private recruitersState = signal<Recruiter[]>(recruitersMock as Recruiter[]);

  readonly recruiters = this.recruitersState.asReadonly();

  readonly totalRecruiters = computed(() => this.recruitersState().length);

  readonly topPerformers = computed(() => 
    this.recruitersState().filter(r => r.status === 'Top Performer')
  );

  readonly avgOverallScore = computed(() => {
    const list = this.recruitersState();
    if (!list.length) return 0;
    const sum = list.reduce((acc, r) => acc + r.overallScore, 0);
    return Math.round((sum / list.length) * 10) / 10;
  });

  // 4-Factor Weighted Model:
  // Successful Hires: 50%
  // Deadline Achievement: 20%
  // Candidate Quality: 20%
  // Process Discipline: 10%
  readonly scoreWeights = {
    successfulHires: 50,
    deadlineAchievement: 20,
    candidateQuality: 20,
    processDiscipline: 10
  };

  getRecruiters(): Observable<Recruiter[]> {
    return of(this.recruitersState());
  }

  getRecruiterById(id: string): Recruiter | undefined {
    return this.recruitersState().find(r => r.id.toLowerCase() === id.toLowerCase());
  }
}
