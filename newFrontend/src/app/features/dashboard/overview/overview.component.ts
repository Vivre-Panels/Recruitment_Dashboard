import { Component, computed, inject, signal } from '@angular/core';
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

      <!-- 5 Core Executive KPI Cards (First Tile is Clickable Pipeline Breakdown) -->
      <div *ngIf="!positionService.isLoading()" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div class="relative group cursor-pointer" (click)="openPipelineModal()">
          <!-- Live Pulse Beacon -->
          <span class="absolute -top-1 -right-1 flex h-3.5 w-3.5 z-20">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-brand-500 border-2 border-white"></span>
          </span>
          <app-kpi-card
            title="Pipeline Breakdown"
            value="Hiring Insights"
            subtitle="Click to view"
            [showArrow]="true"
            icon="pie-chart"
            accent="brand"
            class="block transition-all duration-300 hover:scale-[1.02] hover:shadow-brand-500/20"
          ></app-kpi-card>
        </div>

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

      <!-- Pipeline Breakdown Modal -->
      <div *ngIf="isPipelineModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col relative">
          <!-- Modal Header -->
          <div class="p-5 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-30 rounded-t-2xl">
            <div>
              <h2 class="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <app-icon name="pie-chart" [size]="18" class="text-brand-600"></app-icon>
                Candidate Pipeline Stages
              </h2>
              <p class="text-xs text-slate-500 mt-0.5">Filter by position to view 8-stage candidate counts</p>
            </div>

            <div class="flex items-center gap-3">
              <!-- Searchbar + Dropdown Combo -->
              <div class="relative min-w-[260px] sm:min-w-[300px]">
                <div class="relative flex items-center h-9">
                  <div class="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10 text-slate-400">
                    <app-icon name="search" [size]="14"></app-icon>
                  </div>
                  <input
                    type="text"
                    [ngModel]="pipelineSearchQuery()"
                    (ngModelChange)="pipelineSearchQuery.set($event); isPipelineDropdownOpen.set(true)"
                    (focus)="isPipelineDropdownOpen.set(true)"
                    placeholder="Search position or select..."
                    class="w-full pl-9 pr-9 h-full bg-white border border-brand-300 rounded-xl text-xs font-semibold text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-500 leading-normal"
                  />
                  <button
                    *ngIf="pipelineSearchQuery() || selectedPipelineFilter()"
                    type="button"
                    (click)="clearPipelineFilter()"
                    class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 cursor-pointer flex items-center justify-center z-10 transition-colors"
                  >
                    <app-icon name="x" [size]="12"></app-icon>
                  </button>
                </div>

                <!-- Floating Dropdown Menu -->
                <div
                  *ngIf="isPipelineDropdownOpen()"
                  class="absolute left-0 w-full min-w-[280px] sm:min-w-[320px] mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl z-[100] max-h-64 overflow-y-auto py-1 text-xs divide-y divide-slate-100"
                >
                  <div class="py-1">
                    <button
                      type="button"
                      (click)="selectPipelinePosition('')"
                      class="w-full text-left px-4 py-2 font-medium hover:bg-slate-50 text-slate-500 cursor-pointer flex items-center justify-between"
                      [class.bg-slate-50]="selectedPipelineFilter() === ''"
                    >
                      <span>-- Select Position --</span>
                      <app-icon *ngIf="selectedPipelineFilter() === ''" name="check" [size]="12" class="text-slate-400"></app-icon>
                    </button>
                    <button
                      type="button"
                      (click)="selectPipelinePosition('ALL')"
                      class="w-full text-left px-4 py-2 font-bold hover:bg-brand-50 text-brand-700 cursor-pointer flex items-center justify-between"
                      [class.bg-brand-50]="selectedPipelineFilter() === 'ALL'"
                    >
                      <span>All Positions</span>
                      <app-icon *ngIf="selectedPipelineFilter() === 'ALL'" name="check" [size]="12" class="text-brand-600"></app-icon>
                    </button>
                  </div>

                  <div class="py-1">
                    <div *ngIf="filteredPositionOptions().length === 0" class="px-4 py-2.5 text-slate-400 italic text-[11px]">
                      No matching positions found
                    </div>
                    <button
                      *ngFor="let pos of filteredPositionOptions()"
                      type="button"
                      (click)="selectPipelinePosition(pos)"
                      class="w-full text-left px-4 py-2 font-medium hover:bg-brand-50 text-slate-800 hover:text-brand-700 cursor-pointer flex items-center justify-between transition-colors"
                      [class.bg-brand-50]="selectedPipelineFilter() === pos"
                      [class.font-bold]="selectedPipelineFilter() === pos"
                    >
                      <span class="truncate pr-2">{{ pos }}</span>
                      <app-icon *ngIf="selectedPipelineFilter() === pos" name="check" [size]="12" class="text-brand-600 shrink-0 ml-2"></app-icon>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Close Modal Button -->
              <button
                type="button"
                (click)="isPipelineModalOpen = false; isPipelineDropdownOpen.set(false)"
                class="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              >
                <app-icon name="x" [size]="18"></app-icon>
              </button>
            </div>
          </div>

          <!-- Modal Body -->
          <div class="p-6 overflow-y-auto flex-1 flex flex-col min-h-[300px]">
            <!-- Case 1: No Filter Selected (Empty Placeholder) -->
            <div *ngIf="!selectedPipelineFilter()" class="my-auto py-8">
              <app-empty-state
                title="Select Filter to View Data"
                message="Please select a position or requisition from the dropdown filter above to display candidate stage counts."
                icon="filter"
              ></app-empty-state>
            </div>

            <!-- Case 2: Filter Selected - 9 Stage Count Tiles Grid (3x3 Grid) -->
            <div *ngIf="selectedPipelineFilter()" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                *ngFor="let stage of pipelineStageConfigs"
                class="p-5 rounded-2xl border transition-all hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between"
                [ngClass]="stage.bgClass + ' ' + stage.borderClass"
              >
                <div class="flex items-center justify-between mb-3">
                  <span class="text-xs font-bold text-slate-700 uppercase tracking-wide">{{ stage.num }}. {{ stage.label }}</span>
                  <span class="p-2 rounded-xl text-sm" [ngClass]="stage.iconBgClass">
                    <app-icon [name]="stage.icon" [size]="16"></app-icon>
                  </span>
                </div>
                <div class="text-3xl font-extrabold font-mono" [ngClass]="stage.textClass">
                  {{ getStageCount(stage.key) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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

  isPipelineModalOpen = false;
  selectedPipelineFilter = signal<string>('');
  isPipelineDropdownOpen = signal<boolean>(false);
  pipelineSearchQuery = signal<string>('');

  filteredPositionOptions = computed(() => {
    const q = this.pipelineSearchQuery().toLowerCase().trim();
    const list = this.positionOptions();
    if (!q) return list;
    return list.filter(p => p.toLowerCase().includes(q));
  });

  pipelineStageConfigs = [
    { key: 'sourced', label: 'Sourced', num: '1', icon: 'users', bgClass: 'bg-blue-50/60', borderClass: 'border-blue-200', textClass: 'text-blue-700', iconBgClass: 'bg-blue-100 text-blue-700' },
    { key: 'screening', label: 'Screening', num: '2', icon: 'filter', bgClass: 'bg-purple-50/60', borderClass: 'border-purple-200', textClass: 'text-purple-700', iconBgClass: 'bg-purple-100 text-purple-700' },
    { key: 'interviewed', label: 'Interviewed', num: '3', icon: 'activity', bgClass: 'bg-sky-50/60', borderClass: 'border-sky-200', textClass: 'text-sky-700', iconBgClass: 'bg-sky-100 text-sky-700' },
    { key: 'pipeline', label: 'Pipeline', num: '4', icon: 'kanban', bgClass: 'bg-indigo-50/60', borderClass: 'border-indigo-200', textClass: 'text-indigo-700', iconBgClass: 'bg-indigo-100 text-indigo-700' },
    { key: 'in_progress', label: 'In Progress', num: '5', icon: 'clock', bgClass: 'bg-amber-50/60', borderClass: 'border-amber-200', textClass: 'text-amber-700', iconBgClass: 'bg-amber-100 text-amber-700' },
    { key: 'shortlisted', label: 'Shortlisted', num: '6', icon: 'sparkles', bgClass: 'bg-emerald-50/60', borderClass: 'border-emerald-200', textClass: 'text-emerald-700', iconBgClass: 'bg-emerald-100 text-emerald-700' },
    { key: 'follow_up', label: 'Follow Up', num: '7', icon: 'phone', bgClass: 'bg-yellow-50/60', borderClass: 'border-yellow-200', textClass: 'text-yellow-700', iconBgClass: 'bg-yellow-100 text-yellow-700' },
    { key: 'rejected', label: 'Rejected', num: '8', icon: 'x', bgClass: 'bg-rose-50/60', borderClass: 'border-rose-200', textClass: 'text-rose-700', iconBgClass: 'bg-rose-100 text-rose-700' },
    { key: 'hired', label: 'Hired', num: '9', icon: 'check-circle', bgClass: 'bg-green-50/60', borderClass: 'border-green-200', textClass: 'text-green-700', iconBgClass: 'bg-green-100 text-green-700' },
  ];

  positionOptions = computed(() => {
    const titles = new Set<string>();
    for (const p of this.positionService.positions()) {
      if (p.title) titles.add(p.title);
    }
    for (const c of this.candidateService.candidates()) {
      if (c.positionTitle) titles.add(c.positionTitle);
    }
    return Array.from(titles).sort();
  });

  pipelineStageCounts = computed(() => {
    const filter = this.selectedPipelineFilter();
    const counts = {
      sourced: 0,
      screening: 0,
      interviewed: 0,
      pipeline: 0,
      in_progress: 0,
      shortlisted: 0,
      follow_up: 0,
      rejected: 0,
      hired: 0
    };

    if (!filter) return counts;

    const filterLower = filter.toLowerCase().trim();
    const candidates = this.candidateService.candidates().filter(c => {
      if (filter === 'ALL') return true;
      const titleLower = (c.positionTitle || '').toLowerCase().trim();
      return titleLower === filterLower;
    });

    // Sourced represents the total CV/application count for the position, irrespective of candidate status
    counts.sourced = candidates.length;

    for (const c of candidates) {
      // Mandatory Screening Priority Rule:
      // If TelleCalling_Time IS NOT NULL (and non-empty), MUST count as Screening and STOP further mapping!
      const tcTime = (c.telleCallingTime || '').trim();
      if (tcTime !== '' && tcTime !== 'null' && tcTime !== 'undefined') {
        counts.screening++;
        continue;
      }

      // TelleCalling_Time == NULL -> Apply status-based mapping
      const stage = (c.currentStage || '').toLowerCase().trim();
      const status = (c.status || '').toLowerCase().trim();
      const rawStatus = (c.rawStatus || '').toLowerCase().trim();
      const sRaw = `${stage} ${status} ${rawStatus}`;
      const sNorm = sRaw.replace(/[\s\-_]+/g, '');

      // Target explicit Future Hireable variants without overly broad includes('future')
      const isFutureHireable = sNorm.includes('futurehireable') || 
                               sNorm.includes('futurehirable') || 
                               /future[\s\-_]*(?:hireable|hirable)/i.test(sRaw);

      if (sNorm.includes('followup')) {
        counts.follow_up++;
      } else if (sNorm.includes('reject') || sNorm.includes('drop') || sNorm.includes('unsuitable') || sNorm.includes('notinterested') || isFutureHireable) {
        counts.rejected++;
      } else if (sNorm.includes('join') || sNorm.includes('offer') || sNorm.includes('accept') || sNorm.includes('hire') || sNorm.includes('success')) {
        counts.hired++;
      } else if (sNorm.includes('round') || sNorm.includes('inprogress') || sNorm.includes('process')) {
        counts.in_progress++;
      } else if (sNorm.includes('select') || sNorm.includes('shortlist') || sNorm.includes('approved') || sNorm.includes('telecall')) {
        counts.shortlisted++;
      } else if (sNorm.includes('interview') || sNorm.includes('manager')) {
        counts.interviewed++;
      } else if (sNorm.includes('screen')) {
        counts.screening++;
      } else if (sNorm.includes('pipeline')) {
        counts.pipeline++;
      }
    }

    return counts;
  });

  openPipelineModal() {
    this.selectedPipelineFilter.set('');
    this.pipelineSearchQuery.set('');
    this.isPipelineDropdownOpen.set(false);
    this.isPipelineModalOpen = true;
  }

  selectPipelinePosition(pos: string) {
    this.selectedPipelineFilter.set(pos);
    if (pos === '') {
      this.pipelineSearchQuery.set('');
    } else if (pos === 'ALL') {
      this.pipelineSearchQuery.set('All Positions');
    } else {
      this.pipelineSearchQuery.set(pos);
    }
    this.isPipelineDropdownOpen.set(false);
  }

  clearPipelineFilter() {
    this.selectedPipelineFilter.set('');
    this.pipelineSearchQuery.set('');
    this.isPipelineDropdownOpen.set(true);
  }

  getStageCount(key: string): number {
    const counts = this.pipelineStageCounts() as Record<string, number>;
    return counts[key] || 0;
  }

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

