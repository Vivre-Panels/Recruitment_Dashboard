import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CandidateService } from '../../../core/services/candidate.service';
import { Candidate } from '../../../core/models/recruitment.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { DrawerComponent } from '../../../shared/components/drawer/drawer.component';
import { assessApplicationDelays, formatElapsed, parseApplicationTimestamp } from '../../../core/utils/application-delay';

interface ApplicationStageDetail {
  label: string;
  timestamp?: string;
  startTimestamp?: string;
  completionTimestamp?: string;
  isOpenInterval?: boolean;
  limitLabel?: string;
  delayText: string;
  delayed: boolean | null;
  remarks?: string;
  dropOffReason?: string;
  delayReason?: string;
  basis: string;
}

@Component({
  selector: 'app-application-insights',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent, IconComponent, DrawerComponent],
  template: `
    <div class="app-page-container !h-full !min-h-0 !p-2 -mt-3 !max-w-7xl">
      <app-page-header [compact]="true" title="Application Wise Insight">
        <div actions class="flex flex-wrap gap-2">
          <a routerLink="/dashboard/recruiter-posting-delay-report" class="app-btn-secondary inline-flex items-center gap-2">
            <app-icon name="bar-chart" [size]="14"></app-icon>Recruiter × Posting Delays
          </a>
          <a routerLink="/dashboard/overview" class="app-btn-secondary inline-flex items-center gap-2">
            <app-icon name="arrow-left" [size]="14"></app-icon>Back to Dashboard
          </a>
        </div>
      </app-page-header>

      <section class="app-card flex flex-1 min-h-0 flex-col overflow-hidden !p-0">
        <div class="flex flex-col gap-1 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-sm font-bold text-slate-900">All Applications</h2>
          </div>
          <span class="w-fit rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
            {{ candidates.totalCandidates() }} applications
          </span>
        </div>

        <div *ngIf="candidates.isLoading()" class="flex items-center justify-center gap-3 px-4 py-12 text-sm font-semibold text-slate-500">
          <span class="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></span>
          Loading applications...
        </div>

        <div *ngIf="!candidates.isLoading() && candidates.totalCandidates() === 0" class="px-4 py-12 text-center">
          <p class="text-sm font-bold text-slate-800">No applications found</p>
          <p class="mt-1 text-xs text-slate-500">There are no application records available in the database.</p>
        </div>

        <div *ngIf="!candidates.isLoading() && candidates.totalCandidates() > 0" class="application-insights-table-viewport min-h-0 flex-1 overflow-auto !max-h-none">
          <table class="w-full min-w-[900px] border-collapse text-left text-xs">
            <thead>
              <tr class="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th class="px-4 py-3">Application ID</th>
                <th class="px-3 py-3">Candidate</th>
                <th class="px-3 py-3">Position</th>
                <th class="px-3 py-3">Recruiter</th>
                <th class="px-3 py-3">Source</th>
                <th class="px-3 py-3">Status</th>
                <th class="px-3 py-3">Created</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              <ng-container *ngFor="let application of candidates.candidates(); trackBy: trackByApplication">
              <tr (click)="openApplicationDetails(application)" class="cursor-pointer hover:bg-slate-50/70">
                <td class="whitespace-nowrap px-4 py-3 font-semibold text-slate-600">
                  <span class="inline-flex items-center gap-1.5">{{ application.id || '—' }}<app-icon name="chevron-right" [size]="13" class="text-brand-600"></app-icon></span>
                </td>
                <td class="px-3 py-3 font-bold text-slate-900">{{ application.name || '—' }}</td>
                <td class="px-3 py-3">{{ application.positionTitle || '—' }}</td>
                <td class="px-3 py-3">{{ application.recruiter || '—' }}</td>
                <td class="px-3 py-3">{{ application.currentCompany || '—' }}</td>
                <td class="px-3 py-3">
                  <span class="inline-flex rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700">
                    {{ application.rawStatus || application.status || '—' }}
                  </span>
                </td>
                <td class="whitespace-nowrap px-3 py-3 text-slate-500">{{ application.timeline[0]?.date ? (application.timeline[0].date | date:'dd MMM yyyy') : '—' }}</td>
              </tr>
              </ng-container>
            </tbody>
          </table>
        </div>
      </section>

      <app-drawer
        [(isOpen)]="isApplicationDrawerOpen"
        [title]="selectedApplication?.name || 'Application Details'"
        [subtitle]="selectedApplication ? selectedApplication.id + ' · ' + selectedApplication.positionTitle : ''"
        width="xl"
      >
        <div *ngIf="selectedApplication as application" class="space-y-5 text-xs">
          <section class="grid grid-cols-2 gap-2">
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div class="text-[10px] font-bold uppercase tracking-wide text-slate-500">Application Status</div>
              <div class="mt-1 font-bold text-slate-800">{{ application.rawStatus || application.status || '—' }}</div>
            </div>
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div class="text-[10px] font-bold uppercase tracking-wide text-slate-500">Recruiter</div>
              <div class="mt-1 font-bold text-slate-800">{{ application.recruiter || '—' }}</div>
            </div>
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div class="text-[10px] font-bold uppercase tracking-wide text-slate-500">Source</div>
              <div class="mt-1 font-bold text-slate-800">{{ application.currentCompany || '—' }}</div>
            </div>
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div class="text-[10px] font-bold uppercase tracking-wide text-slate-500">Created</div>
              <div class="mt-1 text-slate-700">{{ application.applicationCreatedAt ? (application.applicationCreatedAt | date:'dd MMM yyyy, hh:mm a') : '—' }}</div>
            </div>
          </section>

          <section>
            <div class="mb-3">
              <h3 class="text-sm font-bold text-slate-900">Stage Timeline</h3>
              <p class="mt-0.5 text-[11px] text-slate-500">Timestamps are shown as returned by the database.</p>
            </div>
            <div class="space-y-2">
              <div *ngFor="let stage of getApplicationStages(application)" class="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                <span class="h-2.5 w-2.5 shrink-0 rounded-full" [ngClass]="stage.timestamp ? 'bg-emerald-500' : 'bg-slate-300'"></span>
                <div class="min-w-0 flex-1">
                  <div class="text-[11px] font-bold text-slate-800">{{ stage.label }}</div>
                  <div class="mt-0.5 break-words text-[11px]" [ngClass]="stage.timestamp ? 'text-slate-600' : 'text-slate-400'">
                    {{ stage.timestamp ? formatTimestamp(stage.timestamp) : 'Timestamp not recorded' }}
                  </div>
                </div>
                <span class="shrink-0 text-[10px] font-semibold" [ngClass]="stage.timestamp ? 'text-emerald-700' : 'text-slate-400'">
                  {{ stage.timestamp ? 'Recorded' : 'No data' }}
                </span>
                <div *ngIf="stage.limitLabel" class="basis-full border-t border-slate-100 pt-2 text-[10px] text-slate-500">
                  <div><strong>Maximum:</strong> {{ stage.limitLabel }}</div>
                  <div><strong>Calculation basis:</strong> {{ stage.basis }}</div>
                  <div *ngIf="stage.startTimestamp && (stage.completionTimestamp || stage.isOpenInterval)"><strong>Measured:</strong> {{ formatTimestamp(stage.startTimestamp) }} → {{ stage.isOpenInterval ? 'Now · open SLA' : formatTimestamp(stage.completionTimestamp!) }}</div>
                  <div class="mt-0.5 font-semibold" [ngClass]="stage.delayed ? 'text-red-600' : stage.delayed === false ? 'text-emerald-700' : 'text-slate-500'">{{ stage.delayText }}</div>
                </div>
                <div class="basis-full border-t border-slate-100 pt-2 text-[10px] leading-relaxed text-slate-600">
                  <div><strong>Remarks:</strong> {{ stage.remarks?.trim() || '—' }}</div>
                  <div><strong>Drop-off reason:</strong> {{ stage.dropOffReason?.trim() || '—' }}</div>
                  <div><strong>Delay reason:</strong> {{ stage.delayReason?.trim() || '—' }}</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </app-drawer>
    </div>
  `
})
export class ApplicationInsightsComponent {
  candidates = inject(CandidateService);
  isApplicationDrawerOpen = false;
  selectedApplication?: Candidate;

  openApplicationDetails(application: Candidate) {
    this.selectedApplication = application;
    this.isApplicationDrawerOpen = true;
  }

  getApplicationStages(application: Candidate): ApplicationStageDetail[] {
    return assessApplicationDelays(application).map(stage => ({
      ...stage,
      limitLabel: stage.slaLabel,
      startTimestamp: stage.startAt,
      completionTimestamp: stage.endAt,
      delayed: stage.status === 'delayed' ? true : stage.status === 'within_sla' ? false : null,
      delayText: stage.status === 'delayed'
        ? stage.overByMs !== undefined ? `Delayed by ${formatElapsed(stage.overByMs)}${stage.elapsedMs !== undefined ? ` (elapsed ${formatElapsed(stage.elapsedMs)})` : ''}` : `Zoho marked delayed${stage.reportedDelay ? ` (${stage.reportedDelay})` : ''}; timestamp overrun unavailable`
        : stage.status === 'within_sla'
          ? stage.elapsedMs !== undefined ? `Within SLA · ${formatElapsed(stage.elapsedMs)} elapsed` : 'Within SLA · recorded in Zoho'
          : stage.status === 'candidate_specific'
            ? `${formatElapsed(stage.elapsedMs)} elapsed; candidate-specific due date required`
            : 'Not assessable from available stage timestamps or delay flag',
    }));
  }

  formatTimestamp(value: string): string {
    const timestamp = parseApplicationTimestamp(value);
    return timestamp === undefined ? value : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(timestamp));
  }

  trackByApplication(_index: number, application: { id: string }): string {
    return application.id;
  }
}
