import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PositionService } from '../../../core/services/position.service';
import { DEPARTMENTS, RECRUITERS_LIST, HIRING_MANAGERS } from '../../../core/constants/navigation.constant';
import { Position } from '../../../core/models/recruitment.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PriorityBadgeComponent } from '../../../shared/components/priority-badge/priority-badge.component';
import { SearchInputComponent } from '../../../shared/components/search-input/search-input.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { DrawerComponent } from '../../../shared/components/drawer/drawer.component';
import { ViewSwitcherTabsComponent, ViewTab } from '../../../shared/components/view-switcher/view-switcher-tabs.component';

@Component({
  selector: 'app-recruitment-positions',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    PriorityBadgeComponent,
    SearchInputComponent,
    IconComponent,
    EmptyStateComponent,
    DrawerComponent,
    ViewSwitcherTabsComponent
  ],
  template: `
    <div class="app-page-container">
      <!-- Header with View Switcher Tabs -->
      <app-page-header
        title="Recruitment Module"
        subtitle="Active job requisitions, headcount allocations, hiring managers, and SLA deadlines."
      >
        <div actions class="flex flex-wrap items-center gap-3">
          <app-view-switcher-tabs [tabs]="recruitmentTabs"></app-view-switcher-tabs>
        </div>
      </app-page-header>

      <!-- Search & Filters Bar -->
      <div class="app-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex-1 max-w-md">
          <app-search-input
            [value]="searchTerm"
            (valueChange)="searchTerm = $event"
            placeholder="Search position title, ID, recruiter..."
          ></app-search-input>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="isFilterDrawerOpen = true"
            class="app-btn-secondary cursor-pointer"
          >
            <app-icon name="filter" [size]="14" class="text-brand-600"></app-icon>
            Filters
            <span *ngIf="activeFilterCount() > 0" class="w-4.5 h-4.5 rounded-full bg-brand-500 text-white text-[10px] flex items-center justify-center font-bold">
              {{ activeFilterCount() }}
            </span>
          </button>

          <button
            *ngIf="activeFilterCount() > 0 || searchTerm"
            type="button"
            (click)="resetFilters()"
            class="text-xs text-slate-500 hover:text-slate-800 font-semibold px-2 py-1 cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      <!-- Positions Directory Read-Only Table -->
      <div class="app-card p-0 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr>
                <th class="app-table-th">Position Title</th>
                <th class="app-table-th">Department</th>
                <th class="app-table-th text-center">Priority</th>
                <th class="app-table-th text-center">Headcount</th>
                <th class="app-table-th">Target Date</th>
                <th class="app-table-th text-center">Status</th>
                <th class="app-table-th text-right">View Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              <tr 
                *ngFor="let pos of filteredPositions()"
                (click)="openDrawer(pos)"
                class="hover:bg-slate-50/80 transition-colors cursor-pointer group"
              >
                <!-- Title & Code -->
                <td class="app-table-td font-semibold text-slate-900">
                  <div class="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{{ pos.title }}</div>
                  <div class="text-[11px] text-slate-500 mt-0.5">Code: <span class="font-mono font-semibold">{{ pos.id }}</span> • Owner: {{ pos.owner }}</div>
                </td>

                <!-- Department -->
                <td class="app-table-td font-medium text-slate-800">
                  {{ pos.department }}
                </td>

                <!-- Priority -->
                <td class="app-table-td text-center">
                  <app-priority-badge [priority]="pos.priority"></app-priority-badge>
                </td>

                <!-- Headcount -->
                <td class="app-table-td text-center font-bold">
                  <span class="text-emerald-700 font-mono text-xs">{{ pos.joinedHc }}</span>
                  <span class="text-slate-400 font-mono text-xs">/{{ pos.requiredHc }}</span>
                </td>

                <!-- Target Date -->
                <td class="app-table-td font-mono text-[11px] text-slate-600 whitespace-nowrap font-medium">
                  {{ pos.targetDate }}
                </td>

                <!-- Status -->
                <td class="app-table-td text-center">
                  <app-status-badge [status]="pos.status"></app-status-badge>
                </td>

                <!-- View Action -->
                <td class="app-table-td text-right" (click)="$event.stopPropagation()">
                  <div class="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      (click)="openDrawer(pos)"
                      class="px-3.5 py-1.5 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      Quick Summary
                    </button>
                    <a
                      [routerLink]="['/recruitment/positions', pos.id]"
                      class="px-3.5 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-800 font-bold rounded-lg text-xs transition-colors"
                    >
                      Full 360° View
                    </a>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <app-empty-state
            *ngIf="filteredPositions().length === 0"
            title="No positions match criteria"
            message="Please clear or update your search filter settings."
            actionLabel="Reset Filters"
            (actionClick)="resetFilters()"
          ></app-empty-state>
        </div>
      </div>

      <!-- Position Quick Drawer -->
      <app-drawer
        [(isOpen)]="isDrawerOpen"
        [title]="selectedDrawerPosition?.title || ''"
        subtitle="Quick Requisition Summary"
        width="lg"
      >
        <div *ngIf="selectedDrawerPosition as pos" class="space-y-6 text-xs">
          <!-- Status Strip -->
          <div class="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
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
          <div class="grid grid-cols-2 gap-4">
            <div class="p-4 bg-brand-50/50 rounded-xl border border-brand-200/60">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Headcount Fulfilled</span>
              <span class="text-base font-bold text-slate-900 font-mono mt-1 block">{{ pos.joinedHc }} / {{ pos.requiredHc }} Joined</span>
            </div>
            <div class="p-4 bg-blue-50/50 rounded-xl border border-blue-200/60">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Target Date</span>
              <span class="text-base font-bold text-slate-900 font-mono mt-1 block">{{ pos.targetDate }}</span>
            </div>
          </div>

          <!-- Lead Recruiter & HM -->
          <div class="p-4 bg-white rounded-xl border border-slate-200 space-y-2.5">
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
            class="app-btn-secondary cursor-pointer"
          >
            Close
          </button>

          <a
            *ngIf="selectedDrawerPosition"
            [routerLink]="['/recruitment/positions', selectedDrawerPosition.id]"
            (click)="isDrawerOpen = false"
            class="app-btn-primary"
          >
            Open Full 360° View
          </a>
        </div>
      </app-drawer>

      <!-- Filter Drawer -->
      <app-drawer
        [(isOpen)]="isFilterDrawerOpen"
        title="Position Filters"
        subtitle="Refine position list."
        width="sm"
      >
        <div class="space-y-5 text-xs">
          <div>
            <label class="app-label">Department</label>
            <select
              [(ngModel)]="selectedDepartment"
              class="app-input"
            >
              <option value="ALL">All Departments</option>
              <option *ngFor="let d of departments" [value]="d">{{ d }}</option>
            </select>
          </div>

          <div>
            <label class="app-label">Priority Level</label>
            <select
              [(ngModel)]="selectedPriority"
              class="app-input"
            >
              <option value="ALL">All Priorities</option>
              <option value="P0">P0 (Critical)</option>
              <option value="P1">P1 (High)</option>
              <option value="P2">P2 (Standard)</option>
            </select>
          </div>
        </div>

        <div footer class="flex items-center justify-between w-full">
          <button
            type="button"
            (click)="resetFilters()"
            class="app-btn-secondary cursor-pointer"
          >
            Clear All
          </button>

          <button
            type="button"
            (click)="isFilterDrawerOpen = false"
            class="app-btn-primary cursor-pointer"
          >
            Apply Filters
          </button>
        </div>
      </app-drawer>
    </div>
  `
})
export class RecruitmentPositionsComponent {
  positionService = inject(PositionService);

  recruitmentTabs: ViewTab[] = [
    { label: 'Positions List', icon: 'list', route: '/recruitment/positions' },
    { label: 'Pipeline Kanban', icon: 'kanban', route: '/recruitment/pipeline' },
    { label: 'Candidates List', icon: 'users', route: '/recruitment/candidates' },
    { label: 'Requirement Cards', icon: 'file-text', route: '/recruitment/requirements' },
    { label: 'Talent Bank List', icon: 'database', route: '/recruitment/talent-bank' }
  ];

  departments = DEPARTMENTS;
  recruiters = RECRUITERS_LIST;
  hiringManagers = HIRING_MANAGERS;

  searchTerm = '';
  selectedDepartment = 'ALL';
  selectedPriority = 'ALL';

  isDrawerOpen = false;
  selectedDrawerPosition?: Position;

  isFilterDrawerOpen = false;

  filteredPositions = computed(() => {
    return this.positionService.positions().filter(p => {
      const matchesSearch = !this.searchTerm ||
        p.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        p.owner.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesDept = this.selectedDepartment === 'ALL' || p.department === this.selectedDepartment;
      const matchesPriority = this.selectedPriority === 'ALL' || p.priority === this.selectedPriority;

      return matchesSearch && matchesDept && matchesPriority;
    });
  });

  activeFilterCount = computed(() => {
    let count = 0;
    if (this.selectedDepartment !== 'ALL') count++;
    if (this.selectedPriority !== 'ALL') count++;
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
    this.isFilterDrawerOpen = false;
  }
}
