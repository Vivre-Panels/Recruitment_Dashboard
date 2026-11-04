import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Candidate } from '../../../core/models/recruitment.model';
import { CandidateService } from '../../../core/services/candidate.service';
import { ApplicationDelayAssessment, assessApplicationDelays, formatElapsed, parseApplicationTimestamp } from '../../../core/utils/application-delay';
import { environment } from '../../../../environments/environment';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { DrawerComponent } from '../../../shared/components/drawer/drawer.component';

interface DelayedApplication {
  application: Candidate;
  assessment: ApplicationDelayAssessment;
}

interface StageSummary {
  key: string;
  label: string;
  slaLabel: string;
  delayed: number;
  assessed: number;
  notAssessable: number;
  candidateSpecific: number;
  delayedApplications: DelayedApplication[];
}

interface RecruiterPostingSummary {
  key: string;
  recruiter: string;
  postingTitle: string;
  totalApplications: number;
  delayedApplicationIds: Set<string>;
  delayEvents: number;
  assessedChecks: number;
  notAssessableChecks: number;
  candidateSpecificChecks: number;
  stages: StageSummary[];
}

interface DatabaseRecruiter {
  recruiter_id: number;
  recruiter_name: string;
  email: string;
  User_ID: string;
  status: string;
}

@Component({
  selector: 'app-recruiter-posting-delay-report',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent, IconComponent, DrawerComponent],
  template: `
    <div class="app-page-container !h-full !min-h-0 !p-2 -mt-3 !max-w-7xl">
      <app-page-header [compact]="true" title="Recruiter × Posting Title Delay Report">
        <a actions routerLink="/dashboard/application-insights" class="app-btn-secondary inline-flex items-center gap-2">
          <app-icon name="arrow-left" [size]="14"></app-icon>Back to Applications
        </a>
      </app-page-header>

      <section class="app-card flex min-h-0 flex-1 flex-col overflow-hidden !p-0">
        <div class="px-4 pt-3 text-[10px] text-slate-500">
          <div>SLA snapshot as of {{ reportAsOf() | date:'dd MMM yyyy, hh:mm a' }} · no filters applied</div>
          <div class="mt-0.5">Only valid timestamp intervals or recognized Zoho delay flags count as measured. Missing, invalid, or conflicting data is excluded from delay totals.</div>
        </div>
        <div *ngIf="loading()" class="flex flex-1 items-center justify-center gap-3 p-8 text-sm font-semibold text-slate-500">
          <span class="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></span>
          Loading all application records...
        </div>

        <div *ngIf="!loading() && loadError()" class="border-b border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          <strong>Incomplete database result:</strong> {{ loadError() }} Delay totals below are based only on records loaded so far.
        </div>
        <div *ngIf="!loading() && duplicateRows() > 0" class="border-b border-slate-200 bg-slate-50 px-4 py-2 text-[11px] text-slate-600">
          {{ duplicateRows() }} duplicate API row(s) were excluded by Application ID before calculating counts.
        </div>
        <div *ngIf="!loading() && recruiterLoadError()" class="border-b border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
          <strong>Recruiter directory unavailable:</strong> {{ recruiterLoadError() }} The report is not grouping free-text recruiter names.
        </div>

        <div *ngIf="!loading() && rows().length === 0" class="flex flex-1 flex-col items-center justify-center p-10 text-center">
          <p class="text-sm font-bold text-slate-800">No application records available</p>
          <p class="mt-1 text-xs text-slate-500">The delay report needs application records from the database API.</p>
        </div>

        <div *ngIf="!loading() && rows().length > 0" class="min-h-0 flex-1 overflow-auto">
          <table class="w-full min-w-[1050px] border-collapse text-left text-xs">
            <thead class="sticky top-0 z-10 bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              <tr class="border-b border-slate-200">
                <th class="px-4 py-3">Recruiter</th>
                <th class="px-3 py-3">Posting Title</th>
                <th class="px-3 py-3 text-right">Applications</th>
                <th class="px-3 py-3 text-right">Apps with Confirmed Delay</th>
                <th class="px-3 py-3 text-right">Confirmed Delay Events</th>
                <th class="px-3 py-3 text-right">Measured / Unassessable / Candidate-Specific</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              <ng-container *ngFor="let row of rows(); trackBy: trackByGroup">
                <tr class="cursor-pointer hover:bg-slate-50/70" (click)="openRecruiterDetails($event, row.recruiter)">
                  <td class="px-4 py-3 font-semibold"><button type="button" class="text-left text-slate-900 underline decoration-dotted underline-offset-2 hover:text-brand-700" (click)="openRecruiterDetails($event, row.recruiter)">{{ row.recruiter }}</button></td>
                  <td class="px-3 py-3 font-medium">{{ row.postingTitle }}</td>
                  <td class="px-3 py-3 text-right font-semibold">{{ row.totalApplications }}</td>
                  <td class="px-3 py-3 text-right">
                    <span class="font-bold" [ngClass]="row.delayedApplicationIds.size ? 'text-red-700' : 'text-slate-700'">{{ row.delayedApplicationIds.size }}</span>
                    <span class="text-slate-400"> / {{ row.totalApplications }}</span>
                  </td>
                  <td class="px-3 py-3 text-right font-bold text-amber-800">{{ row.delayEvents }}</td>
                  <td class="px-3 py-3 text-right">{{ row.assessedChecks }} / {{ row.notAssessableChecks }} / {{ row.candidateSpecificChecks }}</td>
                </tr>
                <tr *ngIf="expandedGroupKey() === row.key" class="bg-slate-50/60">
                  <td colspan="6" class="px-4 py-3">
                    <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <h3 class="text-[11px] font-bold uppercase tracking-wide text-slate-700">Stage delay breakdown</h3>
                      <span class="text-[10px] text-slate-500">Delayed application = unique Application ID with ≥1 confirmed breach. Delay event = one application-stage breach.</span>
                    </div>
                    <table class="w-full min-w-[700px] text-left text-[11px]">
                      <thead class="text-[10px] uppercase tracking-wide text-slate-500">
                        <tr>
                          <th class="py-2">Stage · SLA</th>
                          <th class="py-2 text-right">Delayed / Assessed</th>
                          <th class="py-2 text-right">Not assessable</th>
                          <th class="py-2 text-right">Candidate-specific</th>
                          <th class="py-2 text-right">Affected applications</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-200">
                        <tr *ngFor="let stage of row.stages">
                          <td class="py-2 font-semibold text-slate-700">{{ stage.label }} <span class="font-normal text-slate-500">· {{ stage.slaLabel }}</span></td>
                          <td class="py-2 text-right">{{ stage.delayed }} / {{ stage.assessed }}</td>
                          <td class="py-2 text-right">{{ stage.notAssessable }}</td>
                          <td class="py-2 text-right">{{ stage.candidateSpecific }}</td>
                          <td class="py-2 text-right">
                            <button *ngIf="stage.delayed > 0" type="button" class="font-bold text-brand-700 underline decoration-dotted underline-offset-2" (click)="openStageDetails($event, row, stage)">
                              View {{ stage.delayed }}
                            </button>
                            <span *ngIf="stage.delayed === 0" class="text-slate-400">—</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <p class="mt-2 text-[10px] text-slate-500">A missing timestamp or unrecognized delay flag is not counted as on-time or delayed. It is reported as not assessable.</p>
                  </td>
                </tr>
              </ng-container>
            </tbody>
          </table>
        </div>
      </section>

      <app-drawer
        [(isOpen)]="isDetailDrawerOpen"
        [title]="selectedStage()?.label || 'Delayed Applications'"
        [subtitle]="selectedGroup() ? selectedGroup()!.recruiter + ' · ' + selectedGroup()!.postingTitle : ''"
        width="xl"
      >
        <div *ngIf="selectedStage() as stage" class="space-y-3 text-xs">
          <p class="text-[11px] text-slate-500">{{ stage.delayed }} confirmed delay event(s), calculated from recorded timestamps or an explicit database delay flag.</p>
          <article *ngFor="let item of stage.delayedApplications" class="rounded-xl border border-slate-200 bg-white p-3">
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="font-bold text-slate-900">{{ item.application.name || 'Unnamed candidate' }}</div>
                <div class="mt-0.5 text-[10px] text-slate-500">Application {{ item.application.id }}</div>
              </div>
              <span class="rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-700">
                {{ item.assessment.overByMs !== undefined ? 'Delayed by ' + formatElapsed(item.assessment.overByMs) : 'Zoho marked delayed' + (item.assessment.reportedDelay ? ' · ' + item.assessment.reportedDelay : '') }}
              </span>
            </div>
            <div class="mt-2 grid grid-cols-1 gap-1 text-[10px] text-slate-600 sm:grid-cols-2">
              <div><strong>Start:</strong> {{ item.assessment.startAt ? formatTimestamp(item.assessment.startAt) : 'Not recorded' }}</div>
              <div><strong>End:</strong> {{ item.assessment.isOpenInterval ? 'Now · open SLA' : item.assessment.endAt ? formatTimestamp(item.assessment.endAt) : 'Not recorded' }}</div>
              <div class="sm:col-span-2"><strong>Basis:</strong> {{ item.assessment.basis }}</div>
              <div class="sm:col-span-2"><strong>Delay reason:</strong> {{ item.assessment.delayReason?.trim() || '—' }}</div>
            </div>
          </article>
          <p *ngIf="stage.delayedApplications.length === 0" class="rounded-lg bg-slate-50 p-4 text-center text-slate-500">No delayed application details are available.</p>
        </div>
      </app-drawer>

      <app-drawer
        [(isOpen)]="isRecruiterDrawerOpen"
        [title]="selectedRecruiter()?.recruiter_name || 'Recruiter details'"
        [subtitle]="selectedRecruiter() ? selectedRecruiter()!.status + ' · Recruiters table record' : ''"
        width="xl"
      >
        <div *ngIf="selectedRecruiter() as recruiter" class="space-y-5 text-xs">
          <section class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-3"><div class="text-[10px] font-bold uppercase text-slate-500">Email</div><div class="mt-1 break-all font-semibold text-slate-800">{{ recruiter.email || '—' }}</div></div>
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-3"><div class="text-[10px] font-bold uppercase text-slate-500">Recruiter ID</div><div class="mt-1 font-semibold text-slate-800">{{ recruiter.recruiter_id }}</div></div>
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-3"><div class="text-[10px] font-bold uppercase text-slate-500">User ID</div><div class="mt-1 break-all font-semibold text-slate-800">{{ recruiter.User_ID || '—' }}</div></div>
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-3"><div class="text-[10px] font-bold uppercase text-slate-500">Status</div><div class="mt-1 font-semibold text-slate-800">{{ recruiter.status || '—' }}</div></div>
          </section>
          <section>
            <h3 class="mb-2 font-bold text-slate-900">Posting title breakdown</h3>
            <div class="overflow-hidden rounded-xl border border-slate-200">
              <div *ngFor="let row of recruiterRows(recruiter.recruiter_name); trackBy: trackByGroup" class="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 border-b border-slate-100 px-3 py-3 last:border-b-0">
                <span class="font-medium text-slate-700">{{ row.postingTitle }}</span><span class="text-slate-600">{{ row.totalApplications }} apps</span><span class="font-bold text-red-700">{{ row.delayedApplicationIds.size }} delayed</span>
              </div>
              <p *ngIf="recruiterRows(recruiter.recruiter_name).length === 0" class="p-4 text-center text-slate-500">No matching application records for this recruiter.</p>
            </div>
          </section>
        </div>
      </app-drawer>
    </div>
  `
})
export class RecruiterPostingDelayReportComponent {
  private candidateService = inject(CandidateService);
  private http = inject(HttpClient);
  loading = signal(true);
  loadError = signal('');
  recruiterLoadError = signal('');
  rows = signal<RecruiterPostingSummary[]>([]);
  recruiters = signal<DatabaseRecruiter[]>([]);
  excludedApplications = signal(0);
  reportAsOf = signal(new Date());
  duplicateRows = signal(0);
  expandedGroupKey = signal('');
  isDetailDrawerOpen = false;
  selectedGroup = signal<RecruiterPostingSummary | null>(null);
  selectedStage = signal<StageSummary | null>(null);
  isRecruiterDrawerOpen = false;
  selectedRecruiter = signal<DatabaseRecruiter | null>(null);

  constructor() {
    forkJoin({
      applications: this.candidateService.loadAllApplicationsForReport(),
      directory: this.http.get<{ success: boolean; data: DatabaseRecruiter[] }>(`${environment.apiUrl}/recruiters`).pipe(catchError(error => of({ success: false, data: [], error })))
    }).subscribe(({ applications: result, directory }) => {
      const asOf = new Date();
      this.reportAsOf.set(asOf);
      this.duplicateRows.set(result.duplicateRows);
      const validDirectory = directory.success && Array.isArray(directory.data);
      this.recruiterLoadError.set(validDirectory ? '' : 'Could not load recruiters from the database API.');
      const knownRecruiters = validDirectory ? directory.data.filter(item => item.recruiter_name?.trim()) : [];
      this.recruiters.set(knownRecruiters);
      this.loadError.set(result.error || (result.complete ? '' : `Loaded ${result.applications.length} unique applications; database reports ${result.databaseTotal}.`));
      const grouped = validDirectory ? this.buildGroups(result.applications, asOf.getTime(), knownRecruiters) : { rows: [], excluded: result.applications.length };
      this.rows.set(grouped.rows);
      this.excludedApplications.set(grouped.excluded);
      this.loading.set(false);
    });
  }

  private buildGroups(applications: Candidate[], asOf: number, recruiters: DatabaseRecruiter[]): { rows: RecruiterPostingSummary[]; excluded: number } {
    const groups = new Map<string, RecruiterPostingSummary>();
    const seenApplicationIds = new Set<string>();
    const normalizeGroupValue = (value: string) => value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
    const recruiterByName = new Map(recruiters.map(recruiter => [normalizeGroupValue(recruiter.recruiter_name), recruiter]));
    let excluded = 0;

    for (const application of applications) {
      const applicationId = application.id.trim();
      const normalizedApplicationId = applicationId.toLowerCase();
      if (!normalizedApplicationId || seenApplicationIds.has(normalizedApplicationId)) continue;
      seenApplicationIds.add(normalizedApplicationId);

      const recruiterRecord = recruiterByName.get(normalizeGroupValue(application.recruiter || ''));
      if (!recruiterRecord) { excluded++; continue; }
      const recruiter = recruiterRecord.recruiter_name.trim();
      const postingTitle = application.positionTitle.trim() || 'Unknown posting title';
      const key = `${normalizeGroupValue(recruiter)}\u0000${normalizeGroupValue(postingTitle)}`;
      let group = groups.get(key);
      const assessments = assessApplicationDelays(application, asOf);
      if (!group) {
        group = {
          key, recruiter, postingTitle, totalApplications: 0, delayedApplicationIds: new Set<string>(),
          delayEvents: 0, assessedChecks: 0, notAssessableChecks: 0, candidateSpecificChecks: 0,
          stages: assessments.map(assessment => ({
            key: assessment.key, label: assessment.label, slaLabel: assessment.slaLabel,
            delayed: 0, assessed: 0, notAssessable: 0, candidateSpecific: 0, delayedApplications: []
          }))
        };
        groups.set(key, group);
      }
      group.totalApplications++;

      for (const assessment of assessments) {
        const stage = group.stages.find(item => item.key === assessment.key);
        if (!stage) continue;
        if (assessment.status === 'delayed') {
          stage.delayed++;
          stage.assessed++;
          stage.delayedApplications.push({ application, assessment });
          group.delayedApplicationIds.add(normalizedApplicationId);
          group.delayEvents++;
          group.assessedChecks++;
        } else if (assessment.status === 'within_sla') {
          stage.assessed++;
          group.assessedChecks++;
        } else if (assessment.status === 'candidate_specific') {
          stage.candidateSpecific++;
          group.candidateSpecificChecks++;
        } else {
          stage.notAssessable++;
          group.notAssessableChecks++;
        }
      }
    }

    return { rows: Array.from(groups.values()).sort((a, b) => a.recruiter.localeCompare(b.recruiter) || a.postingTitle.localeCompare(b.postingTitle)), excluded };
  }

  openRecruiterDetails(event: Event, recruiterName: string) {
    event.stopPropagation();
    const normalized = recruiterName.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
    this.selectedRecruiter.set(this.recruiters().find(item => item.recruiter_name.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase() === normalized) || null);
    this.isRecruiterDrawerOpen = true;
  }

  recruiterRows(name: string): RecruiterPostingSummary[] {
    const normalized = name.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
    return this.rows().filter(row => row.recruiter.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase() === normalized);
  }

  toggleGroup(key: string) { this.expandedGroupKey.set(this.expandedGroupKey() === key ? '' : key); }

  openStageDetails(event: Event, group: RecruiterPostingSummary, stage: StageSummary) {
    event.stopPropagation();
    this.selectedGroup.set(group);
    this.selectedStage.set(stage);
    this.isDetailDrawerOpen = true;
  }

  formatTimestamp(value: string): string {
    const parsed = parseApplicationTimestamp(value);
    return parsed === undefined ? value : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(parsed));
  }

  formatElapsed(milliseconds?: number): string { return formatElapsed(milliseconds); }

  trackByGroup(_index: number, row: RecruiterPostingSummary): string { return row.key; }
}
