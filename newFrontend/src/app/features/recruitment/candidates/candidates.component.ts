import { Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CandidateService } from '../../../core/services/candidate.service';
import { PositionService } from '../../../core/services/position.service';
import { Candidate } from '../../../core/models/recruitment.model';
import { PIPELINE_STAGES, DEPARTMENTS } from '../../../core/constants/navigation.constant';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { SearchInputComponent } from '../../../shared/components/search-input/search-input.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { DrawerComponent } from '../../../shared/components/drawer/drawer.component';
import { ViewSwitcherTabsComponent, ViewTab } from '../../../shared/components/view-switcher/view-switcher-tabs.component';

@Component({
  selector: 'app-recruitment-candidates',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    PageHeaderComponent,
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
        subtitle="Manage candidate profiles, stage progressions, interview scorecards, and resumes."
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
            placeholder="Search candidate name, skills, role title..."
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

      <!-- Candidates Read-Only Table -->
      <div class="app-card p-0 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr>
                <th class="app-table-th">Candidate</th>
                <th class="app-table-th">Applied Role</th>
                <th class="app-table-th">Stage</th>
                <th class="app-table-th text-center">Exp</th>
                <th class="app-table-th text-center">Quality</th>
                <th class="app-table-th text-right">View Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              <tr 
                *ngFor="let c of filteredCandidates()"
                (click)="openCvDrawer(c)"
                class="hover:bg-slate-50/80 transition-colors cursor-pointer group"
              >
                <!-- Candidate Info -->
                <td class="app-table-td font-semibold text-slate-900">
                  <div class="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{{ c.name }}</div>
                  <div class="text-[11px] text-slate-500 mt-0.5">{{ c.email }} • {{ c.location }}</div>
                </td>

                <!-- Position -->
                <td class="app-table-td font-medium text-slate-800">
                  {{ c.positionTitle }}
                </td>

                <!-- Stage -->
                <td class="app-table-td">
                  <span class="px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                    {{ c.currentStage }}
                  </span>
                </td>

                <!-- Experience -->
                <td class="app-table-td text-center font-mono font-medium">{{ c.experienceYears }} yrs</td>

                <!-- Quality Score -->
                <td class="app-table-td text-center font-mono font-bold text-emerald-700">
                  {{ c.qualityScore }}%
                </td>

                <!-- Actions -->
                <td class="app-table-td text-right" (click)="$event.stopPropagation()">
                  <div class="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      (click)="openCvDrawer(c)"
                      class="px-4 py-2 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      View Profile
                    </button>
                    <a
                      [routerLink]="['/recruitment/candidates', c.id]"
                      class="px-4 py-2 bg-brand-50 hover:bg-brand-100 text-brand-800 rounded-xl text-xs font-bold transition-colors"
                    >
                      360° Profile
                    </a>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <app-empty-state
            *ngIf="filteredCandidates().length === 0"
            title="No candidates match criteria"
            message="Please clear or change your search filter settings."
            actionLabel="Reset Filters"
            (actionClick)="resetFilters()"
          ></app-empty-state>
        </div>
      </div>

      <!-- Candidate Profile Drawer (Read-Only) -->
      <app-drawer
        [(isOpen)]="isCvDrawerOpen"
        [title]="selectedCandidate?.name || ''"
        subtitle="Candidate Summary & Qualifications (Read-Only)"
        width="lg"
      >
        <div *ngIf="selectedCandidate as cand" class="space-y-6 text-xs">
          <!-- Status Strip -->
          <div class="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Current Stage</span>
              <span class="font-bold text-brand-700 text-sm mt-0.5 block">{{ cand.currentStage }}</span>
            </div>
            <span class="px-3 py-1 rounded-full font-bold text-xs bg-emerald-100 text-emerald-800">
              Quality Match: {{ cand.qualityScore }}%
            </span>
          </div>

          <div class="p-4 bg-white rounded-xl border border-slate-200 space-y-2.5">
            <div class="flex justify-between">
              <span class="text-slate-500 font-medium">Applied Position:</span>
              <span class="font-bold text-slate-900">{{ cand.positionTitle }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500 font-medium">Current Role & Company:</span>
              <span class="font-bold text-slate-900">{{ cand.currentDesignation }} @ {{ cand.currentCompany }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500 font-medium">Experience & Location:</span>
              <span class="font-bold text-slate-900 font-mono">{{ cand.experienceYears }} yrs • {{ cand.location }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500 font-medium">Notice Period:</span>
              <span class="font-bold text-slate-900 font-mono">{{ cand.noticePeriodDays }} Days</span>
            </div>
          </div>

          <!-- Skills Verified -->
          <div class="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Assessed Competencies</span>
            <div class="flex flex-wrap gap-1.5">
              <span *ngFor="let s of cand.skills" class="px-2.5 py-1 bg-slate-100 text-slate-800 rounded font-semibold text-[11px]">
                {{ s }}
              </span>
            </div>
          </div>
        </div>

        <div footer class="flex items-center justify-between w-full">
          <button 
            type="button" 
            (click)="isCvDrawerOpen = false"
            class="app-btn-secondary cursor-pointer"
          >
            Close
          </button>

          <a 
            *ngIf="selectedCandidate"
            [routerLink]="['/recruitment/candidates', selectedCandidate.id]"
            (click)="isCvDrawerOpen = false"
            class="app-btn-primary"
          >
            Full 360° Profile
          </a>
        </div>
      </app-drawer>

      <!-- Filter Drawer -->
      <app-drawer
        [(isOpen)]="isFilterDrawerOpen"
        title="Candidate Filters"
        subtitle="Filter candidates database."
        width="sm"
      >
        <div class="space-y-5 text-xs">
          <div>
            <label class="app-label">Pipeline Stage</label>
            <select
              [(ngModel)]="selectedStage"
              class="app-input"
            >
              <option value="ALL">All Stages</option>
              <option *ngFor="let s of pipelineStages" [value]="s.name">{{ s.name }}</option>
            </select>
          </div>

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
            <label class="app-label">Open Position</label>
            <select
              [(ngModel)]="selectedPositionId"
              class="app-input"
            >
              <option value="ALL">All Positions</option>
              <option *ngFor="let p of positionService.positions()" [value]="p.id">{{ p.id }} - {{ p.title }}</option>
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
export class RecruitmentCandidatesComponent implements OnInit {
  candidateService = inject(CandidateService);
  positionService = inject(PositionService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  recruitmentTabs: ViewTab[] = [
    { label: 'Positions List', icon: 'list', route: '/recruitment/positions' },
    { label: 'Pipeline Kanban', icon: 'kanban', route: '/recruitment/pipeline' },
    { label: 'Candidates List', icon: 'users', route: '/recruitment/candidates' },
    { label: 'Requirement Cards', icon: 'file-text', route: '/recruitment/requirements' },
    { label: 'Talent Bank List', icon: 'database', route: '/recruitment/talent-bank' }
  ];

  pipelineStages = PIPELINE_STAGES;
  departments = DEPARTMENTS;

  searchTerm = '';
  selectedStage = 'ALL';
  selectedDepartment = 'ALL';
  selectedPositionId = 'ALL';

  isFilterDrawerOpen = false;
  isCvDrawerOpen = false;
  selectedCandidate?: Candidate;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['positionId']) {
        this.selectedPositionId = params['positionId'];
      }
    });
  }

  filteredCandidates = computed(() => {
    return this.candidateService.candidates().filter(c => {
      const matchesSearch = !this.searchTerm ||
        c.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        c.id.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        c.positionTitle.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesStage = this.selectedStage === 'ALL' || c.currentStage === this.selectedStage;
      const matchesDept = this.selectedDepartment === 'ALL' || c.department === this.selectedDepartment;
      const matchesPosition = this.selectedPositionId === 'ALL' || c.positionId === this.selectedPositionId;

      return matchesSearch && matchesStage && matchesDept && matchesPosition;
    });
  });

  activeFilterCount = computed(() => {
    let count = 0;
    if (this.selectedStage !== 'ALL') count++;
    if (this.selectedDepartment !== 'ALL') count++;
    if (this.selectedPositionId !== 'ALL') count++;
    return count;
  });

  openCvDrawer(c: Candidate) {
    this.selectedCandidate = c;
    this.isCvDrawerOpen = true;
  }

  resetFilters() {
    this.searchTerm = '';
    this.selectedStage = 'ALL';
    this.selectedDepartment = 'ALL';
    this.selectedPositionId = 'ALL';
    this.isFilterDrawerOpen = false;
  }
}
