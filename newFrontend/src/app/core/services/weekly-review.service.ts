import { Injectable, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { WeeklyReviewSummary, ReviewActionItem, PriorityLevel } from '../models/recruitment.model';
import weeklyReviewMock from '../../../assets/mock/weekly-review.json';

@Injectable({
  providedIn: 'root'
})
export class WeeklyReviewService {
  private summaryState = signal<WeeklyReviewSummary>(weeklyReviewMock.summary as WeeklyReviewSummary);
  private actionsState = signal<ReviewActionItem[]>(weeklyReviewMock.actions as ReviewActionItem[]);

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

  getWeeklySummary(): Observable<WeeklyReviewSummary> {
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
