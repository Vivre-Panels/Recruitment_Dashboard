import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { PositionService } from '../../../core/services/position.service';
import { CandidateService } from '../../../core/services/candidate.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { RecruiterService } from '../../../core/services/recruiter.service';
import { RecruitmentLookupsService } from '../../../core/services/recruitment-lookups.service';
import { Position } from '../../../core/models/recruitment.model';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PriorityBadgeComponent } from '../../../shared/components/priority-badge/priority-badge.component';
import { SearchInputComponent } from '../../../shared/components/search-input/search-input.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { DrawerComponent } from '../../../shared/components/drawer/drawer.component';
import { ViewSwitcherTabsComponent, ViewTab } from '../../../shared/components/view-switcher/view-switcher-tabs.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    KpiCardComponent,
    StatusBadgeComponent,
    PriorityBadgeComponent,
    SearchInputComponent,
    IconComponent,
    EmptyStateComponent,
    DrawerComponent,
    ViewSwitcherTabsComponent,
    LoadingStateComponent
  ],
  template: `
    <div class="space-y-4 max-w-7xl w-full mx-auto">
      <!-- Dashboard view controls -->
      <div class="flex flex-wrap justify-end items-center gap-2">
        <app-view-switcher-tabs [tabs]="dashboardTabs"></app-view-switcher-tabs>

        <button
          type="button"
          (click)="isFilterDrawerOpen = true"
          class="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-brand-50 hover:border-brand-200 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
        >
          <app-icon name="filter" [size]="14" class="text-brand-600"></app-icon>
          Filters
          <span *ngIf="activeFilterCount() > 0" class="w-4.5 h-4.5 rounded-full bg-brand-500 text-white text-[10px] flex items-center justify-center font-bold">
            {{ activeFilterCount() }}
          </span>
        </button>
      </div>

      <!-- Skeleton KPI Grid -->
      <app-loading-state *ngIf="positionService.isLoading()" type="kpis"></app-loading-state>

      <!-- Executive KPI Cards -->
      <div *ngIf="!positionService.isLoading()" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <!-- 1. Pipeline Breakdown -->
        <div class="group cursor-pointer min-w-0" (click)="openPipelineModal()">
          <app-kpi-card
            title="Pipeline Breakdown"
            value="Hiring Insights"
            subtitle="Click to view"
            [showArrow]="true"
            icon="pie-chart"
            accent="brand"
            class="block transition-all duration-200 hover:-translate-y-0.5"
          ></app-kpi-card>
        </div>

        <!-- 2. Recruiter Wise Insight -->
        <div class="group cursor-pointer min-w-0" (click)="openRecruiterInsightModal()">
          <app-kpi-card
            title="Recruiter Wise Insight"
            [value]="recruiterService.totalRecruiters() ? recruiterService.avgOverallScore() + '%' : '—'"
            unit="Avg Score"
            subtitle="Click to view breakdown"
            [showArrow]="true"
            icon="user-check"
            [trend]="recruiterService.topPerformers().length + ' Top Performers'"
            [trendPositive]="true"
            accent="brand"
            class="block transition-all duration-300 hover:scale-[1.02] hover:shadow-brand-500/20"
          ></app-kpi-card>
        </div>

        <!-- 3. Required HC -->
        <div class="min-w-0">
          <app-kpi-card
            title="Required HC"
            [value]="positionService.totalRequiredHc()"
            unit="HC"
            subtitle="Across active vacancies"
            icon="users"
            accent="brand"
          ></app-kpi-card>
        </div>

        <!-- 4. Joined -->
        <div class="min-w-0">
          <app-kpi-card
            title="Joined"
            [value]="analyticsService.totalJoined() || positionService.totalJoinedHc()"
            unit="HC"
            subtitle="Onboarded team members"
            icon="check-circle"
            trend="+4 this month"
            [trendPositive]="true"
          ></app-kpi-card>
        </div>

        <!-- 5. Successful Hires -->
        <div class="min-w-0">
          <app-kpi-card
            title="Successful Hires"
            [value]="analyticsService.totalJoined() || positionService.totalJoinedHc()"
            unit="Hires"
            subtitle="Passed 30-day retention index"
            icon="award"
            [trend]="analyticsService.totalJoined() ? analyticsService.avgRetention30Days() + '% Yield' : 'No retention data'"
            [trendPositive]="true"
            accent="brand"
          ></app-kpi-card>
        </div>

        <!-- 6. At Risk / Critical -->
        <div class="min-w-0">
          <app-kpi-card
            title="At Risk / Critical"
            [value]="positionService.positionsAtRiskCount() + positionService.positionsCriticalCount()"
            unit="Roles"
            subtitle="SLA or stage stalled"
            icon="alert-triangle"
            accent="danger"
          ></app-kpi-card>
        </div>
      </div>

      <!-- Recruitment Progress & Requisitions Table -->
      <div class="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <!-- Table Toolbar -->
        <div class="px-4 py-3 border-b border-slate-200 flex flex-col sm:grid sm:grid-cols-[1fr_auto_auto] sm:items-center gap-3 bg-white">
          <div>
            <h3 class="text-sm font-bold text-slate-900 tracking-tight">Active Requisitions</h3>
            <p class="text-[11px] text-slate-500 mt-0.5">{{ filteredRequisitions().length }} requisitions</p>
          </div>

          <app-search-input
            [value]="searchTerm"
            (valueChange)="searchTerm = $event"
            placeholder="Search position title, owner..."
          ></app-search-input>
          <a
            routerLink="/recruitment/requisitions"
            class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-brand-600 bg-brand-600 text-xs font-bold text-white whitespace-nowrap transition-colors hover:bg-brand-700 hover:border-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            View All Requisitions →
          </a>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto dashboard-requisitions-viewport">
          <table class="w-full min-w-[820px] text-left border-collapse text-xs">
            <thead>
              <tr class="border-b border-slate-200 bg-slate-100 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                <th class="py-2.5 px-4">Position</th>
                <th class="py-2.5 px-3">Department</th>
                <th class="py-2.5 px-3">Team</th>
                <th class="py-2.5 px-3 text-center">Priority</th>
                <th class="py-2.5 px-3 text-center">Progress</th>
                <th class="py-2.5 px-3">Target Date</th>
                <th class="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              <tr 
                *ngFor="let pos of filteredRequisitions()"
                (click)="openDrawer(pos)"
                class="hover:bg-brand-50/50 transition-colors cursor-pointer group"
              >
                <!-- Position -->
                <td class="py-2.5 px-4 font-medium text-slate-900">
                  <div class="max-w-[300px] truncate font-bold text-slate-900 group-hover:text-brand-600 transition-colors" [title]="pos.title">{{ pos.title }}</div>
                  <div class="max-w-[300px] truncate text-[11px] text-slate-500 mt-0.5" [title]="pos.owner">Owner: <strong class="text-slate-700">{{ pos.owner }}</strong></div>
                </td>

                <!-- Department -->
                <td class="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                  {{ pos.department }}
                </td>

                <!-- Team -->
                <td class="py-2.5 px-3 font-medium text-slate-600 whitespace-nowrap">
                  {{ pos.team || '—' }}
                </td>

                <!-- Priority -->
                <td class="py-2.5 px-3 text-center">
                  <app-priority-badge [priority]="pos.priority"></app-priority-badge>
                </td>

                <!-- Progress -->
                <td class="py-2.5 px-3 text-center font-bold">
                  <span class="text-emerald-700 font-mono text-xs">{{ pos.joinedHc }}</span>
                  <span class="text-slate-400 font-mono text-xs">/{{ pos.requiredHc }} hired</span>
                </td>

                <!-- Target -->
                <td class="py-2.5 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap font-medium">
                  {{ pos.targetDate }}
                </td>

                <!-- Status -->
                <td class="py-2.5 px-3 text-center">
                  <app-status-badge [status]="pos.status"></app-status-badge>
                </td>
              </tr>
            </tbody>
          </table>

          <app-loading-state *ngIf="isRequisitionsLoading()" type="table" [rows]="4"></app-loading-state>
          <app-empty-state
            *ngIf="!isRequisitionsLoading() && filteredRequisitions().length === 0"
            [title]="requisitionLoadError() ? 'Requisitions could not be loaded' : 'No requisitions found'"
            [message]="requisitionLoadError() || 'No database requisitions match the current search and filters.'"
          ></app-empty-state>
        </div>
      </div>

      <!-- Slide-Over Drawer -->
      <app-drawer
        [(isOpen)]="isDrawerOpen"
        [title]="selectedDrawerPosition?.title || ''"
        subtitle="Quick Requisition Breakdown"
        width="lg"
      >
        <div *ngIf="selectedDrawerPosition as pos" class="space-y-5 text-xs">
          <!-- Status Strip -->
          <div class="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div>
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Department & Location</span>
              <span class="font-bold text-slate-900 mt-0.5 block">{{ pos.department }} ({{ pos.location }})</span>
            </div>
            <div class="flex items-center gap-2">
              <app-priority-badge [priority]="pos.priority"></app-priority-badge>
              <app-status-badge [status]="pos.status"></app-status-badge>
            </div>
          </div>

          <!-- Headcount & Recruiter Grid -->
          <div class="grid grid-cols-2 gap-3">
            <div class="p-4 bg-brand-50/70 rounded-xl border border-brand-200/80">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Headcount Fulfilled</span>
              <span class="text-base font-bold text-slate-900 font-mono mt-1 block">{{ pos.joinedHc }} / {{ pos.requiredHc }} Joined</span>
            </div>
            <div class="p-4 bg-sky-50/70 rounded-xl border border-sky-200/80">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Target Date</span>
              <span class="text-base font-bold text-slate-900 font-mono mt-1 block">{{ pos.targetDate }}</span>
            </div>
          </div>

          <!-- Lead Recruiter & HM -->
          <div class="p-4 bg-white rounded-xl border border-slate-200/80 space-y-2.5">
            <div class="flex justify-between">
              <span class="text-slate-500 font-medium">Lead Recruiter:</span>
              <span class="font-bold text-slate-900">{{ pos.owner }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500 font-medium">Hiring Manager:</span>
              <span class="font-bold text-slate-900">{{ pos.hiringManager }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500 font-medium">Salary Range:</span>
              <span class="font-bold text-slate-900 font-mono">{{ pos.salaryRange }}</span>
            </div>
          </div>
        </div>

        <div footer class="flex items-center justify-between w-full">
          <button 
            type="button" 
            (click)="isDrawerOpen = false"
            class="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 border border-slate-200 rounded-xl bg-white cursor-pointer"
          >
            Close
          </button>

          <a
            *ngIf="selectedDrawerPosition"
            [routerLink]="['/recruitment/positions', selectedDrawerPosition.id]"
            (click)="isDrawerOpen = false"
            class="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Open Full 360° View
          </a>
        </div>
      </app-drawer>

      <!-- Filter Drawer -->
      <app-drawer
        [(isOpen)]="isFilterDrawerOpen"
        title="Filter Positions"
        subtitle="Refine overview by department, priority, or recruiter owner."
        width="sm"
      >
        <div class="space-y-4 text-xs">
          <div>
            <label class="block font-bold text-slate-700 mb-1.5">Department</label>
            <select
              [(ngModel)]="selectedDepartment"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
            >
              <option value="ALL">All Departments</option>
              <option *ngFor="let d of departments()" [value]="d">{{ d }}</option>
            </select>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1.5">Priority Level</label>
            <select
              [(ngModel)]="selectedPriority"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
            >
              <option value="ALL">All Priorities</option>
              <option value="P0">P0 (Critical)</option>
              <option value="P1">P1 (High)</option>
              <option value="P2">P2 (Standard)</option>
            </select>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1.5">Lead Recruiter</label>
            <select
              [(ngModel)]="selectedOwner"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
            >
              <option value="ALL">All Recruiters</option>
              <option *ngFor="let r of recruiters()" [value]="r.recruiter_name">{{ r.recruiter_name }}</option>
            </select>
          </div>
        </div>

        <div footer class="flex items-center justify-between w-full">
          <button
            type="button"
            (click)="resetFilters()"
            class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 border border-slate-200 rounded-xl bg-white cursor-pointer"
          >
            <app-icon name="rotate-ccw" [size]="14"></app-icon>
            Reset Filters
          </button>

          <button
            type="button"
            (click)="isFilterDrawerOpen = false"
            class="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
          >
            Apply Filters
          </button>
        </div>
      </app-drawer>

  `
})
export class DashboardOverviewComponent {
  private http = inject(HttpClient);
  positionService = inject(PositionService);
  candidateService = inject(CandidateService);
  analyticsService = inject(AnalyticsService);
  recruiterService = inject(RecruiterService);
  private lookups = inject(RecruitmentLookupsService);
  private router = inject(Router);

  activeRequisitions = signal<Position[]>([]);
  isRequisitionsLoading = signal<boolean>(true);
  requisitionLoadError = signal<string>('');

  constructor() {
    this.loadActiveRequisitions();
  }

  private loadActiveRequisitions() {
    this.isRequisitionsLoading.set(true);
    this.requisitionLoadError.set('');
    this.http.get<{ success: boolean; data: any[] }>(`${environment.apiUrl}/requisitions`).subscribe({
      next: (response) => {
        if (!response.success || !Array.isArray(response.data)) {
          this.activeRequisitions.set([]);
          this.requisitionLoadError.set('The requisitions API returned an invalid response.');
          this.isRequisitionsLoading.set(false);
          return;
        }

        this.activeRequisitions.set(response.data.map((item) => this.mapRequisitionToPosition(item)));
        this.isRequisitionsLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load requisitions from the database API:', error);
        this.activeRequisitions.set([]);
        this.requisitionLoadError.set('Could not reach the database requisitions API. Please try again later.');
        this.isRequisitionsLoading.set(false);
      }
    });
  }

  private mapRequisitionToPosition(item: any): Position {
    const id = String(item.job_opening_id || item.Job_Opening_ID || item.requisition_id || item.Requisition_ID || `POS-${item.id || item.Id || ''}`);
    const rawStatus = String(item.status || item.Status || '').toLowerCase();
    const status = rawStatus.includes('critical') ? 'Critical' : rawStatus.includes('risk') ? 'At Risk' : 'On Track';
    const openings = Number(item.no_of_openings ?? item.No_Of_Openings ?? 1);
    const splitList = (value: unknown): string[] => typeof value === 'string' && value.trim()
      ? value.split(',').map(part => part.trim()).filter(Boolean)
      : [];

    return {
      id,
      title: item.job_title || item.Job_Title || 'Untitled Position',
      department: item.department || item.Department || '',
      team: item.team || item.Team || '',
      requiredHc: Number.isFinite(openings) && openings > 0 ? openings : 1,
      joinedHc: 0,
      priority: (item.priority || item.Priority || 'P1') as Position['priority'],
      owner: item.recruiter_name || item.Recruiter_Name || '',
      recruiterId: String(item.recruiter_id || item.Recruiter_ID || ''),
      hiringManager: item.hiring_manager || item.Hiring_Manager || '',
      targetDate: item.target_date || item.Target_Date || '',
      createdAt: item.opening_date || item.Opening_Date || item.CreatedAt || '',
      salaryRange: item.salary_range || item.Salary_Range || '',
      location: item.location || item.Location || '',
      experienceRange: item.experience_required || item.Experience_Required || '',
      status,
      mustHaveSkills: splitList(item.must_haves || item.Must_Haves),
      knockoutCriteria: splitList(item.knockout_criteria || item.Knockout_Criteria),
      description: item.job_description || item.Job_Description || '',
      funnelCounts: { sourced: 0, screened: 0, interviewed: 0, selected: 0, offered: 0, accepted: 0, joined: 0 },
      activeCandidatesCount: 0
    };
  }

  dashboardTabs: ViewTab[] = [
    { label: 'Card Overview', icon: 'pie-chart', route: '/dashboard/overview' },
    { label: 'Control Tower Grid', icon: 'tower', route: '/dashboard/control-tower' }
  ];

  departments = this.lookups.departments;
  recruiters = this.lookups.recruiters;

  searchTerm = '';
  selectedDepartment = 'ALL';
  selectedPriority = 'ALL';
  selectedOwner = 'ALL';

  isDrawerOpen = false;
  selectedDrawerPosition?: Position;

  isFilterDrawerOpen = false;
  openRecruiterInsightModal() {
    this.router.navigate(['/dashboard/recruiter-insights']);
  }

  openPipelineModal() {
    this.router.navigate(['/dashboard/candidate-pipeline']);
  }
  attentionPositions = computed(() => {
    return this.positionService.positions().filter(p => p.status === 'Critical' || p.status === 'At Risk').slice(0, 3);
  });

  filteredRequisitions = computed(() => {
    const enrichedPositions = this.positionService.positions();
    return this.activeRequisitions().map(requisition => {
      const pipelineMatch = enrichedPositions.find(position =>
        position.id.toLowerCase() === requisition.id.toLowerCase() ||
        position.title.toLowerCase() === requisition.title.toLowerCase()
      );
      return pipelineMatch
        ? { ...requisition, joinedHc: pipelineMatch.joinedHc, funnelCounts: pipelineMatch.funnelCounts }
        : requisition;
    }).filter(p => {
      const matchesSearch = !this.searchTerm ||
        p.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        p.owner.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesDept = this.selectedDepartment === 'ALL' || p.department === this.selectedDepartment;
      const matchesPriority = this.selectedPriority === 'ALL' || p.priority === this.selectedPriority;
      const matchesOwner = this.selectedOwner === 'ALL' || p.owner === this.selectedOwner;
      return matchesSearch && matchesDept && matchesPriority && matchesOwner;
    });
  });

  activeFilterCount = computed(() => {
    let count = 0;
    if (this.selectedDepartment !== 'ALL') count++;
    if (this.selectedPriority !== 'ALL') count++;
    if (this.selectedOwner !== 'ALL') count++;
    return count;
  });

  openDrawer(pos: Position) {
    this.selectedDrawerPosition = pos;
    this.isDrawerOpen = true;
  }

  resetFilters() {
    this.searchTerm = '';
    this.selectedDepartment = 'ALL';
    this.selectedPriority = 'ALL';
    this.selectedOwner = 'ALL';
    this.isFilterDrawerOpen = false;
  }
}

