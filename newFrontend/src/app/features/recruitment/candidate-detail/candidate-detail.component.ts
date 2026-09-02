import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CandidateService } from '../../../core/services/candidate.service';
import { ToastService } from '../../../core/services/toast.service';
import { Candidate, PipelineStage, InterviewScorecard } from '../../../core/models/recruitment.model';
import { PIPELINE_STAGES } from '../../../core/constants/navigation.constant';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-recruitment-candidate-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    StatusBadgeComponent,
    IconComponent,
    ModalComponent
  ],
  template: `
    <div *ngIf="candidate; else notFound" class="space-y-6 max-w-7xl mx-auto">
      <!-- Top Navigation & Header (Prompt Rule 11) -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div class="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
            <a routerLink="/recruitment/candidates" class="hover:text-brand-600 inline-flex items-center gap-1 font-medium">
              <app-icon name="arrow-left" [size]="12"></app-icon>
              Candidates Directory
            </a>
            <span>/</span>
            <span class="font-mono text-slate-700 font-semibold">{{ candidate.id }}</span>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <h1 class="text-2xl font-bold tracking-tight text-slate-900">{{ candidate.name }}</h1>
            <span class="px-3 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200">
              Stage: {{ candidate.currentStage }}
            </span>
            <app-status-badge [status]="candidate.status"></app-status-badge>
          </div>

          <p class="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
            <span>Applied Role:</span>
            <a 
              [routerLink]="['/recruitment/positions', candidate.positionId]"
              class="font-semibold text-brand-600 hover:underline"
            >
              {{ candidate.positionTitle }} ({{ candidate.positionId }})
            </a>
            <span>•</span>
            <span>Recruiter: <strong class="text-slate-700">{{ candidate.recruiter }}</strong></span>
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="isMoveStageOpen = true"
            class="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <app-icon name="arrow-right" [size]="14"></app-icon>
            Move Stage
          </button>
        </div>
      </div>

      <!-- Navigation Tabs (Prompt Rule 9 & 11: Profile | Journey | Interviews | Notes) -->
      <div class="border-b border-slate-200/80 flex items-center gap-6 text-xs font-bold">
        <button
          type="button"
          (click)="activeTab = 'profile'"
          class="pb-3 border-b-2 transition-colors flex items-center gap-2"
          [ngClass]="activeTab === 'profile' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-800'"
        >
          <app-icon name="user" [size]="14"></app-icon>
          Profile Overview
        </button>

        <button
          type="button"
          (click)="activeTab = 'journey'"
          class="pb-3 border-b-2 transition-colors flex items-center gap-2"
          [ngClass]="activeTab === 'journey' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-800'"
        >
          <app-icon name="activity" [size]="14"></app-icon>
          Journey Timeline ({{ candidate.timeline.length }})
        </button>

        <button
          type="button"
          (click)="activeTab = 'interviews'"
          class="pb-3 border-b-2 transition-colors flex items-center gap-2"
          [ngClass]="activeTab === 'interviews' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-800'"
        >
          <app-icon name="award" [size]="14"></app-icon>
          Interviews & Scorecards ({{ candidate.interviews.length }})
        </button>

        <button
          type="button"
          (click)="activeTab = 'notes'"
          class="pb-3 border-b-2 transition-colors flex items-center gap-2"
          [ngClass]="activeTab === 'notes' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-800'"
        >
          <app-icon name="file-text" [size]="14"></app-icon>
          Internal Notes ({{ candidate.notes.length }})
        </button>
      </div>

      <!-- TAB 1: PROFILE OVERVIEW -->
      <div *ngIf="activeTab === 'profile'" class="space-y-6">
        <!-- Key Attributes Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
          <div>
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Experience</span>
            <span class="text-sm font-bold text-slate-900 mt-0.5 block">{{ candidate.experienceYears }} Years Exp</span>
            <span class="text-xs text-slate-500 truncate block">{{ candidate.currentDesignation }}</span>
          </div>

          <div>
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Quality & Fit Match</span>
            <span class="text-sm font-bold text-emerald-700 mt-0.5 block">{{ candidate.qualityScore }}% Quality Score</span>
            <span class="text-xs text-slate-500 block">{{ candidate.matchScore }}% Job Match</span>
          </div>

          <div>
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Compensation</span>
            <span class="text-sm font-bold text-slate-900 font-mono mt-0.5 block">{{ candidate.expectedSalary }}</span>
            <span class="text-xs text-slate-400 block">Current: {{ candidate.currentSalary }}</span>
          </div>

          <div>
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Notice Period</span>
            <span class="text-sm font-bold text-slate-900 mt-0.5 block">{{ candidate.noticePeriodDays }} Days</span>
            <span class="text-xs text-slate-500 block">{{ candidate.location }}</span>
          </div>
        </div>

        <!-- Skills Tags -->
        <div class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
          <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Assessed Competencies & Skills</h3>
          <div class="flex flex-wrap gap-2">
            <span 
              *ngFor="let skill of candidate.skills"
              class="px-3 py-1 bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg border border-slate-200/80"
            >
              {{ skill }}
            </span>
          </div>
        </div>
      </div>

      <!-- TAB 2: JOURNEY TIMELINE -->
      <div *ngIf="activeTab === 'journey'" class="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-6">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="text-sm font-bold text-slate-900">Recruitment Journey Timeline</h3>
          <span class="text-xs text-slate-400">{{ candidate.timeline.length }} History Events</span>
        </div>

        <div class="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          <div *ngFor="let ev of candidate.timeline" class="relative">
            <!-- Dot -->
            <div 
              class="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white ring-2"
              [ngClass]="{
                'bg-emerald-500 ring-emerald-200': ev.type === 'success',
                'bg-amber-500 ring-amber-200': ev.type === 'warning',
                'bg-red-500 ring-red-200': ev.type === 'error',
                'bg-brand-500 ring-brand-200': ev.type === 'info'
              }"
            ></div>

            <div class="bg-slate-50/50 rounded-xl p-3.5 border border-slate-200/80 text-xs space-y-1">
              <div class="flex items-center justify-between gap-2">
                <span class="font-bold text-slate-900">{{ ev.title }}</span>
                <span class="font-mono text-[10px] text-slate-400">{{ ev.date }}</span>
              </div>
              <p class="text-slate-600 leading-relaxed">{{ ev.description }}</p>
              <div class="pt-1 text-[10px] text-slate-400 flex items-center gap-2">
                <span>Actor: <strong class="text-slate-700">{{ ev.actor }}</strong></span>
                <span>•</span>
                <span>Stage: <strong class="text-brand-700">{{ ev.stage }}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 3: INTERVIEWS -->
      <div *ngIf="activeTab === 'interviews'" class="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-6">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="text-sm font-bold text-slate-900">Interview Evaluation Scorecards</h3>
          <button
            type="button"
            (click)="isAddScorecardOpen = true"
            class="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            + Submit Scorecard
          </button>
        </div>

        <div *ngIf="candidate.interviews.length > 0; else noInterviews" class="space-y-4">
          <div 
            *ngFor="let sc of candidate.interviews"
            class="p-4 rounded-xl border border-slate-200/80 bg-slate-50/40 text-xs space-y-3"
          >
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-bold text-slate-900">{{ sc.round }}</h4>
                <span class="text-[11px] text-slate-500">Evaluator: {{ sc.interviewer }} • {{ sc.date }}</span>
              </div>
              <div class="text-right">
                <span 
                  class="px-2.5 py-1 rounded-full font-bold text-xs"
                  [ngClass]="sc.recommendation === 'Strong Hire' || sc.recommendation === 'Hire' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'"
                >
                  {{ sc.recommendation }}
                </span>
                <div class="text-[11px] font-mono font-bold text-slate-700 mt-1">Rating: {{ sc.rating }}/5</div>
              </div>
            </div>

            <p class="italic text-slate-600 bg-white p-3 rounded-lg border border-slate-200/80">
              "{{ sc.notes }}"
            </p>
          </div>
        </div>

        <ng-template #noInterviews>
          <div class="py-8 text-center text-xs text-slate-500">
            No interview scorecards recorded yet.
          </div>
        </ng-template>
      </div>

      <!-- TAB 4: NOTES -->
      <div *ngIf="activeTab === 'notes'" class="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-6">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="text-sm font-bold text-slate-900">Internal Recruiter Notes</h3>
          <button
            type="button"
            (click)="isAddNoteOpen = true"
            class="text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            + Add Note
          </button>
        </div>

        <div *ngIf="candidate.notes.length > 0; else noNotes" class="space-y-3">
          <div *ngFor="let n of candidate.notes" class="p-3.5 rounded-xl bg-slate-50/50 border border-slate-200/80 text-xs">
            <div class="flex items-center justify-between text-[11px] text-slate-500 mb-1">
              <span class="font-bold text-slate-800">{{ n.author }}</span>
              <span class="font-mono">{{ n.date }}</span>
            </div>
            <p class="text-slate-700 leading-relaxed">{{ n.content }}</p>
          </div>
        </div>

        <ng-template #noNotes>
          <div class="py-8 text-center text-xs text-slate-500">
            No internal notes logged yet.
          </div>
        </ng-template>
      </div>

      <!-- Move Stage Modal -->
      <app-modal
        [(isOpen)]="isMoveStageOpen"
        title="Move Candidate Stage"
        subtitle="Update current recruitment checkpoint."
        size="sm"
      >
        <div class="space-y-3 text-xs">
          <label class="block font-semibold text-slate-700">Target Stage</label>
          <select
            [(ngModel)]="newStageTarget"
            class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
          >
            <option *ngFor="let s of pipelineStages" [value]="s.name">{{ s.name }}</option>
          </select>
        </div>

        <div footer class="flex items-center gap-2">
          <button 
            type="button" 
            (click)="isMoveStageOpen = false"
            class="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg bg-white"
          >
            Cancel
          </button>
          <button 
            type="button" 
            (click)="confirmStageAdvance()"
            class="px-3.5 py-1.5 text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-lg shadow-xs"
          >
            Advance Stage
          </button>
        </div>
      </app-modal>

      <!-- Add Scorecard Modal -->
      <app-modal
        [(isOpen)]="isAddScorecardOpen"
        title="Submit Interview Scorecard"
        subtitle="Record interviewer rating & recommendation."
        size="md"
      >
        <div class="space-y-3 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Interviewer Name *</label>
            <input 
              type="text" 
              [(ngModel)]="newScorecard.interviewer" 
              placeholder="e.g. Vikram Malhotra"
              class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Rating (1-5) *</label>
              <select 
                [(ngModel)]="newScorecard.rating" 
                class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option [ngValue]="5">5 — Exceptional</option>
                <option [ngValue]="4">4 — Strong</option>
                <option [ngValue]="3">3 — Meets Baseline</option>
                <option [ngValue]="2">2 — Below Baseline</option>
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Recommendation *</label>
              <select 
                [(ngModel)]="newScorecard.recommendation" 
                class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="Strong Hire">Strong Hire</option>
                <option value="Hire">Hire</option>
                <option value="Hold">Hold</option>
                <option value="Reject">Reject</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Evaluation Notes *</label>
            <textarea
              [(ngModel)]="newScorecard.notes"
              rows="3"
              placeholder="Detailed interview observations..."
              class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            ></textarea>
          </div>
        </div>

        <div footer class="flex items-center gap-2">
          <button 
            type="button" 
            (click)="isAddScorecardOpen = false"
            class="px-3.5 py-1.5 text-xs font-semibold text-slate-600 border border-slate-300 rounded-lg bg-white"
          >
            Cancel
          </button>
          <button 
            type="button" 
            (click)="saveScorecard()"
            class="px-3.5 py-1.5 text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-lg shadow-xs"
          >
            Save Scorecard
          </button>
        </div>
      </app-modal>

      <!-- Add Note Modal -->
      <app-modal
        [(isOpen)]="isAddNoteOpen"
        title="Add Internal Note"
        subtitle="Log internal assessment note."
        size="sm"
      >
        <div class="space-y-3 text-xs">
          <textarea
            [(ngModel)]="newNoteContent"
            rows="4"
            placeholder="Type internal note details..."
            class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          ></textarea>
        </div>

        <div footer class="flex items-center gap-2">
          <button 
            type="button" 
            (click)="isAddNoteOpen = false"
            class="px-3.5 py-1.5 text-xs font-semibold text-slate-600 border border-slate-300 rounded-lg bg-white"
          >
            Cancel
          </button>
          <button 
            type="button" 
            (click)="saveNote()"
            class="px-3.5 py-1.5 text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-lg shadow-xs"
          >
            Save Note
          </button>
        </div>
      </app-modal>
    </div>

    <ng-template #notFound>
      <div class="py-16 text-center max-w-md mx-auto">
        <h2 class="text-lg font-bold text-slate-800">Candidate Not Found</h2>
        <p class="text-xs text-slate-500 mt-1">The requested candidate record does not exist.</p>
        <a 
          routerLink="/recruitment/candidates"
          class="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-brand-500 text-white rounded-lg text-xs font-semibold shadow-xs"
        >
          Return to Candidates Directory
        </a>
      </div>
    </ng-template>
  `
})
export class RecruitmentCandidateDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private candidateService = inject(CandidateService);
  private toastService = inject(ToastService);

  candidate?: Candidate;
  pipelineStages = PIPELINE_STAGES;

  activeTab: 'profile' | 'journey' | 'interviews' | 'notes' = 'profile';

  isAddScorecardOpen = false;
  isAddNoteOpen = false;
  isMoveStageOpen = false;

  newScorecard: InterviewScorecard = {
    interviewer: 'Rahul Sharma',
    date: new Date().toISOString().split('T')[0],
    round: 'Technical Architecture Round',
    rating: 5,
    recommendation: 'Strong Hire',
    notes: 'Candidate demonstrated outstanding depth.',
    technicalSkillsScore: 94,
    cultureFitScore: 92,
    communicationScore: 90
  };

  newNoteContent = '';
  newStageTarget: PipelineStage = 'Selected';

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadCandidate(id);
      }
    });
  }

  loadCandidate(id: string) {
    this.candidate = this.candidateService.getCandidateById(id);
    if (this.candidate) {
      this.newStageTarget = this.candidate.currentStage;
    }
  }

  saveScorecard() {
    if (!this.candidate) return;
    this.candidateService.addInterviewScorecard(this.candidate.id, { ...this.newScorecard });
    this.toastService.success('Scorecard Recorded', `Evaluation saved for ${this.candidate.name}.`);
    this.isAddScorecardOpen = false;
    this.loadCandidate(this.candidate.id);
  }

  saveNote() {
    if (!this.candidate || !this.newNoteContent) return;
    this.candidateService.addNote(this.candidate.id, 'Rahul Sharma', this.newNoteContent);
    this.toastService.success('Note Logged', 'Internal note saved.');
    this.isAddNoteOpen = false;
    this.newNoteContent = '';
    this.loadCandidate(this.candidate.id);
  }

  confirmStageAdvance() {
    if (!this.candidate) return;
    this.candidateService.updateStage(this.candidate.id, this.newStageTarget, `Advanced to ${this.newStageTarget}`);
    this.toastService.success('Stage Progressed', `${this.candidate.name} is now in stage "${this.newStageTarget}".`);
    this.isMoveStageOpen = false;
    this.loadCandidate(this.candidate.id);
  }
}
