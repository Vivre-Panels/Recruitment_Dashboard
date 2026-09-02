import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RecruiterService } from '../../../core/services/recruiter.service';
import { Recruiter } from '../../../core/models/recruitment.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { DrawerComponent } from '../../../shared/components/drawer/drawer.component';

@Component({
  selector: 'app-analytics-recruiter-metrics',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PageHeaderComponent,
    IconComponent,
    DrawerComponent
  ],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto">
      <app-page-header
        title="Recruiter Performance & Delivery"
        subtitle="Operational velocity, candidate quality, and 4-factor weighted performance metrics."
      >
        <div badges class="flex items-center gap-2">
          <span class="text-xs font-mono font-semibold px-3 py-1 bg-brand-50 text-brand-700 rounded-full border border-brand-200">
            Team Average: {{ recruiterService.avgOverallScore() }}%
          </span>
        </div>
      </app-page-header>

      <!-- Recruiter Performance Table (Prompt Rule 16) -->
      <div class="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
        <div class="p-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
          <h3 class="text-sm font-bold text-slate-900">Recruiter Performance Leaderboard</h3>
          <span class="text-xs text-slate-500 font-mono">{{ recruiterService.recruiters().length }} Recruiters Active</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th class="py-3.5 px-4">Recruiter</th>
                <th class="py-3.5 px-3 text-center">Score</th>
                <th class="py-3.5 px-3 text-center">Hires</th>
                <th class="py-3.5 px-3 text-center">Status</th>
                <th class="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              <tr 
                *ngFor="let rec of recruiterService.recruiters()"
                (click)="openDrawer(rec)"
                class="hover:bg-slate-50/80 transition-colors cursor-pointer"
              >
                <!-- Recruiter -->
                <td class="py-3.5 px-4 font-semibold text-slate-900">
                  <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                      {{ rec.avatar }}
                    </div>
                    <div>
                      <span class="block text-slate-900 font-bold">{{ rec.name }}</span>
                      <span class="text-[11px] text-slate-400 font-normal block">{{ rec.department }}</span>
                    </div>
                  </div>
                </td>

                <!-- Overall Score -->
                <td class="py-3.5 px-3 text-center font-mono font-bold text-sm text-brand-700">
                  {{ rec.overallScore }}%
                </td>

                <!-- Hires -->
                <td class="py-3.5 px-3 text-center font-mono font-bold text-slate-900">
                  {{ rec.successfulHires }} Hires
                </td>

                <!-- Status -->
                <td class="py-3.5 px-3 text-center">
                  <span 
                    class="px-3 py-1 rounded-full text-xs font-semibold"
                    [ngClass]="rec.status === 'Top Performer' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'"
                  >
                    {{ rec.status }}
                  </span>
                </td>

                <!-- Action -->
                <td class="py-3.5 px-4 text-right" (click)="$event.stopPropagation()">
                  <button
                    type="button"
                    (click)="openDrawer(rec)"
                    class="px-3.5 py-1.5 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 font-semibold rounded-lg text-xs transition-colors"
                  >
                    View
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recruiter Performance Drawer (Prompt Rule 16) -->
      <app-drawer
        [(isOpen)]="isDrawerOpen"
        [title]="selectedRecruiter?.name || ''"
        subtitle="Detailed 4-Factor Weighted Score Breakdown"
        width="lg"
      >
        <div *ngIf="selectedRecruiter as rec" class="space-y-5 text-xs">
          <!-- Header Card -->
          <div class="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
            <div>
              <span class="text-[10px] uppercase font-bold text-brand-400 block">Overall Weighted Rating</span>
              <span class="text-2xl font-bold font-mono text-white mt-0.5 block">{{ rec.overallScore }}% Score</span>
              <span class="text-xs text-slate-400 mt-1 block">{{ rec.department }} • Assigned Roles: {{ rec.assignedPositions }}</span>
            </div>
            <span class="px-3 py-1 bg-brand-500 text-white font-bold rounded-full text-xs">
              {{ rec.status }}
            </span>
          </div>

          <!-- 4 Breakdown Pillars -->
          <div class="space-y-3">
            <h4 class="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Score Components Breakdown</h4>

            <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div class="flex justify-between items-center font-bold">
                <span class="text-slate-800">Successful Hires (50% Weight)</span>
                <span class="font-mono text-emerald-700 text-sm">{{ rec.successfulHires }} Hires</span>
              </div>
              <p class="text-[11px] text-slate-500">Net closed candidates who passed the 30-day retention index.</p>
            </div>

            <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div class="flex justify-between items-center font-bold">
                <span class="text-slate-800">Deadline Achievement (20% Weight)</span>
                <span class="font-mono text-slate-900 text-sm">{{ rec.deadlineAchievementPct }}%</span>
              </div>
              <p class="text-[11px] text-slate-500">Percentage of open requisitions closed on or before target date.</p>
            </div>

            <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div class="flex justify-between items-center font-bold">
                <span class="text-slate-800">Candidate Quality Rating (20% Weight)</span>
                <span class="font-mono text-slate-900 text-sm">{{ rec.candidateQualityScore }}%</span>
              </div>
              <p class="text-[11px] text-slate-500">Average interview scorecard rating assigned by hiring managers.</p>
            </div>

            <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div class="flex justify-between items-center font-bold">
                <span class="text-slate-800">Process & ATS Discipline (10% Weight)</span>
                <span class="font-mono text-slate-900 text-sm">{{ rec.processDisciplineScore }}%</span>
              </div>
              <p class="text-[11px] text-slate-500">SLA adherence and stage transition update timeliness.</p>
            </div>
          </div>
        </div>

        <div footer class="flex items-center justify-end w-full">
          <button 
            type="button" 
            (click)="isDrawerOpen = false"
            class="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg bg-white"
          >
            Close
          </button>
        </div>
      </app-drawer>
    </div>
  `
})
export class AnalyticsRecruiterMetricsComponent {
  recruiterService = inject(RecruiterService);

  isDrawerOpen = false;
  selectedRecruiter?: Recruiter;

  openDrawer(rec: Recruiter) {
    this.selectedRecruiter = rec;
    this.isDrawerOpen = true;
  }
}
