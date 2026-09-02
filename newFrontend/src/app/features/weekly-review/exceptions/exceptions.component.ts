import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WeeklyReviewService } from '../../../core/services/weekly-review.service';
import { PositionService } from '../../../core/services/position.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PriorityBadgeComponent } from '../../../shared/components/priority-badge/priority-badge.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-weekly-review-exceptions',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    PriorityBadgeComponent,
    IconComponent
  ],
  template: `
    <div class="space-y-6">
      <app-page-header
        title="Exceptions & Escalated Bottlenecks"
        subtitle="Stalled requisitions, breached interview SLAs, and hiring stakeholder blockers."
      >
        <div badges class="flex items-center gap-2">
          <span class="text-xs font-mono font-semibold px-2.5 py-1 bg-red-50 text-red-700 rounded-full border border-red-200">
            {{ reviewService.summary().criticalRisks.length }} Escalated Exceptions
          </span>
        </div>
      </app-page-header>

      <!-- Exceptions List -->
      <div class="space-y-4">
        <div 
          *ngFor="let risk of reviewService.summary().criticalRisks"
          class="bg-white border border-red-200 rounded-xl p-5 shadow-xs space-y-3"
        >
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold">
                <app-icon name="alert-triangle" [size]="16"></app-icon>
              </div>
              <div>
                <h3 class="text-sm font-bold text-slate-900">{{ risk.positionTitle }}</h3>
                <span class="text-xs text-slate-500">{{ risk.department }}</span>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <span class="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-red-50 text-red-700 border border-red-200">
                Stalled for {{ risk.daysPending }} Days
              </span>
              <app-priority-badge priority="P0"></app-priority-badge>
            </div>
          </div>

          <div class="text-xs text-slate-700 space-y-1.5">
            <span class="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Root Cause Description</span>
            <p class="leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200 font-medium">
              {{ risk.issue }}
            </p>
          </div>

          <div class="flex items-center justify-between pt-2 text-xs">
            <div class="text-slate-500">
              Lead Recruiter: <strong class="text-slate-800">{{ risk.owner }}</strong>
            </div>

            <a
              routerLink="/weekly-review/actions"
              class="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              Log Action Item
              <app-icon name="arrow-right" [size]="13"></app-icon>
            </a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class WeeklyReviewExceptionsComponent {
  reviewService = inject(WeeklyReviewService);
  positionService = inject(PositionService);
}
