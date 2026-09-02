import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PositionService } from '../../../core/services/position.service';
import { CandidateService } from '../../../core/services/candidate.service';
import { ToastService } from '../../../core/services/toast.service';
import { DEPARTMENTS } from '../../../core/constants/navigation.constant';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { SearchInputComponent } from '../../../shared/components/search-input/search-input.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import talentBankMock from '../../../../assets/mock/talent-bank.json';

interface TalentCandidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  experienceYears: number;
  currentCompany: string;
  previousIndustry: string;
  skills: string[];
  availability: string;
  expectedSalary: string;
  location: string;
  notes: string;
}

@Component({
  selector: 'app-recruitment-talent-bank',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    PageHeaderComponent,
    SearchInputComponent,
    IconComponent,
    ModalComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="space-y-6">
      <app-page-header
        title="Talent Bank & Silver Medalists"
        subtitle="Pre-vetted, high-caliber candidate database available for fast-track reassignment."
      >
        <div badges class="flex items-center gap-2">
          <span class="text-xs font-mono font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
            {{ talents.length }} Vetted Profiles
          </span>
        </div>

        <div actions class="flex items-center gap-2">
          <button
            type="button"
            (click)="resetFilters()"
            class="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
          >
            Reset Filters
          </button>
        </div>
      </app-page-header>

      <!-- Filter Bar -->
      <div class="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Search Talent</label>
            <app-search-input
              [value]="searchTerm"
              (valueChange)="searchTerm = $event"
              placeholder="Search by name, skills, company..."
            ></app-search-input>
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Department</label>
            <select
              [(ngModel)]="selectedDepartment"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="ALL">All Departments</option>
              <option *ngFor="let d of departments" [value]="d">{{ d }}</option>
            </select>
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Min. Experience</label>
            <select
              [(ngModel)]="selectedExperience"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="ALL">Any Experience</option>
              <option value="5">5+ Years</option>
              <option value="8">8+ Years</option>
            </select>
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Availability</label>
            <select
              [(ngModel)]="selectedAvailability"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="ALL">All Availabilities</option>
              <option value="Immediate">Immediate (< 15 Days)</option>
              <option value="30">30 Days Notice</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Talent Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          *ngFor="let t of filteredTalents()"
          class="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
        >
          <div>
            <div class="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 class="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors leading-snug">
                  {{ t.name }}
                </h3>
                <span class="text-xs text-slate-500 font-medium">{{ t.currentCompany }} • {{ t.location }}</span>
              </div>
              <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                {{ t.availability }}
              </span>
            </div>

            <div class="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
              <div class="flex items-center justify-between">
                <span class="text-slate-400">Department:</span>
                <span class="font-semibold text-slate-800">{{ t.department }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate-400">Total Experience:</span>
                <span class="font-mono font-medium text-slate-800">{{ t.experienceYears }} Years</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate-400">Previous Industry:</span>
                <span class="text-slate-700">{{ t.previousIndustry }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate-400">Expected Comp:</span>
                <span class="font-mono font-bold text-slate-900">{{ t.expectedSalary }}</span>
              </div>
            </div>

            <!-- Skills -->
            <div class="mt-3 flex flex-wrap gap-1">
              <span
                *ngFor="let sk of t.skills"
                class="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium"
              >
                {{ sk }}
              </span>
            </div>

            <!-- Notes -->
            <p class="mt-3 text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-100">
              "{{ t.notes }}"
            </p>
          </div>

          <!-- Card Actions -->
          <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              (click)="openTalentProfile(t)"
              class="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              <app-icon name="eye" [size]="13"></app-icon>
              View Profile
            </button>

            <button
              type="button"
              (click)="openAssignModal(t)"
              class="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1 transition-colors"
            >
              <app-icon name="plus" [size]="13"></app-icon>
              Assign to Position
            </button>
          </div>
        </div>
      </div>

      <app-empty-state
        *ngIf="filteredTalents().length === 0"
        title="No talent profiles match"
        message="Try loosening your experience or availability filters."
        actionLabel="Reset Filters"
        (actionClick)="resetFilters()"
      ></app-empty-state>

      <!-- Assign to Position Modal -->
      <app-modal
        [(isOpen)]="isAssignModalOpen"
        [title]="'Assign Candidate to Vacancy: ' + (selectedTalent?.name || '')"
        subtitle="Fast-track candidate directly into the position's active recruitment pipeline."
        size="md"
      >
        <div *ngIf="selectedTalent" class="space-y-4 text-xs">
          <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span class="font-bold text-slate-800">{{ selectedTalent.name }}</span>
            <p class="text-slate-500 text-[11px] mt-0.5">{{ selectedTalent.experienceYears }} yrs exp • {{ selectedTalent.skills.join(', ') }}</p>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Select Open Position *</label>
            <select
              [(ngModel)]="targetPositionId"
              class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-900 font-medium"
            >
              <option *ngFor="let p of positionService.positions()" [value]="p.id">
                {{ p.id }} — {{ p.title }} ({{ p.department }})
              </option>
            </select>
          </div>
        </div>

        <div footer class="flex items-center gap-2">
          <button 
            type="button" 
            (click)="isAssignModalOpen = false"
            class="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg bg-white"
          >
            Cancel
          </button>
          <button 
            type="button" 
            (click)="confirmAssignment()"
            class="px-3.5 py-1.5 text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-lg shadow-xs"
          >
            Confirm Pipeline Entry
          </button>
        </div>
      </app-modal>

      <!-- View Talent Profile Modal -->
      <app-modal
        [(isOpen)]="isProfileModalOpen"
        [title]="'Talent Profile: ' + (selectedTalent?.name || '')"
        subtitle="Silver medalist details and assessment archive."
        size="md"
      >
        <div *ngIf="selectedTalent" class="space-y-3 text-xs text-slate-700">
          <div class="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h3 class="text-sm font-bold text-slate-900">{{ selectedTalent.name }}</h3>
            <p class="text-slate-500 mt-0.5">{{ selectedTalent.email }} • {{ selectedTalent.phone }}</p>
            <div class="mt-2 flex items-center gap-2 text-[11px]">
              <span class="font-semibold text-slate-800">Location:</span> {{ selectedTalent.location }}
              <span>•</span>
              <span class="font-semibold text-slate-800">Availability:</span> {{ selectedTalent.availability }}
            </div>
          </div>

          <div>
            <span class="font-bold text-slate-900 block mb-1">Competency Highlights</span>
            <div class="flex flex-wrap gap-1.5">
              <span *ngFor="let s of selectedTalent.skills" class="px-2.5 py-1 rounded bg-white border border-slate-300 font-semibold text-slate-800">
                {{ s }}
              </span>
            </div>
          </div>

          <div>
            <span class="font-bold text-slate-900 block mb-1">Previous Interviewer Assessment</span>
            <p class="p-3 bg-slate-50 rounded border border-slate-200 leading-relaxed text-slate-600">
              {{ selectedTalent.notes }}
            </p>
          </div>
        </div>

        <div footer class="flex items-center gap-2">
          <button 
            type="button" 
            (click)="isProfileModalOpen = false"
            class="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg bg-white"
          >
            Close
          </button>
          <button 
            type="button" 
            (click)="isProfileModalOpen = false; openAssignModal(selectedTalent!)"
            class="px-4 py-2 text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-lg shadow-xs"
          >
            Assign Candidate
          </button>
        </div>
      </app-modal>
    </div>
  `
})
export class RecruitmentTalentBankComponent {
  positionService = inject(PositionService);
  private candidateService = inject(CandidateService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  talents: TalentCandidate[] = talentBankMock as TalentCandidate[];
  departments = DEPARTMENTS;

  searchTerm = '';
  selectedDepartment = 'ALL';
  selectedExperience = 'ALL';
  selectedAvailability = 'ALL';

  isAssignModalOpen = false;
  isProfileModalOpen = false;
  selectedTalent?: TalentCandidate;
  targetPositionId = 'POS-101';

  filteredTalents = computed(() => {
    return this.talents.filter(t => {
      const matchesSearch = !this.searchTerm ||
        t.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        t.currentCompany.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        t.skills.some(s => s.toLowerCase().includes(this.searchTerm.toLowerCase()));

      const matchesDept = this.selectedDepartment === 'ALL' || t.department === this.selectedDepartment;
      
      let matchesExp = true;
      if (this.selectedExperience === '5') matchesExp = t.experienceYears >= 5;
      if (this.selectedExperience === '8') matchesExp = t.experienceYears >= 8;

      let matchesAvail = true;
      if (this.selectedAvailability === 'Immediate') matchesAvail = t.availability.toLowerCase().includes('immediate');
      if (this.selectedAvailability === '30') matchesAvail = t.availability.toLowerCase().includes('30');

      return matchesSearch && matchesDept && matchesExp && matchesAvail;
    });
  });

  openTalentProfile(t: TalentCandidate) {
    this.selectedTalent = t;
    this.isProfileModalOpen = true;
  }

  openAssignModal(t: TalentCandidate) {
    this.selectedTalent = t;
    if (this.positionService.positions().length > 0) {
      this.targetPositionId = this.positionService.positions()[0].id;
    }
    this.isAssignModalOpen = true;
  }

  confirmAssignment() {
    if (!this.selectedTalent) return;
    const targetPos = this.positionService.getPositionById(this.targetPositionId);
    if (!targetPos) return;

    const newCandidate = this.candidateService.assignTalentToPosition(
      this.selectedTalent,
      targetPos.id,
      targetPos.title,
      targetPos.department
    );

    this.toastService.success(
      'Candidate Assigned to Position',
      `${this.selectedTalent.name} added to pipeline for ${targetPos.title} (${targetPos.id}).`
    );

    this.isAssignModalOpen = false;
    this.router.navigate(['/recruitment/candidates', newCandidate.id]);
  }

  resetFilters() {
    this.searchTerm = '';
    this.selectedDepartment = 'ALL';
    this.selectedExperience = 'ALL';
    this.selectedAvailability = 'ALL';
  }
}
