import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';

@Component({
  selector: 'app-analytics-funnel',
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
    <div class="space-y-6 max-w-7xl mx-auto">
      <app-page-header
        title="Recruitment Funnel & Yield"
        subtitle="End-to-end stage conversion percentages, candidate throughput, and velocity metrics."
      >
        <div badges class="flex items-center gap-2">
          <span class="text-xs font-mono font-semibold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
            Conversion Yield: {{ analyticsService.overallConversionRate() }}%
          </span>
        </div>
      </app-page-header>

      <!-- Skeleton KPI Loader -->
      <app-loading-state *ngIf="analyticsService.isLoading()" type="kpis"></app-loading-state>

      <!-- Key Metrics (Prompt Rule 15) -->
      <div *ngIf="!analyticsService.isLoading()" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <app-kpi-card
          title="Conversion Yield"
          [value]="analyticsService.overallConversionRate() + '%'"
          subtitle="Sourced to joined throughput"
          icon="activity"
          accent="brand"
        ></app-kpi-card>

        <app-kpi-card
          title="Average Time to Hire"
          [value]="'12 Days'"
          subtitle="Across active vacancies"
          icon="clock"
          accent="info"
        ></app-kpi-card>
      </div>

      <!-- Skeleton Card Loader -->
      <app-loading-state *ngIf="analyticsService.isLoading()" type="cards"></app-loading-state>

      <!-- Stage-by-Stage Funnel (Prompt Rule 15) -->
      <div *ngIf="!analyticsService.isLoading()" class="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="text-sm font-bold text-slate-900">Recruitment Funnel Throughput</h3>
          <span class="text-xs text-slate-400 font-mono">YTD Pipeline</span>
        </div>

        <div class="space-y-3">
          <div 
            *ngFor="let stage of analyticsService.funnel(); let i = index"
            class="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2"
          >
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div class="flex items-center gap-3">
                <span class="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                  {{ i + 1 }}
                </span>
                <div>
                  <h4 class="text-sm font-bold text-slate-900 leading-tight">{{ stage.stage }}</h4>
                  <span class="text-[11px] text-slate-500">Avg Stage Duration: <strong class="text-slate-800 font-mono">{{ stage.avgDaysInStage }} Days</strong></span>
                </div>
              </div>

              <div class="flex items-center gap-6 text-xs font-mono">
                <div>
                  <span class="text-slate-400 text-[10px] uppercase font-bold block">Candidates</span>
                  <span class="text-base font-bold text-slate-900">{{ stage.count }}</span>
                </div>
                <div>
                  <span class="text-slate-400 text-[10px] uppercase font-bold block">Stage Conv.</span>
                  <span class="text-sm font-bold text-emerald-700">{{ stage.conversionRate }}%</span>
                </div>
              </div>
            </div>

            <!-- Bar Visual -->
            <div class="w-full bg-slate-200/80 h-2.5 rounded-full overflow-hidden">
              <div 
                class="bg-brand-500 h-full rounded-full transition-all duration-500"
                [style.width.%]="(stage.count / analyticsService.funnel()[0].count) * 100"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AnalyticsFunnelComponent {
  analyticsService = inject(AnalyticsService);
}
