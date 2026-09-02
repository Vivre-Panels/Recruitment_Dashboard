import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WeeklyReviewService } from '../../../core/services/weekly-review.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-weekly-review-overview',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PageHeaderComponent,
    KpiCardComponent,
    IconComponent
  ],
  template: `
    <div class="app-page-container">
      <app-page-header
        title="Weekly Executive Review"
        subtitle="Operational cadence briefing, target fulfillment, and executive risk escalations."
      >
        <div badges class="flex items-center gap-2">
          <span class="text-xs font-mono font-bold px-3 py-1 bg-slate-900 text-white rounded-full">
            Week: {{ reviewService.summary().weekNumber }} ({{ reviewService.summary().startDate }} to {{ reviewService.summary().endDate }})
          </span>
        </div>

        <div actions class="flex items-center gap-2">
          <a
            routerLink="/weekly-review/actions"
            class="app-btn-primary"
          >
            <app-icon name="check-square" [size]="14"></app-icon>
            Action Items Tracker
          </a>
        </div>
      </app-page-header>

      <!-- 3 Summary KPI Cards (Watermarks & Subtle Color Fills) -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <app-kpi-card
          title="Planned Closures"
          [value]="reviewService.summary().plannedClosures"
          unit="Roles"
          subtitle="Target for current week"
          icon="calendar"
          accent="info"
        ></app-kpi-card>

        <app-kpi-card
          title="Actual Closures"
          [value]="reviewService.summary().actualClosures"
          unit="Roles"
          subtitle="Fulfilled headcount"
          icon="check-circle"
          accent="brand"
        ></app-kpi-card>

        <app-kpi-card
          title="Critical Escalations"
          [value]="reviewService.summary().redP0PositionsCount"
          unit="Roles"
          subtitle="Requires executive action"
          icon="alert-triangle"
          accent="danger"
        ></app-kpi-card>
      </div>

      <!-- Highlights & Risks Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Key Highlights -->
        <div class="lg:col-span-6 bg-emerald-50/60 border border-emerald-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
          <div class="flex items-center justify-between border-b border-emerald-200/70 pb-3">
            <h3 class="text-sm font-bold text-emerald-950 flex items-center gap-2">
              <app-icon name="check-circle" [size]="16" class="text-emerald-700"></app-icon>
              Weekly Accomplishments
            </h3>
            <span class="text-xs text-emerald-800 font-semibold">Week CW-35</span>
          </div>

          <ul class="space-y-3 text-xs text-slate-800">
            <li 
              *ngFor="let h of reviewService.summary().keyHighlights"
              class="p-3.5 bg-white rounded-xl border border-emerald-200/80 flex items-start gap-3 shadow-2xs"
            >
              <app-icon name="check" [size]="14" class="text-emerald-700 shrink-0 mt-0.5 font-bold"></app-icon>
              <span class="leading-relaxed font-semibold">{{ h }}</span>
            </li>
          </ul>
        </div>

        <!-- Critical Exceptions -->
        <div class="lg:col-span-6 bg-rose-50/60 border border-rose-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
          <div class="flex items-center justify-between border-b border-rose-200/70 pb-3">
            <h3 class="text-sm font-bold text-rose-950 flex items-center gap-2">
              <app-icon name="alert-triangle" [size]="16" class="text-red-700"></app-icon>
              Exceptions Needing Attention
            </h3>
            <a 
              routerLink="/weekly-review/exceptions"
              class="text-xs font-bold text-red-700 hover:text-red-800"
            >
              View Exceptions →
            </a>
          </div>

          <div class="space-y-3 text-xs">
            <div 
              *ngFor="let r of reviewService.summary().criticalRisks"
              class="p-3.5 bg-white rounded-xl border border-rose-200/80 space-y-1.5 shadow-2xs"
            >
              <div class="flex items-center justify-between">
                <span class="font-bold text-slate-900">{{ r.positionTitle }}</span>
                <span class="font-mono text-[10px] text-white font-bold px-2 py-0.5 rounded bg-red-600 shadow-2xs">{{ r.daysPending }}d Stalled</span>
              </div>
              <p class="text-slate-800 text-xs font-medium leading-snug">{{ r.issue }}</p>
              <div class="text-[11px] text-slate-500 pt-1">
                Department: <strong class="text-slate-900">{{ r.department }}</strong> • Recruiter: <strong class="text-slate-900">{{ r.owner }}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class WeeklyReviewOverviewComponent {
  reviewService = inject(WeeklyReviewService);
}
