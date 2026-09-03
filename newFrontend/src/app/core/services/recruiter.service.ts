import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Recruiter } from '../models/recruitment.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RecruiterService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  private recruitersState = signal<Recruiter[]>([]);
  readonly recruiters = this.recruitersState.asReadonly();
  readonly isLoading = signal<boolean>(true);

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

  constructor() {
    this.loadScorecard().subscribe();
  }

  loadScorecard(): Observable<Recruiter[]> {
    this.isLoading.set(true);
    return this.http.get<{ success: boolean; data: any[] }>(`${this.apiUrl}/metrics/scorecard`).pipe(
      map(res => {
        if (!res.success || !res.data) return this.recruitersState();
        return res.data.map((item, idx) => this.mapApiItemToRecruiter(item, idx));
      }),
      tap(mapped => {
        this.recruitersState.set(mapped);
        this.isLoading.set(false);
      }),
      catchError(err => {
        console.warn('Scorecard API failed, using fallback state:', err);
        this.isLoading.set(false);
        return of(this.recruitersState());
      })
    );
  }

  private mapApiItemToRecruiter(item: any, idx: number): Recruiter {
    const overall = Math.round(item.weighted_total_score || 75);
    let status: 'Top Performer' | 'On Target' | 'Needs Improvement' = 'On Target';
    if (overall >= 80) status = 'Top Performer';
    else if (overall < 65) status = 'Needs Improvement';

    return {
      id: `REC-${idx + 1}`,
      name: item.recruiter_name || 'Recruiter',
      email: `${(item.recruiter_name || 'recruiter').toLowerCase().replace(/\s+/g, '.')}@vivrepanels.com`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.recruiter_name}`,
      department: 'Talent Acquisition',
      assignedPositions: item.total_assigned || 5,
      successfulHires: item.joined || 3,
      deadlineAchievementPct: Math.round(item.deadline_compliance_score || 85),
      candidateQualityScore: Math.round(item.quality_conversion_score || 75),
      processDisciplineScore: Math.round(item.process_discipline_sla_score || 90),
      overallScore: overall,
      activeCandidates: item.total_assigned || 10,
      avgDaysToHire: 22,
      retentionRate30Days: 95,
      status
    };
  }

  getRecruiters(): Observable<Recruiter[]> {
    return this.loadScorecard();
  }

  getRecruiterById(id: string): Recruiter | undefined {
    return this.recruitersState().find(r => r.id.toLowerCase() === id.toLowerCase());
  }
}
