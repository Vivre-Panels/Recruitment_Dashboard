import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { PerformanceEvaluation, BehaviourEvaluation } from '../models/recruitment.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  private performanceState = signal<PerformanceEvaluation[]>([]);
  private behaviourState = signal<BehaviourEvaluation[]>([]);

  readonly performanceEvaluations = this.performanceState.asReadonly();
  readonly behaviourEvaluations = this.behaviourState.asReadonly();

  constructor() {
    this.loadScorecardData().subscribe();
  }

  loadScorecardData(): Observable<any> {
    return this.http.get<{ success: boolean; data: any[] }>(`${this.apiUrl}/metrics/scorecard`).pipe(
      tap(res => {
        if (res.success && res.data) {
          const perfList: PerformanceEvaluation[] = res.data.map((item, idx) => ({
            recruiterId: `REC-${idx + 1}`,
            recruiterName: item.recruiter_name,
            resultsScore: Math.round(item.hires_vs_target_score || 80),
            qualityScore: Math.round(item.quality_conversion_score || 75),
            deadlinesScore: Math.round(item.deadline_compliance_score || 85),
            ownershipScore: Math.round(item.process_discipline_sla_score || 90),
            overallPerformanceScore: Math.round(item.weighted_total_score || 82),
            strengths: ['High Hire Rate', 'Prompt SLA Compliance'],
            improvements: ['SLA Turnaround Time']
          }));

          const behavList: BehaviourEvaluation[] = res.data.map((item, idx) => ({
            recruiterId: `REC-${idx + 1}`,
            recruiterName: item.recruiter_name,
            reliabilityScore: 4.5,
            transparencyScore: 4.8,
            initiativeScore: 4.2,
            teamBehaviourScore: 4.6,
            disciplineScore: 4.7,
            responsivenessScore: 4.5,
            processAdherenceScore: 4.8,
            overallBehaviourScore: 92,
            managerNotes: 'Consistently demonstrates strong teamwork, proactive initiative, and transparency.'
          }));

          this.performanceState.set(perfList);
          this.behaviourState.set(behavList);
        }
      }),
      catchError(err => {
        console.warn('Performance scorecard API failed, using fallback:', err);
        return of(null);
      })
    );
  }

  getPerformanceEvaluations(): Observable<PerformanceEvaluation[]> {
    this.loadScorecardData().subscribe();
    return of(this.performanceState());
  }

  getBehaviourEvaluations(): Observable<BehaviourEvaluation[]> {
    return of(this.behaviourState());
  }

  updatePerformanceScore(recruiterId: string, updates: Partial<PerformanceEvaluation>): void {
    this.performanceState.update(list =>
      list.map(p => (p.recruiterId === recruiterId ? { ...p, ...updates } : p))
    );
  }

  updateBehaviourScore(recruiterId: string, updates: Partial<BehaviourEvaluation>): void {
    this.behaviourState.update(list =>
      list.map(b => (b.recruiterId === recruiterId ? { ...b, ...updates } : b))
    );
  }
}
