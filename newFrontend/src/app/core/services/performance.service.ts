import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { PerformanceEvaluation, BehaviourEvaluation } from '../models/recruitment.model';
import performanceMock from '../../../assets/mock/performance.json';

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private performanceState = signal<PerformanceEvaluation[]>(
    performanceMock.performanceEvaluations as PerformanceEvaluation[]
  );
  private behaviourState = signal<BehaviourEvaluation[]>(
    performanceMock.behaviourEvaluations as BehaviourEvaluation[]
  );

  readonly performanceEvaluations = this.performanceState.asReadonly();
  readonly behaviourEvaluations = this.behaviourState.asReadonly();

  getPerformanceEvaluations(): Observable<PerformanceEvaluation[]> {
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
