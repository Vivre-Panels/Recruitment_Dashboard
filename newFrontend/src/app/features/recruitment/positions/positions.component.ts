import { Component, computed, inject, signal } from '@angular/core';
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
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

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
    ViewSwitcherTabsComponent,
    LoadingStateComponent,
    PaginationComponent
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
            [value]="searchTerm()"
            (valueChange)="searchTerm.set($event)"
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
            *ngIf="activeFilterCount() > 0 || searchTerm()"
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
        <app-loading-state *ngIf="positionService.isLoading()" type="table" [rows]="6"></app-loading-state>

        <div *ngIf="!positionService.isLoading()" class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr>
                <th (click)="setSort('title')" class="app-table-th cursor-pointer hover:bg-slate-100 transition-colors select-none">
                  Position Title <span *ngIf="sortField() === 'title'">{{ sortDir() === 'asc' ? '↑' : '↓' }}</span>
                </th>
                <th (click)="setSort('department')" class="app-table-th cursor-pointer hover:bg-slate-100 transition-colors select-none">
                  Department <span *ngIf="sortField() === 'department'">{{ sortDir() === 'asc' ? '↑' : '↓' }}</span>
                </th>
                <th (click)="setSort('priority')" class="app-table-th text-center cursor-pointer hover:bg-slate-100 transition-colors select-none">
                  Priority <span *ngIf="sortField() === 'priority'">{{ sortDir() === 'asc' ? '↑' : '↓' }}</span>
                </th>
                <th (click)="setSort('requiredHc')" class="app-table-th text-center cursor-pointer hover:bg-slate-100 transition-colors select-none">
                  Headcount <span *ngIf="sortField() === 'requiredHc'">{{ sortDir() === 'asc' ? '↑' : '↓' }}</span>
                </th>
                <th (click)="setSort('targetDate')" class="app-table-th cursor-pointer hover:bg-slate-100 transition-colors select-none">
                  Target Date <span *ngIf="sortField() === 'targetDate'">{{ sortDir() === 'asc' ? '↑' : '↓' }}</span>
                </th>
                <th (click)="setSort('status')" class="app-table-th text-center cursor-pointer hover:bg-slate-100 transition-colors select-none">
                  Status <span *ngIf="sortField() === 'status'">{{ sortDir() === 'asc' ? '↑' : '↓' }}</span>
                </th>
                <th class="app-table-th text-right">View Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              <tr 
                *ngFor="let pos of paginatedPositions()"
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

          <!-- Pagination Controls -->
          <app-pagination
            [currentPage]="currentPage()"
            [pageSize]="pageSize()"
            [totalItems]="filteredPositions().length"
            (pageChange)="currentPage.set($event)"
            (pageSizeChange)="pageSize.set($event); currentPage.set(1)"
          ></app-pagination>

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
              [ngModel]="selectedDepartment()"
              (ngModelChange)="selectedDepartment.set($event)"
              class="app-input"
            >
              <option value="ALL">All Departments</option>
              <option *ngFor="let d of departments" [value]="d">{{ d }}</option>
            </select>
          </div>

          <div>
            <label class="app-label">Priority Level</label>
            <select
              [ngModel]="selectedPriority()"
              (ngModelChange)="selectedPriority.set($event)"
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

  searchTerm = signal('');
  selectedDepartment = signal('ALL');
  selectedPriority = signal('ALL');
  sortField = signal<'title' | 'department' | 'priority' | 'requiredHc' | 'targetDate' | 'status'>('title');
  sortDir = signal<'asc' | 'desc'>('asc');

  currentPage = signal(1);
  pageSize = signal(10);

  isDrawerOpen = false;
  selectedDrawerPosition?: Position;

  isFilterDrawerOpen = false;

  setSort(field: 'title' | 'department' | 'priority' | 'requiredHc' | 'targetDate' | 'status') {
    if (this.sortField() === field) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDir.set('asc');
    }
  }

  filteredPositions = computed(() => {
    const q = this.searchTerm().toLowerCase().trim();
    const dept = this.selectedDepartment();
    const prio = this.selectedPriority();

    const list = this.positionService.positions().filter(p => {
      const matchesSearch = !q ||
        p.title.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.owner.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q);

      const matchesDept = dept === 'ALL' || p.department === dept;
      const matchesPriority = prio === 'ALL' || p.priority === prio;

      return matchesSearch && matchesDept && matchesPriority;
    });

    const f = this.sortField();
    const dir = this.sortDir() === 'asc' ? 1 : -1;

    return list.sort((a, b) => {
      let valA: any = a[f as keyof Position] ?? '';
      let valB: any = b[f as keyof Position] ?? '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return -1 * dir;
      if (valA > valB) return 1 * dir;
      return 0;
    });
  });

  paginatedPositions = computed(() => {
    const list = this.filteredPositions();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  activeFilterCount = computed(() => {
    let count = 0;
    if (this.selectedDepartment() !== 'ALL') count++;
    if (this.selectedPriority() !== 'ALL') count++;
    return count;
  });

  openDrawer(pos: Position) {
    this.selectedDrawerPosition = pos;
    this.isDrawerOpen = true;
  }

  resetFilters() {
    this.searchTerm.set('');
    this.selectedDepartment.set('ALL');
    this.selectedPriority.set('ALL');
    this.sortField.set('title');
    this.sortDir.set('asc');
    this.isFilterDrawerOpen = false;
  }
}
