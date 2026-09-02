import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CandidateService } from '../../../core/services/candidate.service';
import { PositionService } from '../../../core/services/position.service';
import { Candidate } from '../../../core/models/recruitment.model';
import { PIPELINE_STAGES, RECRUITERS_LIST } from '../../../core/constants/navigation.constant';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { DrawerComponent } from '../../../shared/components/drawer/drawer.component';
import { ViewSwitcherTabsComponent, ViewTab } from '../../../shared/components/view-switcher/view-switcher-tabs.component';

@Component({
  selector: 'app-recruitment-pipeline',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    PageHeaderComponent,
    IconComponent,
    DrawerComponent,
    ViewSwitcherTabsComponent
  ],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto">
      <!-- Header with View Switcher Tabs -->
      <app-page-header
        title="Recruitment Module"
        subtitle="Visual end-to-end stage workflow (Kanban View)."
      >
        <div actions class="flex flex-wrap items-center gap-3">
          <app-view-switcher-tabs [tabs]="recruitmentTabs"></app-view-switcher-tabs>

          <!-- Position Filter -->
          <select
            [(ngModel)]="selectedPositionId"
            class="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="ALL">All Positions ({{ positionService.positions().length }})</option>
            <option *ngFor="let p of positionService.positions()" [value]="p.id">{{ p.id }} - {{ p.title }}</option>
          </select>

          <!-- Recruiter Filter -->
          <select
            [(ngModel)]="selectedRecruiter"
            class="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="ALL">All Recruiters</option>
            <option *ngFor="let r of recruiters" [value]="r.name">{{ r.name }}</option>
          </select>
        </div>
      </app-page-header>

      <!-- Read-Only Horizontal Scrolling Kanban Board -->
      <div class="flex gap-4 overflow-x-auto pb-6 pt-1 select-none custom-kanban-scroll min-h-[620px]">
        <div 
          *ngFor="let stage of pipelineStages; let stageIdx = index"
          class="w-72 shrink-0 bg-slate-100/80 border border-slate-200/90 rounded-2xl flex flex-col max-h-[750px] shadow-2xs"
        >
          <!-- Stage Header -->
          <div class="p-3.5 border-b border-slate-200/80 flex items-center justify-between bg-white rounded-t-2xl">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-brand-500"></span>
              <span class="text-xs font-bold text-slate-900 tracking-tight">{{ stage.name }}</span>
            </div>
            <span class="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-brand-500 text-white shadow-2xs">
              {{ getCandidatesInStage(stage.name).length }}
            </span>
          </div>

          <!-- Stage Column Card List -->
          <div class="flex-1 overflow-y-auto p-2.5 space-y-2.5">
            <div
              *ngFor="let cand of getCandidatesInStage(stage.name)"
              (click)="openCandidateDrawer(cand)"
              class="bg-white border border-slate-200/90 border-l-4 border-l-brand-500 hover:border-brand-400 rounded-xl p-3.5 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
            >
              <!-- Card Header -->
              <div class="flex items-start justify-between gap-2">
                <div>
                  <h4 class="text-xs font-bold text-slate-900 group-hover:text-brand-600 transition-colors leading-tight">
                    {{ cand.name }}
                  </h4>
                  <span class="text-[10px] font-mono text-slate-400 block mt-0.5">{{ cand.id }}</span>
                </div>
                <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                  {{ cand.qualityScore }}%
                </span>
              </div>

              <!-- Role & Dept -->
              <div class="mt-2 text-[11px] text-slate-600 truncate font-semibold">
                {{ cand.positionTitle }}
              </div>

              <!-- Recruiter & Read-Only Badge -->
              <div class="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <span class="text-[10px] font-semibold text-slate-500">Owner: {{ cand.recruiter.split(' ')[0] }}</span>

                <span class="text-[10px] text-brand-700 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  View Profile →
                </span>
              </div>
            </div>

            <!-- Empty stage notice -->
            <div 
              *ngIf="getCandidatesInStage(stage.name).length === 0" 
              class="py-10 text-center text-[11px] text-slate-400 italic"
            >
              No candidates in {{ stage.name }}
            </div>
          </div>
        </div>
      </div>

      <!-- Candidate Quick View Drawer (Read-Only) -->
      <app-drawer
        [(isOpen)]="isDrawerOpen"
        [title]="selectedCandidate?.name || ''"
        subtitle="Candidate Profile Preview (Read-Only)"
        width="lg"
      >
        <div *ngIf="selectedCandidate as cand" class="space-y-5 text-xs">
          <!-- Status Strip -->
          <div class="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div>
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Current Stage</span>
              <span class="font-bold text-brand-700 text-sm mt-0.5 block">{{ cand.currentStage }}</span>
            </div>
            <span class="px-3 py-1 rounded-full font-bold text-xs bg-emerald-100 text-emerald-800 border border-emerald-200">
              Quality Fit: {{ cand.qualityScore }}%
            </span>
          </div>

          <!-- Position & Recruiter -->
          <div class="p-3.5 bg-white rounded-xl border border-slate-200/80 space-y-2">
            <div class="flex justify-between">
              <span class="text-slate-500 font-medium">Applied Position:</span>
              <span class="font-bold text-slate-900">{{ cand.positionTitle }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500 font-medium">Assigned Recruiter:</span>
              <span class="font-bold text-slate-900">{{ cand.recruiter }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500 font-medium">Current Company:</span>
              <span class="font-bold text-slate-900">{{ cand.currentCompany }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500 font-medium">Experience & Salary:</span>
              <span class="font-bold text-slate-900 font-mono">{{ cand.experienceYears }} yrs • {{ cand.expectedSalary }}</span>
            </div>
          </div>

          <!-- Skills Assessed -->
          <div class="p-3.5 bg-white rounded-xl border border-slate-200/80 space-y-2">
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Assessed Skills</span>
            <div class="flex flex-wrap gap-1.5">
              <span *ngFor="let s of cand.skills" class="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md font-semibold text-[11px]">
                {{ s }}
              </span>
            </div>
          </div>
        </div>

        <div footer class="flex items-center justify-between w-full">
          <button 
            type="button" 
            (click)="isDrawerOpen = false"
            class="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl bg-white"
          >
            Close
          </button>

          <a
            *ngIf="selectedCandidate"
            [routerLink]="['/recruitment/candidates', selectedCandidate.id]"
            (click)="isDrawerOpen = false"
            class="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            Full Candidate 360 View
          </a>
        </div>
      </app-drawer>
    </div>
  `,
  styles: [`
    .custom-kanban-scroll::-webkit-scrollbar {
      height: 8px;
    }
    .custom-kanban-scroll::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }
  `]
})
export class RecruitmentPipelineComponent implements OnInit {
  candidateService = inject(CandidateService);
  positionService = inject(PositionService);
  private route = inject(ActivatedRoute);

  recruitmentTabs: ViewTab[] = [
    { label: 'Positions List', icon: 'list', route: '/recruitment/positions' },
    { label: 'Pipeline Kanban', icon: 'kanban', route: '/recruitment/pipeline' },
    { label: 'Candidates List', icon: 'users', route: '/recruitment/candidates' },
    { label: 'Requirement Cards', icon: 'file-text', route: '/recruitment/requirements' },
    { label: 'Talent Bank List', icon: 'database', route: '/recruitment/talent-bank' }
  ];

  pipelineStages = PIPELINE_STAGES;
  recruiters = RECRUITERS_LIST;

  selectedPositionId = 'ALL';
  selectedRecruiter = 'ALL';

  isDrawerOpen = false;
  selectedCandidate?: Candidate;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['positionId']) {
        this.selectedPositionId = params['positionId'];
      }
    });
  }

  getCandidatesInStage(stageName: string): Candidate[] {
    return this.candidateService.candidates().filter(c => {
      const matchesStage = c.currentStage === stageName;
      const matchesPos = this.selectedPositionId === 'ALL' || c.positionId === this.selectedPositionId;
      const matchesRec = this.selectedRecruiter === 'ALL' || c.recruiter === this.selectedRecruiter;
      return matchesStage && matchesPos && matchesRec;
    });
  }

  openCandidateDrawer(cand: Candidate) {
    this.selectedCandidate = cand;
    this.isDrawerOpen = true;
  }
}
