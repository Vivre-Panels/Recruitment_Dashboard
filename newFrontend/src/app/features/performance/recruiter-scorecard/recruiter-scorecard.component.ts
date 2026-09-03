import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RecruiterService } from '../../../core/services/recruiter.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';

@Component({
  selector: 'app-performance-recruiter-scorecard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PageHeaderComponent,
    IconComponent,
    LoadingStateComponent
  ],
  template: `
    <div class="space-y-6">
      <app-page-header
        title="Recruiter Scorecards"
        subtitle="Detailed 360° individual scorecards, speed-to-hire velocity, and candidate satisfaction indices."
      >
        <div badges class="flex items-center gap-2">
          <span class="text-xs font-mono font-semibold px-2.5 py-1 bg-brand-50 text-brand-700 rounded-full border border-brand-200">
            {{ recruiterService.recruiters().length }} Profiles Analyzed
          </span>
        </div>
      </app-page-header>

      <!-- Skeleton Cards Loader -->
      <app-loading-state *ngIf="recruiterService.isLoading()" type="cards"></app-loading-state>

      <!-- Recruiter Profile Cards Grid -->
      <div *ngIf="!recruiterService.isLoading()" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div 
          *ngFor="let rec of recruiterService.recruiters()"
          class="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs hover:shadow-md transition-all space-y-4"
        >
          <!-- Card Header -->
          <div class="flex items-start justify-between border-b border-slate-100 pb-3 gap-3">
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <div class="w-11 h-11 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                {{ getInitials(rec.name) }}
              </div>
              <div class="min-w-0 flex-1">
                <h3 class="text-sm font-bold text-slate-900 leading-tight truncate">{{ rec.name }}</h3>
                <span class="text-xs text-slate-500 font-medium truncate block">{{ rec.department }} • {{ rec.email }}</span>
              </div>
            </div>

            <div class="text-right shrink-0">
              <span class="text-lg font-bold font-mono text-brand-700 block leading-none">{{ rec.overallScore }}%</span>
              <span class="text-[10px] uppercase font-bold text-slate-400 block mt-1 whitespace-nowrap">Weighted Score</span>
            </div>
          </div>

          <!-- Key Stats Grid -->
          <div class="grid grid-cols-3 gap-2.5 text-center text-xs">
            <div class="p-2.5 bg-slate-50 rounded-lg border border-slate-200/70">
              <span class="text-slate-400 block text-[10px] uppercase font-bold">Successful Hires</span>
              <span class="font-bold text-slate-900 font-mono text-sm">{{ rec.successfulHires }}</span>
            </div>

            <div class="p-2.5 bg-slate-50 rounded-lg border border-slate-200/70">
              <span class="text-slate-400 block text-[10px] uppercase font-bold">Avg Days to Hire</span>
              <span class="font-bold text-slate-900 font-mono text-sm">{{ rec.avgDaysToHire }}d</span>
            </div>

            <div class="p-2.5 bg-slate-50 rounded-lg border border-slate-200/70">
              <span class="text-slate-400 block text-[10px] uppercase font-bold">30d Retention</span>
              <span class="font-bold text-emerald-700 font-mono text-sm">{{ rec.retentionRate30Days }}%</span>
            </div>
          </div>

          <!-- 4 Pillars Bars -->
          <div class="space-y-2 text-xs">
            <div>
              <div class="flex justify-between text-[11px] mb-0.5">
                <span class="text-slate-600 font-medium">Deadline Achievement (20% wt)</span>
                <span class="font-mono font-bold text-slate-900">{{ rec.deadlineAchievementPct }}%</span>
              </div>
              <div class="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div class="bg-brand-500 h-full rounded-full" [style.width.%]="rec.deadlineAchievementPct"></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between text-[11px] mb-0.5">
                <span class="text-slate-600 font-medium">Candidate Quality (20% wt)</span>
                <span class="font-mono font-bold text-slate-900">{{ rec.candidateQualityScore }}%</span>
              </div>
              <div class="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div class="bg-emerald-500 h-full rounded-full" [style.width.%]="rec.candidateQualityScore"></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between text-[11px] mb-0.5">
                <span class="text-slate-600 font-medium">Process Discipline (10% wt)</span>
                <span class="font-mono font-bold text-slate-900">{{ rec.processDisciplineScore }}%</span>
              </div>
              <div class="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div class="bg-blue-500 h-full rounded-full" [style.width.%]="rec.processDisciplineScore"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PerformanceRecruiterScorecardComponent {
  recruiterService = inject(RecruiterService);

  getInitials(name: string): string {
    if (!name) return 'RS';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
