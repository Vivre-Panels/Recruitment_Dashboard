import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { BreadcrumbsComponent } from '../breadcrumbs/breadcrumbs.component';
import { ToastContainerComponent } from '../../shared/components/toast/toast.component';
import { DrawerComponent } from '../../shared/components/drawer/drawer.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { PositionService } from '../../core/services/position.service';
import { ToastService } from '../../core/services/toast.service';
import { DEPARTMENTS, HIRING_MANAGERS, RECRUITERS_LIST } from '../../core/constants/navigation.constant';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    SidebarComponent,
    HeaderComponent,
    BreadcrumbsComponent,
    ToastContainerComponent,
    DrawerComponent,
    IconComponent
  ],
  template: `
    <div class="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      <!-- Sidebar -->
      <app-sidebar 
        [(isCollapsed)]="isSidebarCollapsed"
        class="hidden md:flex sticky top-0 h-screen"
      ></app-sidebar>

      <!-- Mobile Sidebar Overlay Drawer -->
      <div 
        *ngIf="isMobileSidebarOpen"
        class="md:hidden fixed inset-0 z-50 flex"
      >
        <div 
          class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          (click)="isMobileSidebarOpen = false"
        ></div>
        <div class="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900">
          <app-sidebar [isCollapsed]="false"></app-sidebar>
        </div>
      </div>

      <!-- Main Layout Container -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden min-h-screen">
        <!-- Topbar Header -->
        <app-header
          (toggleSidebar)="isMobileSidebarOpen = !isMobileSidebarOpen"
          (openCreatePosition)="isCreatePositionOpen = true"
        ></app-header>

        <!-- Main Content Area -->
        <main class="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <app-breadcrumbs></app-breadcrumbs>
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- Global Toast Alerts -->
      <app-toast-container></app-toast-container>

      <!-- Global "+ Create Position" Drawer -->
      <app-drawer
        [(isOpen)]="isCreatePositionOpen"
        title="Create New Position Vacancy"
        subtitle="Specify headcount, timeline, skills, and knockout parameters."
        width="xl"
      >
        <form [formGroup]="positionForm" (ngSubmit)="submitPosition()" class="space-y-4 text-xs sm:text-sm">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Position Title -->
            <div class="md:col-span-2">
              <label class="block font-semibold text-slate-700 mb-1">Position Title *</label>
              <input 
                type="text" 
                formControlName="title"
                placeholder="e.g. Senior Distributed Systems Engineer"
                class="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-900"
              />
            </div>

            <!-- Department -->
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Department *</label>
              <select 
                formControlName="department"
                class="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-900"
              >
                <option *ngFor="let dep of departments" [value]="dep">{{ dep }}</option>
              </select>
            </div>

            <!-- Required Headcount -->
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Required Headcount (HC) *</label>
              <input 
                type="number" 
                formControlName="requiredHc"
                min="1" 
                max="50"
                class="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-900"
              />
            </div>

            <!-- Priority -->
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Priority Level *</label>
              <select 
                formControlName="priority"
                class="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-900"
              >
                <option value="P0">P0 — Critical Escalation (< 25 Days)</option>
                <option value="P1">P1 — High Business Value (< 40 Days)</option>
                <option value="P2">P2 — Standard Backfill (< 60 Days)</option>
              </select>
            </div>

            <!-- Target Joining Date -->
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Target Joining Date *</label>
              <input 
                type="date" 
                formControlName="targetDate"
                class="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-900"
              />
            </div>

            <!-- Hiring Manager -->
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Hiring Manager *</label>
              <select 
                formControlName="hiringManager"
                class="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-900"
              >
                <option *ngFor="let hm of hiringManagers" [value]="hm">{{ hm }}</option>
              </select>
            </div>

            <!-- Recruitment Owner -->
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Lead Recruiter *</label>
              <select 
                formControlName="owner"
                class="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-900"
              >
                <option *ngFor="let rec of recruiters" [value]="rec.name">{{ rec.name }}</option>
              </select>
            </div>

            <!-- Salary Range -->
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Budgeted Salary Range</label>
              <input 
                type="text" 
                formControlName="salaryRange"
                placeholder="e.g. $130k - $160k"
                class="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-900"
              />
            </div>

            <!-- Location -->
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Location & Work Mode</label>
              <input 
                type="text" 
                formControlName="location"
                placeholder="e.g. San Francisco, CA (Hybrid)"
                class="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-900"
              />
            </div>

            <!-- Experience -->
            <div class="md:col-span-2">
              <label class="block font-semibold text-slate-700 mb-1">Experience Range</label>
              <input 
                type="text" 
                formControlName="experienceRange"
                placeholder="e.g. 6 - 9 Years"
                class="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-900"
              />
            </div>

            <!-- Must Have Skills -->
            <div class="md:col-span-2">
              <label class="block font-semibold text-slate-700 mb-1">Must-Have Core Skills (comma separated)</label>
              <input 
                type="text" 
                formControlName="mustHaves"
                placeholder="e.g. Golang, Kubernetes, gRPC, Distributed Storage"
                class="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-900"
              />
            </div>

            <!-- Knockout Criteria -->
            <div class="md:col-span-2">
              <label class="block font-semibold text-slate-700 mb-1">Knockout Criteria (comma separated)</label>
              <textarea 
                rows="2"
                formControlName="knockout"
                placeholder="e.g. Less than 5 years backend experience, No experience with >10k RPS systems"
                class="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-900"
              ></textarea>
            </div>
          </div>
        </form>

        <div footer class="flex items-center gap-3">
          <button 
            type="button" 
            (click)="isCreatePositionOpen = false"
            class="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="button" 
            (click)="submitPosition()"
            [disabled]="positionForm.invalid"
            class="px-4 py-2 text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <app-icon name="check" [size]="14"></app-icon>
            Save Position
          </button>
        </div>
      </app-drawer>
    </div>
  `
})
export class AppShellComponent {
  private fb = inject(FormBuilder);
  private positionService = inject(PositionService);
  private toastService = inject(ToastService);

  isSidebarCollapsed = false;
  isMobileSidebarOpen = false;
  isCreatePositionOpen = false;

  departments = DEPARTMENTS;
  hiringManagers = HIRING_MANAGERS;
  recruiters = RECRUITERS_LIST;

  positionForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    department: ['Engineering', Validators.required],
    requiredHc: [1, [Validators.required, Validators.min(1)]],
    priority: ['P0', Validators.required],
    targetDate: ['2026-10-15', Validators.required],
    hiringManager: [HIRING_MANAGERS[0], Validators.required],
    owner: [RECRUITERS_LIST[0].name, Validators.required],
    salaryRange: ['$130k - $160k'],
    location: ['San Francisco, CA (Hybrid)'],
    experienceRange: ['5 - 8 Years'],
    mustHaves: ['Golang, Distributed Systems, Kubernetes'],
    knockout: ['Less than 4 years relevant experience']
  });

  submitPosition() {
    if (this.positionForm.invalid) return;

    const val = this.positionForm.value;
    const mustHaveSkills = val.mustHaves ? val.mustHaves.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
    const knockoutCriteria = val.knockout ? val.knockout.split(',').map((s: string) => s.trim()).filter(Boolean) : [];

    const newPos = this.positionService.createPosition({
      title: val.title,
      department: val.department,
      requiredHc: Number(val.requiredHc),
      priority: val.priority,
      targetDate: val.targetDate,
      hiringManager: val.hiringManager,
      owner: val.owner,
      salaryRange: val.salaryRange,
      location: val.location,
      experienceRange: val.experienceRange,
      mustHaveSkills,
      knockoutCriteria
    });

    this.toastService.success(
      'Position Created Successfully',
      `${newPos.title} (${newPos.id}) added with target HC of ${newPos.requiredHc}.`
    );

    this.isCreatePositionOpen = false;
    this.positionForm.reset({
      title: '',
      department: 'Engineering',
      requiredHc: 1,
      priority: 'P0',
      targetDate: '2026-10-15',
      hiringManager: HIRING_MANAGERS[0],
      owner: RECRUITERS_LIST[0].name,
      salaryRange: '$130k - $160k',
      location: 'San Francisco, CA (Hybrid)',
      experienceRange: '5 - 8 Years',
      mustHaves: '',
      knockout: ''
    });
  }
}
