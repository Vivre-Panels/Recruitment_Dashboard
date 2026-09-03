import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { PositionService } from '../../../core/services/position.service';
import { ToastService } from '../../../core/services/toast.service';
import { DEPARTMENTS, RECRUITERS_LIST } from '../../../core/constants/navigation.constant';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PriorityBadgeComponent } from '../../../shared/components/priority-badge/priority-badge.component';
import { SearchInputComponent } from '../../../shared/components/search-input/search-input.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { DrawerComponent } from '../../../shared/components/drawer/drawer.component';
import { environment } from '../../../../environments/environment';

export interface RequisitionItem {
  id: number | string;
  requisitionId: string;
  jobOpeningId: string;
  jobTitle: string;
  department: string;
  team?: string;
  noOfOpenings: number;
  openingDate: string;
  targetDate: string;
  recruiterName: string;
  hiringManager: string;
  priority: 'P0' | 'P1' | 'P2';
  status: string;
  salaryRange?: string;
  location?: string;
  experienceRequired?: string;
  jobDescription?: string;
  bottleneckType?: string;
  pendingSince?: string;
  remarks?: string;
  actionOwner?: string;
  createdAt?: string;
}

@Component({
  selector: 'app-recruitment-requisitions',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    PageHeaderComponent,
    KpiCardComponent,
    StatusBadgeComponent,
    PriorityBadgeComponent,
    SearchInputComponent,
    IconComponent,
    EmptyStateComponent,
    LoadingStateComponent,
    PaginationComponent,
    DrawerComponent
  ],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto">
      <!-- Page Header -->
      <app-page-header
        title="All Requisitions"
        subtitle="Complete enterprise repository of all active, in-progress, and fulfilled job requisitions."
      >
        <div badges class="flex items-center gap-2">
          <span class="text-xs font-mono font-semibold px-2.5 py-0.5 bg-brand-50 text-brand-700 rounded-full border border-brand-200">
            {{ totalRequisitionsCount() }} Requisitions Recorded
          </span>
        </div>
      </app-page-header>

      <!-- Skeleton KPI Loader -->
      <app-loading-state *ngIf="isLoading()" type="kpis"></app-loading-state>

      <!-- KPI Overview Cards -->
      <div *ngIf="!isLoading()" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <app-kpi-card
          title="Total Requisitions"
          [value]="totalRequisitionsCount()"
          subtitle="All logged job requests"
          icon="briefcase"
          accent="brand"
        ></app-kpi-card>

        <app-kpi-card
          title="Open Requisitions"
          [value]="openRequisitionsCount()"
          subtitle="Actively hiring"
          icon="clock"
          accent="warning"
        ></app-kpi-card>

        <app-kpi-card
          title="Total Required HC"
          [value]="totalRequiredHc()"
          subtitle="Headcount positions required"
          icon="users"
          accent="info"
        ></app-kpi-card>

        <app-kpi-card
          title="P0 Critical Roles"
          [value]="p0Count()"
          subtitle="High priority positions"
          icon="alert-triangle"
          accent="danger"
        ></app-kpi-card>
      </div>

      <!-- Filters Bar -->
      <div class="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-3">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex-1 max-w-md">
            <app-search-input
              [value]="searchTerm()"
              (valueChange)="onSearchChange($event)"
              placeholder="Search by Requisition ID, Job Title, Owner, Manager..."
            ></app-search-input>
          </div>

          <div class="flex items-center gap-2">
            <button
              *ngIf="searchTerm() || selectedDepartment() !== 'ALL' || selectedPriority() !== 'ALL' || selectedStatus() !== 'ALL'"
              type="button"
              (click)="resetFilters()"
              class="text-xs font-semibold text-slate-500 hover:text-slate-900 px-3 py-2 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Department</label>
            <select
              [ngModel]="selectedDepartment()"
              (ngModelChange)="onDeptChange($event)"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="ALL">All Departments</option>
              <option *ngFor="let d of departments" [value]="d">{{ d }}</option>
            </select>
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Priority</label>
            <select
              [ngModel]="selectedPriority()"
              (ngModelChange)="onPriorityChange($event)"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="P0">P0 (Critical)</option>
              <option value="P1">P1 (High)</option>
              <option value="P2">P2 (Normal)</option>
            </select>
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
            <select
              [ngModel]="selectedStatus()"
              (ngModelChange)="onStatusChange($event)"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="Open">Open / Active</option>
              <option value="Closed">Closed / Fulfilled</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Skeleton Table Loader -->
      <app-loading-state *ngIf="isLoading()" type="table"></app-loading-state>

      <!-- Requisitions Reusable Table -->
      <div *ngIf="!isLoading()" class="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th class="py-3.5 px-4">Req / Job ID</th>
                <th class="py-3.5 px-4">Position</th>
                <th class="py-3.5 px-3">Department</th>
                <th class="py-3.5 px-3">Team</th>
                <th class="py-3.5 px-3 text-center">Required HC</th>
                <th class="py-3.5 px-3 text-center">Priority</th>
                <th class="py-3.5 px-3">Recruiter & Manager</th>
                <th class="py-3.5 px-3">Target Date</th>
                <th class="py-3.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              <tr
                *ngFor="let req of paginatedRequisitions()"
                class="hover:bg-slate-50/80 transition-colors cursor-pointer"
                (click)="openQuickView(req)"
              >
                <!-- Req ID -->
                <td class="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                  <div>{{ req.requisitionId || ('REQ-' + req.id) }}</div>
                  <div class="text-[10px] text-slate-400 font-normal mt-0.5">Job: {{ req.jobOpeningId }}</div>
                </td>

                <!-- Position -->
                <td class="py-3.5 px-4 font-bold text-slate-900">
                  {{ req.jobTitle }}
                </td>

                <!-- Department -->
                <td class="py-3.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                  {{ req.department }}
                </td>

                <!-- Team -->
                <td class="py-3.5 px-3 font-medium text-slate-600 whitespace-nowrap">
                  {{ req.team || '—' }}
                </td>

                <!-- Required HC -->
                <td class="py-3.5 px-3 text-center font-mono font-bold text-slate-900">
                  {{ req.noOfOpenings }} HC
                </td>

                <!-- Priority -->
                <td class="py-3.5 px-3 text-center">
                  <app-priority-badge [priority]="req.priority"></app-priority-badge>
                </td>

                <!-- Recruiter & Hiring Manager -->
                <td class="py-3.5 px-3">
                  <div class="font-semibold text-slate-900">{{ req.recruiterName || 'Unassigned' }}</div>
                  <div class="text-[10px] text-slate-500 mt-0.5">HM: {{ req.hiringManager || 'Not Specified' }}</div>
                </td>

                <!-- Target Date -->
                <td class="py-3.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                  {{ req.targetDate || 'TBD' }}
                </td>

                <!-- Status -->
                <td class="py-3.5 px-3 text-center">
                  <app-status-badge [status]="req.status"></app-status-badge>
                </td>
              </tr>
            </tbody>
          </table>

          <app-empty-state
            *ngIf="filteredRequisitions().length === 0"
            title="No requisitions found"
            message="No requisition records match your search query or filters."
            actionLabel="Reset Filters"
            (actionClick)="resetFilters()"
          ></app-empty-state>

          <!-- Reusable Pagination Component -->
          <app-pagination
            *ngIf="filteredRequisitions().length > 0"
            [totalItems]="filteredRequisitions().length"
            [currentPage]="currentPage()"
            [pageSize]="pageSize()"
            (pageChange)="onPageChange($event)"
            (pageSizeChange)="onPageSizeChange($event)"
          ></app-pagination>
        </div>
      </div>

      <!-- Quick View Requisition Drawer -->
      <app-drawer
        [(isOpen)]="isDrawerOpen"
        [title]="selectedReq?.jobTitle || 'Requisition Detail'"
        [subtitle]="'Requisition ID: ' + (selectedReq?.requisitionId || selectedReq?.id)"
        width="lg"
      >
        <div *ngIf="selectedReq as r" class="space-y-5 text-xs">
          <!-- Status Banner -->
          <div class="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Department</span>
              <span class="font-bold text-slate-900 text-sm mt-0.5 block">{{ r.department }}</span>
            </div>
            <div class="flex items-center gap-2">
              <app-priority-badge [priority]="r.priority"></app-priority-badge>
              <app-status-badge [status]="r.status"></app-status-badge>
            </div>
          </div>

          <!-- Key Metadata Grid -->
          <div class="grid grid-cols-2 gap-3 p-4 bg-white rounded-xl border border-slate-200/80">
            <div>
              <span class="text-slate-400 text-[10px] font-bold uppercase block">Job Opening ID</span>
              <span class="font-mono font-bold text-slate-900">{{ r.jobOpeningId }}</span>
            </div>
            <div>
              <span class="text-slate-400 text-[10px] font-bold uppercase block">Required Openings</span>
              <span class="font-mono font-bold text-slate-900">{{ r.noOfOpenings }} Openings</span>
            </div>
            <div>
              <span class="text-slate-400 text-[10px] font-bold uppercase block">Recruiter Owner</span>
              <span class="font-bold text-slate-900">{{ r.recruiterName || 'Unassigned' }}</span>
            </div>
            <div>
              <span class="text-slate-400 text-[10px] font-bold uppercase block">Hiring Manager</span>
              <span class="font-bold text-slate-900">{{ r.hiringManager || 'Not Specified' }}</span>
            </div>
            <div>
              <span class="text-slate-400 text-[10px] font-bold uppercase block">Opening Date</span>
              <span class="font-mono text-slate-700">{{ r.openingDate || 'N/A' }}</span>
            </div>
            <div>
              <span class="text-slate-400 text-[10px] font-bold uppercase block">Target Joining Date</span>
              <span class="font-mono text-slate-700">{{ r.targetDate || 'N/A' }}</span>
            </div>
          </div>

          <!-- Additional Information -->
          <div *ngIf="r.jobDescription || r.remarks" class="space-y-3">
            <span class="font-bold text-slate-900 block">Job Description & Remarks</span>
            <p class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 leading-relaxed">
              {{ r.remarks || r.jobDescription || 'No detailed description specified.' }}
            </p>
          </div>
        </div>

        <div footer class="flex items-center justify-between w-full">
          <button
            type="button"
            (click)="isDrawerOpen = false"
            class="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg bg-white cursor-pointer"
          >
            Close
          </button>
          <a
            *ngIf="selectedReq"
            [routerLink]="['/recruitment/positions', selectedReq.jobOpeningId || selectedReq.requisitionId]"
            (click)="isDrawerOpen = false"
            class="px-4 py-2 text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-lg shadow-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            View Full Requisition Dashboard →
          </a>
        </div>
      </app-drawer>
    </div>
  `
})
export class RecruitmentRequisitionsComponent implements OnInit {
  private http = inject(HttpClient);
  private positionService = inject(PositionService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  requisitions = signal<RequisitionItem[]>([]);
  isLoading = signal<boolean>(true);
  departments = DEPARTMENTS;

  searchTerm = signal('');
  selectedDepartment = signal('ALL');
  selectedPriority = signal('ALL');
  selectedStatus = signal('ALL');

  currentPage = signal(1);
  pageSize = signal(10);

  isDrawerOpen = false;
  selectedReq?: RequisitionItem;

  ngOnInit() {
    this.loadRequisitions();
  }

  loadRequisitions() {
    this.isLoading.set(true);
    this.http.get<{ success: boolean; data: any[] }>(`${environment.apiUrl}/requisitions`).subscribe({
      next: (res) => {
        if (res.success && res.data && res.data.length > 0) {
          const mapped: RequisitionItem[] = res.data.map(item => ({
            id: item.id || item.Id,
            requisitionId: item.requisition_id || item.Requisition_ID || `REQ-${item.id || item.Id}`,
            jobOpeningId: item.job_opening_id || item.Job_Opening_ID || `JOB-${item.id || item.Id}`,
            jobTitle: item.job_title || item.Job_Title || 'Untitled Position',
            department: item.department || item.Department || 'Engineering',
            team: item.team || item.Team || item.Team_Name || '',
            noOfOpenings: item.no_of_openings || item.No_Of_Openings || 1,
            openingDate: item.opening_date || item.Opening_Date || '',
            targetDate: item.target_date || item.Target_Date || '',
            recruiterName: item.recruiter_name || item.Recruiter_Name || '',
            hiringManager: item.hiring_manager || item.Hiring_Manager || '',
            priority: (item.priority || item.Priority || 'P1') as any,
            status: item.status || item.Status || 'Open',
            salaryRange: item.salary_range || item.Salary_Range,
            location: item.location || item.Location,
            experienceRequired: item.experience_required || item.Experience_Required,
            jobDescription: item.job_description || item.Job_Description,
            bottleneckType: item.bottleneck_type || item.Bottleneck_Type,
            pendingSince: item.pending_since || item.Pending_Since,
            remarks: item.remarks || item.Remarks,
            actionOwner: item.action_owner || item.Action_Owner,
            createdAt: item.created_at || item.CreatedAt
          }));
          this.requisitions.set(mapped);
        } else {
          this.fallbackFromPositions();
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.warn('Requisitions API connection failed, falling back to position state:', err);
        this.fallbackFromPositions();
        this.isLoading.set(false);
      }
    });
  }

  private fallbackFromPositions() {
    const positions = this.positionService.positions();
    const mapped: RequisitionItem[] = positions.map(p => ({
      id: p.id,
      requisitionId: `REQ-${p.id}`,
      jobOpeningId: p.id,
      jobTitle: p.title,
      department: p.department,
      team: p.team || '',
      noOfOpenings: p.requiredHc,
      openingDate: p.createdAt,
      targetDate: p.targetDate,
      recruiterName: p.owner,
      hiringManager: p.hiringManager,
      priority: p.priority as any,
      status: p.status === 'Critical' ? 'At Risk' : 'Open',
      salaryRange: p.salaryRange,
      location: p.location,
      experienceRequired: p.experienceRange,
      jobDescription: p.description
    }));
    this.requisitions.set(mapped);
  }

  filteredRequisitions = computed(() => {
    const q = this.searchTerm().toLowerCase().trim();
    const dept = this.selectedDepartment();
    const prio = this.selectedPriority();
    const st = this.selectedStatus();

    return this.requisitions().filter(r => {
      const matchesSearch = !q ||
        r.jobTitle.toLowerCase().includes(q) ||
        r.requisitionId.toLowerCase().includes(q) ||
        r.jobOpeningId.toLowerCase().includes(q) ||
        r.recruiterName.toLowerCase().includes(q) ||
        r.hiringManager.toLowerCase().includes(q);

      const matchesDept = dept === 'ALL' || r.department === dept;
      const matchesPrio = prio === 'ALL' || r.priority === prio;
      const matchesStatus = st === 'ALL' ||
        (st === 'Open' ? (r.status === 'Open' || !r.status || r.status === 'On Track') : r.status === st);

      return matchesSearch && matchesDept && matchesPrio && matchesStatus;
    });
  });

  paginatedRequisitions = computed(() => {
    const list = this.filteredRequisitions();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  totalRequisitionsCount = computed(() => this.requisitions().length);

  openRequisitionsCount = computed(() => 
    this.requisitions().filter(r => r.status === 'Open' || !r.status || r.status === 'On Track').length
  );

  totalRequiredHc = computed(() => 
    this.requisitions().reduce((sum, r) => sum + (r.noOfOpenings || 1), 0)
  );

  p0Count = computed(() => 
    this.requisitions().filter(r => r.priority === 'P0').length
  );

  onSearchChange(val: string) {
    this.searchTerm.set(val);
    this.currentPage.set(1);
  }

  onDeptChange(val: string) {
    this.selectedDepartment.set(val);
    this.currentPage.set(1);
  }

  onPriorityChange(val: string) {
    this.selectedPriority.set(val);
    this.currentPage.set(1);
  }

  onStatusChange(val: string) {
    this.selectedStatus.set(val);
    this.currentPage.set(1);
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
  }

  onPageSizeChange(size: number) {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  openQuickView(req: RequisitionItem) {
    this.selectedReq = req;
    this.isDrawerOpen = true;
  }

  resetFilters() {
    this.searchTerm.set('');
    this.selectedDepartment.set('ALL');
    this.selectedPriority.set('ALL');
    this.selectedStatus.set('ALL');
    this.currentPage.set(1);
  }
}
