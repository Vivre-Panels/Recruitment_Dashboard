import { Component, computed, HostListener, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../core/services/toast.service';
import { RecruitmentLookupsService } from '../../../core/services/recruitment-lookups.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
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
  noOfOpenings: number | null;
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
    <div class="h-full min-h-0 flex flex-col gap-2 max-w-7xl mx-auto">
      <!-- Page Header -->
      <app-page-header
        [compact]="true"
        title="All Requisitions"
      >
        <div actions>
          <button
            type="button"
            (click)="filtersVisible.update(open => !open)"
            [attr.aria-expanded]="filtersVisible()"
            aria-controls="requisition-filters"
            class="h-9 px-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800 transition-colors"
          >
            <app-icon name="filter" [size]="16" class="text-brand-600"></app-icon>
            <span>Filters</span>
            <span *ngIf="activeFilterCount() > 0" class="min-w-5 h-5 px-1 rounded-full bg-brand-600 text-white text-[10px] inline-flex items-center justify-center">{{ activeFilterCount() }}</span>
          </button>
        </div>
      </app-page-header>

      <!-- Filters Bar -->
      <div *ngIf="filtersVisible()" id="requisition-filters" class="p-3 bg-white border border-slate-200/90 rounded-2xl shadow-2xs shrink-0">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] gap-2 text-xs">
          <div class="min-w-0">
            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Search</label>
            <app-search-input
              class="block w-full [&>div]:max-w-none [&_input]:py-1.5"
              [value]="searchTerm()"
              (valueChange)="onSearchChange($event)"
              placeholder="Search by Requisition ID, Job Title, Owner, Manager..."
            ></app-search-input>
          </div>

          <div class="relative min-w-0" data-filter-dropdown>
            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Department</label>
            <button
              type="button"
              (click)="toggleFilterDropdown('department')"
              [attr.aria-expanded]="openFilterDropdown() === 'department'"
              aria-haspopup="listbox"
              class="w-full h-8 px-3 flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-sm hover:border-brand-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            >
              <span class="truncate">{{ selectedDepartment() === 'ALL' ? 'All Departments' : selectedDepartment() }}</span>
              <app-icon name="chevron-down" [size]="14" class="text-slate-400 shrink-0"></app-icon>
            </button>
            <div *ngIf="openFilterDropdown() === 'department'" role="listbox" class="absolute left-0 right-0 top-full mt-2 z-40 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10 ring-1 ring-black/5">
              <button
                *ngFor="let department of departmentOptions()"
                type="button"
                role="option"
                [attr.aria-selected]="selectedDepartment() === department.value"
                (click)="onDeptChange(department.value)"
                class="w-full px-2.5 py-2 flex items-center justify-between gap-2 rounded-lg text-left text-xs transition-colors"
                [ngClass]="selectedDepartment() === department.value ? 'bg-brand-100 text-brand-800 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
              >
                <span class="truncate">{{ department.label }}</span>
                <app-icon *ngIf="selectedDepartment() === department.value" name="check" [size]="14" class="text-brand-600 shrink-0"></app-icon>
              </button>
            </div>
          </div>

          <div class="relative min-w-0" data-filter-dropdown>
            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Priority</label>
            <button
              type="button"
              (click)="toggleFilterDropdown('priority')"
              [attr.aria-expanded]="openFilterDropdown() === 'priority'"
              aria-haspopup="listbox"
              class="w-full h-8 px-3 flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-sm hover:border-brand-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            >
              <span class="truncate">{{ priorityLabel(selectedPriority()) }}</span>
              <app-icon name="chevron-down" [size]="14" class="text-slate-400 shrink-0"></app-icon>
            </button>
            <div *ngIf="openFilterDropdown() === 'priority'" role="listbox" class="absolute left-0 right-0 top-full mt-2 z-40 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10 ring-1 ring-black/5">
              <button
                *ngFor="let option of priorityOptions()"
                type="button"
                role="option"
                [attr.aria-selected]="selectedPriority() === option.value"
                (click)="onPriorityChange(option.value)"
                class="w-full px-2.5 py-2 flex items-center justify-between gap-2 rounded-lg text-left text-xs transition-colors"
                [ngClass]="selectedPriority() === option.value ? 'bg-brand-100 text-brand-800 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
              >
                <span class="truncate">{{ option.label }}</span>
                <app-icon *ngIf="selectedPriority() === option.value" name="check" [size]="14" class="text-brand-600 shrink-0"></app-icon>
              </button>
            </div>
          </div>

          <div class="relative min-w-0" data-filter-dropdown>
            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Status</label>
            <button
              type="button"
              (click)="toggleFilterDropdown('status')"
              [attr.aria-expanded]="openFilterDropdown() === 'status'"
              aria-haspopup="listbox"
              class="w-full h-8 px-3 flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-sm hover:border-brand-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            >
              <span class="truncate">{{ statusLabel(selectedStatus()) }}</span>
              <app-icon name="chevron-down" [size]="14" class="text-slate-400 shrink-0"></app-icon>
            </button>
            <div *ngIf="openFilterDropdown() === 'status'" role="listbox" class="absolute left-0 right-0 top-full mt-2 z-40 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10 ring-1 ring-black/5">
              <button
                *ngFor="let option of statusOptions()"
                type="button"
                role="option"
                [attr.aria-selected]="selectedStatus() === option.value"
                (click)="onStatusChange(option.value)"
                class="w-full px-2.5 py-2 flex items-center justify-between gap-2 rounded-lg text-left text-xs transition-colors"
                [ngClass]="selectedStatus() === option.value ? 'bg-brand-100 text-brand-800 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
              >
                <span class="truncate">{{ option.label }}</span>
                <app-icon *ngIf="selectedStatus() === option.value" name="check" [size]="14" class="text-brand-600 shrink-0"></app-icon>
              </button>
            </div>
          </div>
          <div class="min-w-0 flex items-end">
            <button
              type="button"
              (click)="resetFilters()"
              [disabled]="!searchTerm() && selectedDepartment() === 'ALL' && selectedPriority() === 'ALL' && selectedStatus() === 'ALL'"
              title="Reset filters"
              aria-label="Reset filters"
              class="h-8 min-w-[72px] px-2 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              <app-icon name="rotate-ccw" [size]="16"></app-icon>
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Skeleton Table Loader -->
      <app-loading-state *ngIf="isLoading()" type="table" class="flex-1 min-h-0"></app-loading-state>

      <!-- Requisitions Reusable Table -->
      <div *ngIf="!isLoading()" class="flex-1 min-h-0 flex flex-col bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
        <div class="requisitions-table-viewport flex-1 min-h-0 overflow-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead class="sticky top-0 z-10 bg-slate-100">
              <tr class="border-b border-slate-200 bg-slate-100 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th class="py-2.5 px-3">Requisition ID</th>
                <th class="py-2.5 px-3">Department</th>
                <th class="py-2.5 px-3">Team</th>
                <th class="py-2.5 px-3">Job Title</th>
                <th class="py-2.5 px-3 text-center">No of Openings</th>
                <th class="py-2.5 px-3">Opening Date</th>
                <th class="py-2.5 px-3">Target Date</th>
                <th class="py-2.5 px-3">Recruiter Name</th>
                <th class="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              <tr
                *ngFor="let req of paginatedRequisitions()"
                class="hover:bg-brand-50/70 transition-colors cursor-pointer"
                (click)="openQuickView(req)"
              >
                <!-- Requisition ID -->
                <td class="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                  {{ req.requisitionId || '—' }}
                </td>

                <!-- Department -->
                <td class="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                  {{ req.department || '—' }}
                </td>

                <!-- Team -->
                <td class="py-2.5 px-3 font-medium text-slate-600 whitespace-nowrap">
                  {{ req.team || '—' }}
                </td>

                <!-- Job Title -->
                <td class="py-2.5 px-3 font-bold text-slate-900">
                  {{ req.jobTitle || '—' }}
                </td>

                <!-- Number of Openings -->
                <td class="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                  {{ req.noOfOpenings }}
                </td>

                <!-- Opening Date -->
                <td class="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                  {{ req.openingDate || '—' }}
                </td>

                <!-- Target Date -->
                <td class="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                  {{ req.targetDate || '—' }}
                </td>

                <!-- Recruiter Name -->
                <td class="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                  {{ req.recruiterName || 'Unassigned' }}
                </td>

                <!-- Status -->
                <td class="py-2.5 px-3 text-center">
                  <span
                    class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide border whitespace-nowrap"
                    [ngClass]="requisitionStatusClass(req.status)"
                  >
                    <span class="w-2 h-2 rounded-full" [ngClass]="requisitionStatusDotClass(req.status)"></span>
                    {{ req.status || 'Unknown' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          <app-empty-state
            *ngIf="filteredRequisitions().length === 0"
            title="No requisitions found"
            message="No requisition records match your search query or filters."
            actionLabel="Reset Filters"
            actionIcon="rotate-ccw"
            (actionClick)="resetFilters()"
          ></app-empty-state>

        </div>
        <app-pagination
          *ngIf="filteredRequisitions().length > 0"
          class="block shrink-0"
          [totalItems]="filteredRequisitions().length"
          [currentPage]="currentPage()"
          [pageSize]="pageSize()"
          (pageChange)="onPageChange($event)"
          (pageSizeChange)="onPageSizeChange($event)"
        ></app-pagination>
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
  private toastService = inject(ToastService);
  private router = inject(Router);
  private lookups = inject(RecruitmentLookupsService);

  requisitions = signal<RequisitionItem[]>([]);
  isLoading = signal<boolean>(true);
  departmentOptions = computed(() => [
    { value: 'ALL', label: 'All Departments' },
    ...this.lookups.departments().map(department => ({ value: department, label: department }))
  ]);
  priorityOptions = computed(() => [
    { value: 'ALL', label: 'All Priorities' },
    ...this.lookups.priorities().map(value => ({ value, label: value }))
  ]);
  statusOptions = computed(() => [
    { value: 'ALL', label: 'All Statuses' },
    ...this.lookups.statuses().map(value => ({ value, label: value }))
  ]);

  searchTerm = signal('');
  selectedDepartment = signal('ALL');
  selectedPriority = signal('ALL');
  selectedStatus = signal('ALL');
  filtersVisible = signal(false);
  activeFilterCount = computed(() => [
    this.searchTerm().trim().length > 0,
    this.selectedDepartment() !== 'ALL',
    this.selectedPriority() !== 'ALL',
    this.selectedStatus() !== 'ALL'
  ].filter(Boolean).length);
  openFilterDropdown = signal<'department' | 'priority' | 'status' | null>(null);

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
            requisitionId: item.requisition_id ?? item.Requisition_ID ?? '',
            jobOpeningId: item.job_opening_id || item.Job_Opening_ID || `JOB-${item.id || item.Id}`,
            jobTitle: item.job_title ?? item.Job_Title ?? '',
            department: item.department ?? item.Department ?? '',
            team: item.team || item.Team || item.Team_Name || '',
            noOfOpenings: item.no_of_openings ?? item.No_Of_Openings ?? null,
            openingDate: item.opening_date || item.Opening_Date || '',
            targetDate: item.target_date || item.Target_Date || '',
            recruiterName: item.recruiter_name || item.Recruiter_Name || '',
            hiringManager: item.hiring_manager || item.Hiring_Manager || '',
            priority: (item.priority || item.Priority || '') as any,
            status: item.status ?? item.Status ?? '',
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
          this.requisitions.set([]);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.warn('Requisitions API connection failed:', err);
        this.requisitions.set([]);
        this.isLoading.set(false);
      }
    });
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
        (st === 'Open' ? (r.status === 'Open' || r.status === 'In-progress' || !r.status || r.status === 'On Track') : r.status.toLowerCase() === st.toLowerCase());

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

  priorityLabel(value: string): string {
    return this.priorityOptions().find(option => option.value === value)?.label || 'All Priorities';
  }

  statusLabel(value: string): string {
    return this.statusOptions().find(option => option.value === value)?.label || 'All Statuses';
  }

  toggleFilterDropdown(dropdown: 'department' | 'priority' | 'status') {
    this.openFilterDropdown.update(current => current === dropdown ? null : dropdown);
  }

  @HostListener('document:click', ['$event'])
  closeFilterDropdownOnOutsideClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('[data-filter-dropdown]')) {
      this.openFilterDropdown.set(null);
    }
  }

  onSearchChange(val: string) {
    this.searchTerm.set(val);
    this.currentPage.set(1);
  }

  onDeptChange(val: string) {
    this.selectedDepartment.set(val);
    this.openFilterDropdown.set(null);
    this.currentPage.set(1);
  }

  onPriorityChange(val: string) {
    this.selectedPriority.set(val);
    this.openFilterDropdown.set(null);
    this.currentPage.set(1);
  }

  onStatusChange(val: string) {
    this.selectedStatus.set(val);
    this.openFilterDropdown.set(null);
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
    this.openFilterDropdown.set(null);
    this.currentPage.set(1);
  }

  requisitionStatusClass(status: string): string {
    switch ((status || '').trim().toLowerCase()) {
      case 'open':
      case 'active':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'in-progress':
      case 'in progress':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'on hold':
      case 'on-hold':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'closed':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'fulfilled':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      case 'cancelled':
      case 'canceled':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-violet-50 text-violet-800 border-violet-200';
    }
  }

  requisitionStatusDotClass(status: string): string {
    switch ((status || '').trim().toLowerCase()) {
      case 'open':
      case 'active': return 'bg-emerald-500';
      case 'in-progress':
      case 'in progress': return 'bg-blue-500';
      case 'on hold':
      case 'on-hold': return 'bg-amber-500';
      case 'closed':
        return 'bg-slate-500';
      case 'fulfilled': return 'bg-teal-500';
      case 'cancelled':
      case 'canceled': return 'bg-rose-500';
      default: return 'bg-violet-500';
    }
  }
}
