import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { WeeklyReviewSummary, ReviewActionItem, PriorityLevel } from '../models/recruitment.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WeeklyReviewService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  private summaryState = signal<WeeklyReviewSummary>({
    weekNumber: `W-${new Date().getFullYear()}`,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    plannedClosures: 0,
    actualClosures: 0,
    redP0PositionsCount: 0,
    openBottlenecksCount: 0,
    closureRatePct: 0,
    slaBreachCount: 0,
    keyHighlights: [],
    criticalRisks: []
  });
  private actionsState = signal<ReviewActionItem[]>([]);

  readonly summary = this.summaryState.asReadonly();
  readonly actions = this.actionsState.asReadonly();

  readonly pendingActionsCount = computed(() => 
    this.actionsState().filter(a => a.status === 'Pending').length
  );

  readonly inProgressActionsCount = computed(() => 
    this.actionsState().filter(a => a.status === 'In Progress').length
  );

  readonly resolvedActionsCount = computed(() => 
    this.actionsState().filter(a => a.status === 'Resolved').length
  );

  constructor() {
    this.loadWeeklySummary().subscribe();
  }

  loadWeeklySummary(): Observable<any> {
    return this.http.get<{ success: boolean; data: any }>(`${this.apiUrl}/reports/weekly-review`).pipe(
      tap(res => {
        if (res.success && res.data) {
          const d = res.data;
          this.summaryState.set({
            weekNumber: `W-${new Date().getFullYear()}`,
            startDate: d.start_date || '',
            endDate: d.end_date || '',
            plannedClosures: d.total_active_openings ?? 0,
            actualClosures: d.candidates_joined ?? 0,
            redP0PositionsCount: d.active_bottlenecks ?? 0,
            openBottlenecksCount: d.active_bottlenecks ?? 0,
            closureRatePct: d.total_active_openings ? Math.round((d.candidates_joined / d.total_active_openings) * 100) : 0,
            slaBreachCount: d.active_sla_breaches ?? 0,
            keyHighlights: [
              `${d.new_requisitions_opened || 0} New requisitions opened this week`,
              `${d.offers_released || 0} Offers released across departments`,
              `${d.candidates_joined || 0} Candidates joined successfully`
            ],
            criticalRisks: []
          });
        }
      }),
      catchError(err => {
        console.warn('Weekly summary API failed, using fallback:', err);
        return of(null);
      })
    );
  }

  getWeeklySummary(): Observable<WeeklyReviewSummary> {
    this.loadWeeklySummary().subscribe();
    return of(this.summaryState());
  }

  getActionItems(): Observable<ReviewActionItem[]> {
    return of(this.actionsState());
  }

  addActionItem(item: {
    issue: string;
    positionTitle: string;
    decision: string;
    owner: string;
    dueDate: string;
    priority: PriorityLevel;
  }): ReviewActionItem {
    const newAction: ReviewActionItem = {
      id: `ACT-${100 + this.actionsState().length + 1}`,
      issue: item.issue,
      positionTitle: item.positionTitle,
      decision: item.decision,
      owner: item.owner,
      dueDate: item.dueDate,
      priority: item.priority,
      status: 'Pending',
      createdAt: new Date().toISOString().split('T')[0]
    };

    this.actionsState.update(list => [newAction, ...list]);
    return newAction;
  }

  updateActionStatus(id: string, status: 'Pending' | 'In Progress' | 'Resolved'): void {
    this.actionsState.update(list =>
      list.map(a => (a.id === id ? { ...a, status } : a))
    );
  }
}
