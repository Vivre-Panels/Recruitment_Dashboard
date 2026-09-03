import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';

@Component({
  selector: 'app-analytics-hire-quality',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PageHeaderComponent,
    KpiCardComponent,
    IconComponent,
    LoadingStateComponent
  ],
  template: `
    <div class="space-y-6">
      <app-page-header
        title="Hire Quality & Post-Onboarding Retention"
        subtitle="Tracking candidate longevity, replacement churn, and hiring manager onboarding satisfaction."
      >
        <div badges class="flex items-center gap-2">
          <span class="text-xs font-mono font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
            Successful Hire Index: {{ analyticsService.successfulHireIndex() }}%
          </span>
        </div>
      </app-page-header>

      <!-- Skeleton Loader -->
      <app-loading-state *ngIf="analyticsService.isLoading()" type="kpis"></app-loading-state>

      <!-- KPI Summary Cards -->
      <div *ngIf="!analyticsService.isLoading()" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <app-kpi-card
          title="Total Joined"
          [value]="analyticsService.totalJoined()"
          unit="Hires"
          subtitle="All departments"
          icon="users"
          accent="brand"
        ></app-kpi-card>

        <app-kpi-card
          title="7-Day Retention"
          [value]="analyticsService.avgRetention7Days()"
          unit="%"
          subtitle="First week induction"
          icon="check-circle"
          accent="brand"
        ></app-kpi-card>

        <app-kpi-card
          title="30-Day Retention"
          [value]="analyticsService.avgRetention30Days()"
          unit="%"
          subtitle="First month stability"
          icon="award"
          accent="brand"
        ></app-kpi-card>

        <app-kpi-card
          title="30-Day Failure"
          [value]="analyticsService.avgFailure30Days()"
          unit="%"
          subtitle="Early attrition / mismatch"
          icon="alert-triangle"
          accent="danger"
        ></app-kpi-card>

        <app-kpi-card
          title="Replacement Rate"
          [value]="analyticsService.avgReplacementRate()"
          unit="%"
          subtitle="Guarantee backfills"
          icon="clock"
          accent="warning"
        ></app-kpi-card>

        <app-kpi-card
          title="Quality Hire Index"
          [value]="analyticsService.successfulHireIndex()"
          unit="%"
          subtitle="Composite benchmark"
          icon="award"
          accent="brand"
        ></app-kpi-card>
      </div>

      <!-- Department Breakdown Table -->
      <div class="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
        <div class="p-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
          <h3 class="text-sm font-bold text-slate-900">Department-Wise Post-Hire Quality Matrix</h3>
          <span class="text-xs text-slate-500 font-mono">30-Day Post-Hire Cohort</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th class="py-3 px-4">Department</th>
                <th class="py-3 px-3 text-center">Total Joined</th>
                <th class="py-3 px-3 text-center">7-Day Retention</th>
                <th class="py-3 px-3 text-center">30-Day Retention</th>
                <th class="py-3 px-3 text-center">30-Day Failure</th>
                <th class="py-3 px-3 text-center">Replacement Rate</th>
                <th class="py-3 px-3 text-center">Quality Index</th>
                <th class="py-3 px-4 text-center">Onboarding Rating</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              <tr 
                *ngFor="let hq of analyticsService.hireQuality()"
                class="hover:bg-slate-50 transition-colors"
              >
                <!-- Department -->
                <td class="py-3.5 px-4 font-bold text-slate-900">{{ hq.department }}</td>

                <!-- Total Joined -->
                <td class="py-3.5 px-3 text-center font-mono font-semibold">{{ hq.totalJoined }}</td>

                <!-- 7-Day -->
                <td class="py-3.5 px-3 text-center font-mono font-medium text-emerald-700">{{ hq.retention7DaysPct }}%</td>

                <!-- 30-Day -->
                <td class="py-3.5 px-3 text-center font-mono font-bold" [ngClass]="hq.retention30DaysPct >= 90 ? 'text-emerald-700' : 'text-amber-700'">
                  {{ hq.retention30DaysPct }}%
                </td>

                <!-- Failure -->
                <td class="py-3.5 px-3 text-center font-mono font-medium" [ngClass]="hq.failure30DaysPct > 0 ? 'text-red-600' : 'text-slate-400'">
                  {{ hq.failure30DaysPct }}%
                </td>

                <!-- Replacement -->
                <td class="py-3.5 px-3 text-center font-mono font-medium" [ngClass]="hq.replacementRatePct > 0 ? 'text-amber-700' : 'text-slate-400'">
                  {{ hq.replacementRatePct }}%
                </td>

                <!-- Quality Index -->
                <td class="py-3.5 px-3 text-center font-mono font-bold text-brand-700 text-sm">
                  {{ hq.successfulHireIndexPct }}%
                </td>

                <!-- CSAT -->
                <td class="py-3.5 px-4 text-center">
                  <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-mono font-bold">
                    ★ {{ hq.avgOnboardingFeedback }} / 5.0
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class AnalyticsHireQualityComponent {
  analyticsService = inject(AnalyticsService);
}
