import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PositionService } from '../../../core/services/position.service';
import { ToastService } from '../../../core/services/toast.service';
import { DEPARTMENTS, RECRUITERS_LIST } from '../../../core/constants/navigation.constant';
import { Position } from '../../../core/models/recruitment.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PriorityBadgeComponent } from '../../../shared/components/priority-badge/priority-badge.component';
import { SearchInputComponent } from '../../../shared/components/search-input/search-input.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { DrawerComponent } from '../../../shared/components/drawer/drawer.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';

@Component({
  selector: 'app-dashboard-control-tower',
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
    LoadingStateComponent
  ],
  template: `
    <div class="space-y-6">
      <app-page-header
        title="Recruitment Control Tower"
        subtitle="Position-wise headcount, priority, calculated funnel stages, SLA risks, and bottleneck action tracking."
      >
        <div badges class="flex items-center gap-2">
          <span class="text-xs font-mono font-semibold px-2.5 py-1 bg-red-50 text-red-700 rounded-full border border-red-200">
            {{ criticalP0Count() }} P0 Critical Roles
          </span>
        </div>

        <div actions class="flex items-center gap-2">
          <button 
            type="button" 
            (click)="exportReport()"
            class="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <app-icon name="download" [size]="14"></app-icon>
            Export Tower Report
          </button>
        </div>
      </app-page-header>

      <!-- Filter Controls Bar -->
      <div class="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
            class="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            <app-icon name="filter" [size]="14" class="text-brand-600"></app-icon>
            Filter Positions
            <span *ngIf="activeFilterCount() > 0" class="w-4.5 h-4.5 rounded-full bg-brand-500 text-white text-[10px] flex items-center justify-center font-bold">
              {{ activeFilterCount() }}
            </span>
          </button>

          <button
            *ngIf="activeFilterCount() > 0 || searchTerm()"
            type="button"
            (click)="resetFilters()"
            class="text-xs text-slate-500 hover:text-slate-800 font-bold px-2 py-1 cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      <!-- Decision Grid Read-Only Table -->
      <div class="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
        <app-loading-state *ngIf="positionService.isLoading()" type="table" [rows]="6"></app-loading-state>

        <div *ngIf="!positionService.isLoading()" class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th class="py-3.5 px-4">Position</th>
                <th class="py-3.5 px-3 text-center">Priority</th>
                <th class="py-3.5 px-3 text-center">Progress</th>
                <th class="py-3.5 px-3">Lead Recruiter</th>
                <th class="py-3.5 px-3 text-center">Status</th>
                <th class="py-3.5 px-4 text-right">View Detail</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              <tr 
                *ngFor="let pos of filteredPositions()"
                (click)="openDrawer(pos)"
                class="hover:bg-slate-50/80 transition-colors cursor-pointer group"
              >
                <!-- Position -->
                <td class="py-3.5 px-4 font-semibold text-slate-900">
                  <div class="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{{ pos.title }}</div>
                  <div class="text-[11px] text-slate-500 mt-0.5">{{ pos.department }} • Code: <span class="font-mono font-semibold">{{ pos.id }}</span></div>
                </td>

                <!-- Priority -->
                <td class="py-3.5 px-3 text-center">
                  <app-priority-badge [priority]="pos.priority"></app-priority-badge>
                </td>

                <!-- Progress -->
                <td class="py-3.5 px-3 text-center font-bold">
                  <span class="text-slate-900 font-mono text-xs">{{ pos.joinedHc }}</span>
                  <span class="text-slate-400 font-mono text-xs">/{{ pos.requiredHc }}</span>
                </td>

                <!-- Recruiter Owner -->
                <td class="py-3.5 px-3 font-semibold text-slate-900">
                  {{ pos.owner }}
                </td>

                <!-- Status -->
                <td class="py-3.5 px-3 text-center">
                  <app-status-badge [status]="pos.status"></app-status-badge>
                </td>

                <!-- Read Only View Trigger -->
                <td class="py-3.5 px-4 text-right" (click)="$event.stopPropagation()">
                  <div class="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      (click)="openDrawer(pos)"
                      class="px-4 py-2 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      View Details
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <app-empty-state
            *ngIf="filteredPositions().length === 0"
            title="No control tower positions match criteria"
            message="Please refine your search or filter configuration."
            actionLabel="Reset Grid Filters"
            (actionClick)="resetFilters()"
          ></app-empty-state>
        </div>
      </div>

      <!-- Slide-Over Drawer for Control Tower Details (Read-Only) -->
      <app-drawer
        [(isOpen)]="isDrawerOpen"
        [title]="selectedDrawerPosition?.title || ''"
        subtitle="Control Tower Operational Detail (Read-Only)"
        width="lg"
      >
        <div *ngIf="selectedDrawerPosition as pos" class="space-y-5 text-xs">
          <!-- Status Strip -->
          <div class="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div>
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Department</span>
              <span class="font-bold text-slate-900 mt-0.5 block">{{ pos.department }}</span>
            </div>
            <div class="flex items-center gap-2">
              <app-priority-badge [priority]="pos.priority"></app-priority-badge>
              <app-status-badge [status]="pos.status"></app-status-badge>
            </div>
          </div>

          <!-- Progress Breakdown -->
          <div class="p-4 bg-white rounded-xl border border-slate-200/80 space-y-2">
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Funnel Pipeline Breakdown</span>
            <div class="grid grid-cols-6 gap-1.5 text-center font-mono font-bold">
              <div class="bg-slate-100 p-2 rounded">
                <span class="text-[10px] text-slate-400 block font-normal">Src</span>
                {{ pos.funnelCounts.sourced }}
              </div>
              <div class="bg-slate-100 p-2 rounded">
                <span class="text-[10px] text-slate-400 block font-normal">Scr</span>
                {{ pos.funnelCounts.screened }}
              </div>
              <div class="bg-blue-50 text-blue-800 p-2 rounded">
                <span class="text-[10px] text-blue-600 block font-normal">Int</span>
                {{ pos.funnelCounts.interviewed }}
              </div>
              <div class="bg-purple-50 text-purple-800 p-2 rounded">
                <span class="text-[10px] text-purple-600 block font-normal">Sel</span>
                {{ pos.funnelCounts.selected }}
              </div>
              <div class="bg-amber-50 text-amber-800 p-2 rounded">
                <span class="text-[10px] text-amber-600 block font-normal">Off</span>
                {{ pos.funnelCounts.offered }}
              </div>
              <div class="bg-emerald-100 text-emerald-900 p-2 rounded">
                <span class="text-[10px] text-emerald-700 block font-normal">Jnd</span>
                {{ pos.funnelCounts.joined }}
              </div>
            </div>
          </div>

          <!-- Lead Recruiter & HM -->
          <div class="p-3.5 bg-white rounded-xl border border-slate-200/80 space-y-2">
            <div class="flex justify-between">
              <span class="text-slate-500 font-medium">Lead Recruiter Owner:</span>
              <span class="font-bold text-slate-900">{{ pos.owner }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500 font-medium">Hiring Manager:</span>
              <span class="font-bold text-slate-900">{{ pos.hiringManager }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500 font-medium">Target Closure Date:</span>
              <span class="font-bold text-slate-900 font-mono">{{ pos.targetDate }}</span>
            </div>
          </div>

          <!-- Bottleneck Section (Read-Only) -->
          <div *ngIf="pos.bottleneck" class="p-4 rounded-xl bg-red-50 border border-red-200 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-red-900 flex items-center gap-1.5">
                <app-icon name="alert-triangle" [size]="14"></app-icon>
                Active Operational Bottleneck
              </span>
              <span class="px-2.5 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold">
                {{ pos.bottleneck.slaStatus }}
              </span>
            </div>
            <p class="text-red-900 font-semibold">{{ pos.bottleneck.issue }}</p>
            <div class="text-[11px] text-red-700">Pending with: <strong>{{ pos.bottleneck.pendingWith }}</strong> ({{ pos.bottleneck.pendingSinceDays }} days)</div>
          </div>
        </div>

        <div footer class="flex items-center justify-between w-full">
          <button 
            type="button" 
            (click)="isDrawerOpen = false"
            class="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 border border-slate-200 rounded-xl bg-white cursor-pointer"
          >
            Close
          </button>

          <a
            *ngIf="selectedDrawerPosition"
            [routerLink]="['/recruitment/positions', selectedDrawerPosition.id]"
            (click)="isDrawerOpen = false"
            class="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            Full 360° Details
          </a>
        </div>
      </app-drawer>

      <!-- Filter Drawer -->
      <app-drawer
        [(isOpen)]="isFilterDrawerOpen"
        title="Control Tower Filters"
        subtitle="Filter operational grid positions."
        width="sm"
      >
        <div class="space-y-4 text-xs">
          <div>
            <label class="block font-bold text-slate-700 mb-1.5">Department</label>
            <select
              [ngModel]="selectedDepartment()"
              (ngModelChange)="selectedDepartment.set($event)"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
            >
              <option value="ALL">All Departments</option>
              <option *ngFor="let d of departments" [value]="d">{{ d }}</option>
            </select>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1.5">Priority</label>
            <select
              [ngModel]="selectedPriority()"
              (ngModelChange)="selectedPriority.set($event)"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
            >
              <option value="ALL">All Priorities</option>
              <option value="P0">P0 (Critical)</option>
              <option value="P1">P1 (High)</option>
              <option value="P2">P2 (Standard)</option>
            </select>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1.5">Health Status</label>
            <select
              [ngModel]="selectedStatus()"
              (ngModelChange)="selectedStatus.set($event)"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
            >
              <option value="ALL">All Statuses</option>
              <option value="On Track">GREEN — On Track</option>
              <option value="At Risk">AMBER — At Risk</option>
              <option value="Critical">RED — Critical</option>
            </select>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1.5">Lead Recruiter</label>
            <select
              [ngModel]="selectedOwner()"
              (ngModelChange)="selectedOwner.set($event)"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
            >
              <option value="ALL">All Owners</option>
              <option *ngFor="let r of recruiters" [value]="r.name">{{ r.name }}</option>
            </select>
          </div>
        </div>

        <div footer class="flex items-center justify-between w-full">
          <button
            type="button"
            (click)="resetFilters()"
            class="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 border border-slate-200 rounded-xl bg-white cursor-pointer"
          >
            Clear All
          </button>

          <button
            type="button"
            (click)="isFilterDrawerOpen = false"
            class="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer"
          >
            Apply Filters
          </button>
        </div>
      </app-drawer>
    </div>
  `
})
export class DashboardControlTowerComponent {
  positionService = inject(PositionService);
  private toastService = inject(ToastService);

  departments = DEPARTMENTS;
  recruiters = RECRUITERS_LIST;

  searchTerm = signal('');
  selectedDepartment = signal('ALL');
  selectedPriority = signal('ALL');
  selectedStatus = signal('ALL');
  selectedOwner = signal('ALL');

  isDrawerOpen = false;
  selectedDrawerPosition?: Position;

  isFilterDrawerOpen = false;

  criticalP0Count = computed(() => 
    this.positionService.positions().filter(p => p.priority === 'P0' && (p.status === 'Critical' || p.status === 'At Risk')).length
  );

  filteredPositions = computed(() => {
    const q = this.searchTerm().toLowerCase().trim();
    const dept = this.selectedDepartment();
    const prio = this.selectedPriority();
    const st = this.selectedStatus();
    const own = this.selectedOwner();

    return this.positionService.positions().filter(p => {
      const matchesSearch = !q ||
        p.title.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.owner.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q);

      const matchesDept = dept === 'ALL' || p.department === dept;
      const matchesPriority = prio === 'ALL' || p.priority === prio;
      const matchesStatus = st === 'ALL' || p.status === st;
      const matchesOwner = own === 'ALL' || p.owner === own;

      return matchesSearch && matchesDept && matchesPriority && matchesStatus && matchesOwner;
    });
  });

  activeFilterCount = computed(() => {
    let count = 0;
    if (this.selectedDepartment() !== 'ALL') count++;
    if (this.selectedPriority() !== 'ALL') count++;
    if (this.selectedStatus() !== 'ALL') count++;
    if (this.selectedOwner() !== 'ALL') count++;
    return count;
  });

  openDrawer(pos: Position) {
    this.selectedDrawerPosition = pos;
    this.isDrawerOpen = true;
  }

  exportReport() {
    this.toastService.info('Data Export', 'Control Tower executive data report downloaded.');
  }

  resetFilters() {
    this.searchTerm.set('');
    this.selectedDepartment.set('ALL');
    this.selectedPriority.set('ALL');
    this.selectedStatus.set('ALL');
    this.selectedOwner.set('ALL');
    this.isFilterDrawerOpen = false;
  }
}
