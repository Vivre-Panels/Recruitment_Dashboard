import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PositionService } from '../../../core/services/position.service';
import { CandidateService } from '../../../core/services/candidate.service';
import { ToastService } from '../../../core/services/toast.service';
import { Position, Candidate, HealthStatus } from '../../../core/models/recruitment.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PriorityBadgeComponent } from '../../../shared/components/priority-badge/priority-badge.component';
import { BottleneckCardComponent } from '../../../shared/components/bottleneck-card/bottleneck-card.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-recruitment-position-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    StatusBadgeComponent,
    PriorityBadgeComponent,
    BottleneckCardComponent,
    IconComponent,
    ModalComponent
  ],
  template: `
    <div *ngIf="position; else notFound" class="space-y-6 max-w-7xl mx-auto">
      <!-- Back Navigation & Clean Header (Prompt Rule 10) -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div class="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
            <a routerLink="/recruitment/positions" class="hover:text-brand-600 inline-flex items-center gap-1 font-medium">
              <app-icon name="arrow-left" [size]="12"></app-icon>
              Positions Directory
            </a>
            <span>/</span>
            <span class="font-mono text-slate-700 font-semibold">{{ position.id }}</span>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <h1 class="text-2xl font-bold tracking-tight text-slate-900">{{ position.title }}</h1>
            <app-priority-badge [priority]="position.priority"></app-priority-badge>
            <app-status-badge [status]="position.status"></app-status-badge>
            <span class="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {{ position.joinedHc }} / {{ position.requiredHc }} Hired
            </span>
          </div>

          <p class="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
            <span>{{ position.department }}</span>
            <span>•</span>
            <span>{{ position.location }}</span>
            <span>•</span>
            <span class="font-semibold text-slate-700">Salary: {{ position.salaryRange }}</span>
          </p>
        </div>

        <div class="flex items-center gap-2">
          <a
            [routerLink]="['/recruitment/pipeline']"
            [queryParams]="{ positionId: position.id }"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <app-icon name="kanban" [size]="14"></app-icon>
            Open Kanban Pipeline
          </a>
        </div>
      </div>

      <!-- Navigation Tabs (Prompt Rule 9 & 10: Overview | Candidates | Funnel | SLA) -->
      <div class="border-b border-slate-200/80 flex items-center gap-6 text-xs font-bold">
        <button
          type="button"
          (click)="activeTab = 'overview'"
          class="pb-3 border-b-2 transition-colors flex items-center gap-2"
          [ngClass]="activeTab === 'overview' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-800'"
        >
          <app-icon name="briefcase" [size]="14"></app-icon>
          Overview & Requirements
        </button>

        <button
          type="button"
          (click)="activeTab = 'candidates'"
          class="pb-3 border-b-2 transition-colors flex items-center gap-2"
          [ngClass]="activeTab === 'candidates' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-800'"
        >
          <app-icon name="users" [size]="14"></app-icon>
          Associated Candidates ({{ activeCandidates.length }})
        </button>

        <button
          type="button"
          (click)="activeTab = 'funnel'"
          class="pb-3 border-b-2 transition-colors flex items-center gap-2"
          [ngClass]="activeTab === 'funnel' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-800'"
        >
          <app-icon name="activity" [size]="14"></app-icon>
          Recruitment Funnel
        </button>

        <button
          type="button"
          (click)="activeTab = 'sla'"
          class="pb-3 border-b-2 transition-colors flex items-center gap-2"
          [ngClass]="activeTab === 'sla' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-800'"
        >
          <app-icon name="clock" [size]="14"></app-icon>
          SLA & Bottlenecks
        </button>
      </div>

      <!-- TAB 1: OVERVIEW -->
      <div *ngIf="activeTab === 'overview'" class="space-y-6">
        <!-- Key Metadata Strip -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
          <div>
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Required Headcount</span>
            <span class="text-lg font-bold text-slate-900 mt-0.5 block">
              {{ position.joinedHc }} <span class="text-xs text-slate-400 font-normal">/ {{ position.requiredHc }} Joined</span>
            </span>
          </div>

          <div>
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Target Joining Date</span>
            <span class="text-sm font-semibold text-slate-900 font-mono mt-1 block">{{ position.targetDate }}</span>
          </div>

          <div>
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Lead Recruiter Owner</span>
            <span class="text-sm font-semibold text-slate-900 mt-1 block">{{ position.owner }}</span>
          </div>

          <div>
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Hiring Manager</span>
            <span class="text-sm font-semibold text-slate-900 mt-1 block truncate">{{ position.hiringManager }}</span>
          </div>
        </div>

        <!-- Requirement Specification Details -->
        <div class="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="text-sm font-bold text-slate-900">Requirement Specification</h3>
            <span class="text-xs text-slate-400">Requisition Date: {{ position.createdAt }}</span>
          </div>

          <div class="text-xs space-y-4 text-slate-700">
            <div>
              <span class="font-bold text-slate-900 block mb-1">Role Description & Mandate</span>
              <p class="leading-relaxed text-slate-600 bg-slate-50/50 p-3.5 rounded-xl border border-slate-200/80">
                {{ position.description || 'Enterprise role responsible for operational scale.' }}
              </p>
            </div>

            <!-- Must Have Skills -->
            <div>
              <span class="font-bold text-slate-900 block mb-2">Must-Have Technical Skills</span>
              <div class="flex flex-wrap gap-1.5">
                <span 
                  *ngFor="let skill of position.mustHaveSkills"
                  class="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
                >
                  {{ skill }}
                </span>
              </div>
            </div>

            <!-- Knockout Criteria -->
            <div>
              <span class="font-bold text-red-700 block mb-2 flex items-center gap-1">
                <app-icon name="alert-triangle" [size]="13"></app-icon>
                Non-Negotiable Knockout Criteria
              </span>
              <ul class="space-y-1.5">
                <li 
                  *ngFor="let ko of position.knockoutCriteria"
                  class="flex items-start gap-2 bg-red-50/50 text-red-900 p-2.5 rounded-lg border border-red-100 text-[11px]"
                >
                  <app-icon name="x" [size]="13" class="text-red-500 shrink-0 mt-0.5"></app-icon>
                  <span>{{ ko }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: CANDIDATES -->
      <div *ngIf="activeTab === 'candidates'" class="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
        <div class="p-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 class="text-sm font-bold text-slate-900">Associated Candidates in Pipeline</h3>
            <p class="text-xs text-slate-500">Candidates actively being processed for this role</p>
          </div>

          <a 
            [routerLink]="['/recruitment/pipeline']" 
            [queryParams]="{ positionId: position.id }"
            class="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            Open Kanban Board →
          </a>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th class="py-3 px-4">Candidate</th>
                <th class="py-3 px-3">Current Company</th>
                <th class="py-3 px-3 text-center">Experience</th>
                <th class="py-3 px-3">Current Stage</th>
                <th class="py-3 px-3 text-center">Quality Match</th>
                <th class="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              <tr 
                *ngFor="let cand of activeCandidates"
                class="hover:bg-slate-50 transition-colors cursor-pointer"
                (click)="navigateToCandidate(cand.id)"
              >
                <td class="py-3.5 px-4 font-semibold text-slate-900">
                  {{ cand.name }}
                  <span class="text-[10px] text-slate-400 block font-normal">{{ cand.email }}</span>
                </td>
                <td class="py-3.5 px-3 text-slate-600">{{ cand.currentCompany }}</td>
                <td class="py-3.5 px-3 text-center font-mono">{{ cand.experienceYears }} yrs</td>
                <td class="py-3.5 px-3">
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                    {{ cand.currentStage }}
                  </span>
                </td>
                <td class="py-3.5 px-3 text-center font-mono font-bold text-emerald-700">{{ cand.qualityScore }}%</td>
                <td class="py-3.5 px-4 text-right" (click)="$event.stopPropagation()">
                  <a
                    [routerLink]="['/recruitment/candidates', cand.id]"
                    class="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-brand-600 bg-slate-100 hover:bg-brand-50 rounded-lg transition-colors"
                  >
                    View Candidate
                  </a>
                </td>
              </tr>
            </tbody>
          </table>

          <div *ngIf="activeCandidates.length === 0" class="py-8 text-center text-xs text-slate-500">
            No active candidates currently in pipeline for this position.
          </div>
        </div>
      </div>

      <!-- TAB 3: FUNNEL -->
      <div *ngIf="activeTab === 'funnel'" class="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="text-sm font-bold text-slate-900">Live Recruitment Funnel Yield</h3>
          <span class="text-xs font-semibold text-brand-600">{{ activeCandidates.length }} Candidates Active</span>
        </div>

        <div class="space-y-2.5">
          <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span class="font-bold text-slate-800">1. Sourced CVs</span>
            <span class="font-mono font-bold text-slate-900">{{ position.funnelCounts.sourced }}</span>
          </div>

          <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span class="font-bold text-slate-800">2. Screened</span>
            <span class="font-mono font-bold text-slate-900">{{ position.funnelCounts.screened }}</span>
          </div>

          <div class="flex items-center justify-between p-3 rounded-xl bg-blue-50/50 border border-blue-200 text-xs">
            <span class="font-bold text-slate-800">3. Interviewed</span>
            <span class="font-mono font-bold text-blue-700">{{ position.funnelCounts.interviewed }}</span>
          </div>

          <div class="flex items-center justify-between p-3 rounded-xl bg-purple-50/50 border border-purple-200 text-xs">
            <span class="font-bold text-slate-800">4. Selected</span>
            <span class="font-mono font-bold text-purple-700">{{ position.funnelCounts.selected }}</span>
          </div>

          <div class="flex items-center justify-between p-3 rounded-xl bg-amber-50/50 border border-amber-200 text-xs">
            <span class="font-bold text-slate-800">5. Offered / Accepted</span>
            <span class="font-mono font-bold text-amber-800">{{ position.funnelCounts.offered }} / {{ position.funnelCounts.accepted }}</span>
          </div>

          <div class="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs">
            <span class="font-bold text-emerald-900">6. Joined Day 1</span>
            <span class="font-mono font-bold text-emerald-900 text-sm">{{ position.funnelCounts.joined }}</span>
          </div>
        </div>
      </div>

      <!-- TAB 4: SLA & BOTTLENECK -->
      <div *ngIf="activeTab === 'sla'" class="space-y-6">
        <app-bottleneck-card
          [bottleneck]="position.bottleneck"
          (sendReminder)="onSendReminder()"
          (addRemark)="isRemarkModalOpen = true"
          (updateStatus)="isStatusModalOpen = true"
        ></app-bottleneck-card>
      </div>



      <!-- Add Remark Modal -->
      <app-modal
        [(isOpen)]="isRemarkModalOpen"
        title="Add Operational Remark"
        subtitle="Log an update or discussion note for this position."
        size="md"
      >
        <div class="space-y-3 text-xs">
          <textarea
            [(ngModel)]="remarkText"
            rows="4"
            placeholder="Type meeting notes or reminder details..."
            class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          ></textarea>
        </div>

        <div footer class="flex items-center gap-2">
          <button 
            type="button" 
            (click)="isRemarkModalOpen = false"
            class="px-3.5 py-1.5 text-xs font-semibold text-slate-600 border border-slate-300 rounded-lg bg-white"
          >
            Cancel
          </button>
          <button 
            type="button" 
            (click)="saveRemark()"
            class="px-3.5 py-1.5 text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-lg shadow-xs"
          >
            Save Remark
          </button>
        </div>
      </app-modal>
    </div>

    <ng-template #notFound>
      <div class="py-16 text-center max-w-md mx-auto">
        <h2 class="text-lg font-bold text-slate-800">Position Not Found</h2>
        <p class="text-xs text-slate-500 mt-1">The requested position code does not exist.</p>
        <a 
          routerLink="/recruitment/positions"
          class="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-brand-500 text-white rounded-lg text-xs font-semibold shadow-xs"
        >
          Return to Positions
        </a>
      </div>
    </ng-template>
  `
})
export class RecruitmentPositionDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private positionService = inject(PositionService);
  private candidateService = inject(CandidateService);
  private toastService = inject(ToastService);

  position?: Position;
  activeCandidates: Candidate[] = [];

  activeTab: 'overview' | 'candidates' | 'funnel' | 'sla' = 'overview';

  isRemarkModalOpen = false;
  isStatusModalOpen = false;

  remarkText = '';
  newStatus: HealthStatus = 'On Track';

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadPosition(id);
      }
    });
  }

  loadPosition(id: string) {
    this.position = this.positionService.getPositionById(id);
    if (this.position) {
      this.newStatus = this.position.status;
      this.activeCandidates = this.candidateService.getCandidatesByPositionId(id);
    }
  }

  navigateToCandidate(id: string) {
    this.router.navigate(['/recruitment/candidates', id]);
  }

  onSendReminder() {
    if (!this.position || !this.position.bottleneck) return;
    this.toastService.warning(
      'SLA Escalation Reminder Dispatched',
      `Reminder sent to ${this.position.bottleneck.pendingWith}.`
    );
  }

  saveRemark() {
    if (!this.position) return;
    this.positionService.updateBottleneck(this.position.id, this.remarkText);
    this.toastService.success('Remark Logged', 'Operational remark saved.');
    this.isRemarkModalOpen = false;
    this.remarkText = '';
    this.loadPosition(this.position.id);
  }

  saveStatus() {
    if (!this.position) return;
    this.positionService.updateStatus(this.position.id, this.newStatus);
    this.toastService.success('Status Updated', `Health marked as ${this.newStatus}.`);
    this.isStatusModalOpen = false;
    this.loadPosition(this.position.id);
  }
}
