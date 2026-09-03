import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PositionService } from '../../../core/services/position.service';
import { CandidateService } from '../../../core/services/candidate.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { DEPARTMENTS, RECRUITERS_LIST } from '../../../core/constants/navigation.constant';
import { Position } from '../../../core/models/recruitment.model';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PriorityBadgeComponent } from '../../../shared/components/priority-badge/priority-badge.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { SearchInputComponent } from '../../../shared/components/search-input/search-input.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { DrawerComponent } from '../../../shared/components/drawer/drawer.component';
import { ViewSwitcherTabsComponent, ViewTab } from '../../../shared/components/view-switcher/view-switcher-tabs.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';

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
    PageHeaderComponent,
    SearchInputComponent,
    IconComponent,
    EmptyStateComponent,
    DrawerComponent,
    ViewSwitcherTabsComponent,
    LoadingStateComponent
  ],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto">
      <!-- Page Header with View Switcher Tabs -->
      <app-page-header
        title="Recruitment Dashboard"
        subtitle="Executive operational health, headcount requirements, and attention-required vacancies."
      >
        <div actions class="flex flex-wrap items-center gap-3">
          <app-view-switcher-tabs [tabs]="dashboardTabs"></app-view-switcher-tabs>

          <button
            type="button"
            (click)="isFilterDrawerOpen = true"
            class="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <app-icon name="filter" [size]="14" class="text-brand-600"></app-icon>
            Filters
            <span *ngIf="activeFilterCount() > 0" class="w-4.5 h-4.5 rounded-full bg-brand-500 text-white text-[10px] flex items-center justify-center font-bold">
              {{ activeFilterCount() }}
            </span>
          </button>
        </div>
      </app-page-header>

      <!-- Skeleton KPI Grid -->
      <app-loading-state *ngIf="positionService.isLoading()" type="kpis"></app-loading-state>

      <!-- 4 Core Executive KPI Cards -->
      <div *ngIf="!positionService.isLoading()" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <app-kpi-card
          title="Required HC"
          [value]="positionService.totalRequiredHc()"
          unit="HC"
          subtitle="Across active vacancies"
          icon="users"
          accent="brand"
        ></app-kpi-card>

        <app-kpi-card
          title="Joined"
          [value]="analyticsService.totalJoined() || positionService.totalJoinedHc()"
          unit="HC"
          subtitle="Onboarded team members"
          icon="check-circle"
          trend="+4 this month"
          [trendPositive]="true"
        ></app-kpi-card>

        <app-kpi-card
          title="Successful Hires"
          [value]="analyticsService.totalJoined() || positionService.totalJoinedHc()"
          unit="Hires"
          subtitle="Passed 30-day retention index"
          icon="award"
          [trend]="(analyticsService.avgRetention30Days() || 100) + '% Yield'"
          [trendPositive]="true"
          accent="brand"
        ></app-kpi-card>

        <app-kpi-card
          title="At Risk / Critical"
          [value]="positionService.positionsAtRiskCount() + positionService.positionsCriticalCount()"
          unit="Roles"
          subtitle="SLA or stage stalled"
          icon="alert-triangle"
          accent="danger"
        ></app-kpi-card>
      </div>

      <!-- Attention Required List -->
      <div class="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
        <app-loading-state *ngIf="positionService.isLoading()" type="table" [rows]="4"></app-loading-state>

        <div *ngIf="!positionService.isLoading()">
        <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h2 class="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
              Attention Required Positions
            </h2>
            <p class="text-xs text-slate-500 mt-0.5">Vacancies flagged with SLA delay or critical headcount bottlenecks</p>
          </div>

          <a 
            routerLink="/recruitment/requisitions" 
            class="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            View All Requisitions →
          </a>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            *ngFor="let pos of attentionPositions()"
            (click)="openDrawer(pos)"
            class="p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden select-none h-44"
            [ngClass]="pos.status === 'Critical' ? 'bg-rose-50/70 border-rose-200/90 hover:border-rose-300' : 'bg-amber-50/70 border-amber-200/90 hover:border-amber-300'"
          >
            <!-- Non-Colliding Watermark Icon -->
            <div 
              class="absolute -right-2 -bottom-2 pointer-events-none transition-transform duration-500 group-hover:scale-110 opacity-[0.08]"
              [ngClass]="pos.status === 'Critical' ? 'text-red-700' : 'text-amber-700'"
            >
              <app-icon name="alert-triangle" [size]="85"></app-icon>
            </div>

            <!-- Top Row Badges -->
            <div class="flex items-center justify-between relative z-10">
              <app-priority-badge [priority]="pos.priority"></app-priority-badge>
              <app-status-badge [status]="pos.status"></app-status-badge>
            </div>

            <!-- Title & Info -->
            <div class="my-auto relative z-10">
              <h3 class="text-xs font-bold text-slate-900 group-hover:text-brand-700 transition-colors leading-snug truncate" [title]="pos.title">{{ pos.title }}</h3>
              <p class="text-[11px] text-slate-600 font-semibold mt-1">
                {{ pos.department }} • Target: <span class="font-mono font-bold text-slate-800">{{ pos.targetDate }}</span>
              </p>
            </div>

            <!-- Bottom Row: Progress & Action Link -->
            <div class="pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[11px] relative z-10">
              <span class="text-slate-600 font-medium">Joined: <strong class="text-slate-900 font-mono">{{ pos.joinedHc }}/{{ pos.requiredHc }}</strong></span>
              <span class="text-brand-700 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                View Details
                <app-icon name="arrow-right" [size]="12"></app-icon>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recruitment Progress & Requisitions Table -->
      <div class="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
        <!-- Table Toolbar -->
        <div class="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 class="text-sm font-bold text-slate-900 tracking-tight">Active Requisitions</h3>
            <p class="text-xs text-slate-500">Overview of active vacancies with quick view drawers</p>
          </div>

          <div class="flex items-center gap-3">
            <app-search-input
              [value]="searchTerm"
              (valueChange)="searchTerm = $event"
              placeholder="Search position title, owner..."
            ></app-search-input>
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th class="py-3.5 px-4">Position</th>
                <th class="py-3.5 px-3">Department</th>
                <th class="py-3.5 px-3">Team</th>
                <th class="py-3.5 px-3 text-center">Priority</th>
                <th class="py-3.5 px-3 text-center">Progress</th>
                <th class="py-3.5 px-3">Target Date</th>
                <th class="py-3.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              <tr 
                *ngFor="let pos of filteredPositions()"
                (click)="openDrawer(pos)"
                class="hover:bg-slate-50/80 transition-colors cursor-pointer group"
              >
                <!-- Position -->
                <td class="py-3.5 px-4 font-medium text-slate-900">
                  <div class="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{{ pos.title }}</div>
                  <div class="text-[11px] text-slate-500 mt-0.5">Owner: <strong class="text-slate-700">{{ pos.owner }}</strong></div>
                </td>

                <!-- Department -->
                <td class="py-3.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                  {{ pos.department }}
                </td>

                <!-- Team -->
                <td class="py-3.5 px-3 font-medium text-slate-600 whitespace-nowrap">
                  {{ pos.team || '—' }}
                </td>

                <!-- Priority -->
                <td class="py-3.5 px-3 text-center">
                  <app-priority-badge [priority]="pos.priority"></app-priority-badge>
                </td>

                <!-- Progress -->
                <td class="py-3.5 px-3 text-center font-bold">
                  <span class="text-emerald-700 font-mono text-xs">{{ pos.joinedHc }}</span>
                  <span class="text-slate-400 font-mono text-xs">/{{ pos.requiredHc }} hired</span>
                </td>

                <!-- Target -->
                <td class="py-3.5 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap font-medium">
                  {{ pos.targetDate }}
                </td>

                <!-- Status -->
                <td class="py-3.5 px-3 text-center">
                  <app-status-badge [status]="pos.status"></app-status-badge>
                </td>
              </tr>
            </tbody>
          </table>

          <app-empty-state
            *ngIf="filteredPositions().length === 0"
            title="No positions match filters"
            message="Reset search query or filter selection."
            actionLabel="Reset Filters"
            (actionClick)="resetFilters()"
          ></app-empty-state>
        </div>
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
              <option *ngFor="let d of departments" [value]="d">{{ d }}</option>
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
              <option *ngFor="let r of recruiters" [value]="r.name">{{ r.name }}</option>
            </select>
          </div>
        </div>

        <div footer class="flex items-center justify-between w-full">
          <button
            type="button"
            (click)="resetFilters()"
            class="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 border border-slate-200 rounded-xl bg-white cursor-pointer"
          >
            Clear All
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
    </div>
  `
})
export class DashboardOverviewComponent {
  positionService = inject(PositionService);
  candidateService = inject(CandidateService);
  analyticsService = inject(AnalyticsService);
  private router = inject(Router);

  dashboardTabs: ViewTab[] = [
    { label: 'Card Overview', icon: 'pie-chart', route: '/dashboard/overview' },
    { label: 'Control Tower Grid', icon: 'tower', route: '/dashboard/control-tower' }
  ];

  departments = DEPARTMENTS;
  recruiters = RECRUITERS_LIST;

  searchTerm = '';
  selectedDepartment = 'ALL';
  selectedPriority = 'ALL';
  selectedOwner = 'ALL';

  isDrawerOpen = false;
  selectedDrawerPosition?: Position;

  isFilterDrawerOpen = false;

  attentionPositions = computed(() => {
    return this.positionService.positions().filter(p => p.status === 'Critical' || p.status === 'At Risk').slice(0, 3);
  });

  filteredPositions = computed(() => {
    return this.positionService.positions().filter(p => {
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
