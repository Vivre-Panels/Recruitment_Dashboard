import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { PositionService } from '../../../core/services/position.service';
import { CandidateService } from '../../../core/services/candidate.service';
import { ToastService } from '../../../core/services/toast.service';
import { DEPARTMENTS } from '../../../core/constants/navigation.constant';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { SearchInputComponent } from '../../../shared/components/search-input/search-input.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { environment } from '../../../../environments/environment';

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
    EmptyStateComponent,
    LoadingStateComponent,
    PaginationComponent
  ],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto">
      <!-- Page Header -->
      <app-page-header
        title="Talent Bank Repository"
        subtitle="Silver medalist candidates and vetted talent pool ready for requisition assignment."
      >
        <div badges class="flex items-center gap-2">
          <span class="text-xs font-mono font-semibold px-2.5 py-0.5 bg-brand-50 text-brand-700 rounded-full border border-brand-200">
            {{ filteredTalents().length }} Profiles Available
          </span>
        </div>
      </app-page-header>

      <!-- Filter Controls Bar -->
      <div class="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-3">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex-1 max-w-md">
            <app-search-input
              [value]="searchTerm()"
              (valueChange)="searchTerm.set($event)"
              placeholder="Search talent name, previous company, skills..."
            ></app-search-input>
          </div>

          <div class="flex items-center gap-2">
            <button
              *ngIf="searchTerm() || selectedDepartment() !== 'ALL' || selectedExperience() !== 'ALL'"
              type="button"
              (click)="resetFilters()"
              class="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-2 cursor-pointer"
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
              (ngModelChange)="selectedDepartment.set($event)"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="ALL">All Departments</option>
              <option *ngFor="let d of departments" [value]="d">{{ d }}</option>
            </select>
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Min. Experience</label>
            <select
              [ngModel]="selectedExperience()"
              (ngModelChange)="selectedExperience.set($event)"
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
              [ngModel]="selectedAvailability()"
              (ngModelChange)="selectedAvailability.set($event)"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="ALL">All Availabilities</option>
              <option value="Immediate">Immediate (15 Days)</option>
              <option value="30">30 Days Notice</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Skeleton Cards Loader -->
      <app-loading-state *ngIf="isLoading()" type="cards"></app-loading-state>

      <!-- Talent Cards Grid -->
      <div *ngIf="!isLoading()" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          *ngFor="let t of paginatedTalents()"
          class="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
        >
          <div>
            <!-- Header -->
            <div class="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 class="font-bold text-slate-900 text-sm group-hover:text-brand-600 transition-colors">{{ t.name }}</h3>
                <p class="text-xs text-slate-500 font-medium">{{ t.department }} • {{ t.location }}</p>
              </div>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {{ t.availability }}
              </span>
            </div>

            <!-- Details -->
            <div class="mt-3 space-y-1.5 text-xs text-slate-600">
              <div class="flex justify-between">
                <span class="text-slate-400">Sourcing Channel:</span>
                <span class="font-semibold text-slate-800">{{ t.currentCompany }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Experience:</span>
                <span class="font-mono font-bold text-slate-900">{{ t.experienceYears }} Years</span>
              </div>
              <div class="flex justify-between">
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
          <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
            <button
              type="button"
              (click)="openTalentProfile(t)"
              class="px-4 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <app-icon name="eye" [size]="13"></app-icon>
              View Profile
            </button>
          </div>
        </div>
      </div>

      <app-empty-state
        *ngIf="!isLoading() && filteredTalents().length === 0"
        title="No talent profiles match"
        message="Try loosening your experience or availability filters."
        actionLabel="Reset Filters"
        (actionClick)="resetFilters()"
      ></app-empty-state>

      <!-- Reusable Pagination Component -->
      <app-pagination
        *ngIf="!isLoading() && filteredTalents().length > 0"
        [totalItems]="filteredTalents().length"
        [currentPage]="currentPage()"
        [pageSize]="pageSize()"
        (pageChange)="onPageChange($event)"
        (pageSizeChange)="onPageSizeChange($event)"
      ></app-pagination>

      <!-- Assign Candidate Modal -->
      <app-modal
        [(isOpen)]="isAssignModalOpen"
        title="Assign Talent to Requisition"
        subtitle="Select open position to assign candidate into pipeline."
      >
        <div *ngIf="selectedTalent as t" class="space-y-4 text-xs">
          <div class="p-3 bg-brand-50/60 rounded-xl border border-brand-200">
            <span class="font-bold text-slate-900 block">{{ t.name }}</span>
            <span class="text-slate-600 text-[11px]">{{ t.department }} • {{ t.experienceYears }} yrs exp</span>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Target Requisition</label>
            <select
              [(ngModel)]="targetPositionId"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
            >
              <option *ngFor="let pos of positionService.positions()" [value]="pos.id">
                {{ pos.id }} — {{ pos.title }} ({{ pos.department }})
              </option>
            </select>
          </div>
        </div>

        <div footer class="flex items-center gap-2">
          <button 
            type="button" 
            (click)="isAssignModalOpen = false"
            class="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg bg-white cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="button" 
            (click)="confirmAssignment()"
            class="px-4 py-2 text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-lg shadow-xs cursor-pointer"
          >
            Confirm Pipeline Assignment
          </button>
        </div>
      </app-modal>

      <!-- Talent Profile Modal -->
      <app-modal
        [(isOpen)]="isProfileModalOpen"
        [title]="selectedTalent?.name || 'Talent Profile'"
        subtitle="Vetted candidate background & qualifications."
      >
        <div *ngIf="selectedTalent" class="space-y-4 text-xs">
          <div class="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span class="text-slate-400 text-[10px] font-bold uppercase block">Contact Phone</span>
              <span class="font-bold text-slate-900 font-mono">{{ selectedTalent.phone }}</span>
            </div>
            <div>
              <span class="text-slate-400 text-[10px] font-bold uppercase block">Email Address</span>
              <span class="font-bold text-slate-900 font-mono">{{ selectedTalent.email }}</span>
            </div>
            <div>
              <span class="text-slate-400 text-[10px] font-bold uppercase block">Current Company</span>
              <span class="font-bold text-slate-900">{{ selectedTalent.currentCompany }}</span>
            </div>
            <div>
              <span class="text-slate-400 text-[10px] font-bold uppercase block">Location</span>
              <span class="font-bold text-slate-900">{{ selectedTalent.location }}</span>
            </div>
          </div>

          <div>
            <span class="font-bold text-slate-900 block mb-1">Previous Interviewer Assessment</span>
            <p class="p-3 bg-slate-50 rounded border border-slate-200 leading-relaxed text-slate-600 italic">
              "{{ selectedTalent.notes }}"
            </p>
          </div>
        </div>

        <div footer class="flex items-center gap-2">
          <button 
            type="button" 
            (click)="isProfileModalOpen = false"
            class="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg bg-white cursor-pointer"
          >
            Close
          </button>
          <button 
            type="button" 
            (click)="isProfileModalOpen = false; openAssignModal(selectedTalent!)"
            class="px-4 py-2 text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-lg shadow-xs cursor-pointer"
          >
            Assign Candidate
          </button>
        </div>
      </app-modal>
    </div>
  `
})
export class RecruitmentTalentBankComponent implements OnInit {
  positionService = inject(PositionService);
  private candidateService = inject(CandidateService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private http = inject(HttpClient);

  talents = signal<TalentCandidate[]>([]);
  isLoading = signal<boolean>(true);
  departments = DEPARTMENTS;

  searchTerm = signal('');
  selectedDepartment = signal('ALL');
  selectedExperience = signal('ALL');
  selectedAvailability = signal('ALL');

  isAssignModalOpen = false;
  isProfileModalOpen = false;
  selectedTalent?: TalentCandidate;
  targetPositionId = 'POS-101';

  currentPage = signal(1);
  pageSize = signal(12);

  ngOnInit() {
    this.loadTalentBank();
  }

  loadTalentBank() {
    this.isLoading.set(true);
    this.http.get<{ success: boolean; data: any[] }>(`${environment.apiUrl}/talent-bank`).subscribe({
      next: (res) => {
        let loaded: TalentCandidate[] = [];
        if (res.success && res.data && res.data.length > 0) {
          loaded = res.data.map(item => ({
            id: item.application_id || `TAL-${item.id}`,
            name: item.candidate_name || 'Vetted Candidate',
            email: `${(item.candidate_name || 'candidate').toLowerCase().replace(/\s+/g, '.')}@example.com`,
            phone: item.mobile || '',
            department: item.position || 'Engineering',
            experienceYears: 5,
            currentCompany: 'Vetted Pool',
            previousIndustry: 'Enterprise Services',
            skills: item.candidate_attributes ? item.candidate_attributes.split(',') : ['High Potential'],
            availability: 'Immediate (15 days)',
            expectedSalary: 'Competitive',
            location: 'Kolkata, IN',
            notes: item.profile_summary || 'Vetted talent available for immediate assignment.'
          }));
        } else {
          const cands = this.candidateService.candidates();
          loaded = cands.slice(0, 6).map(c => ({
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
            department: c.department || 'Operations',
            experienceYears: c.experienceYears || 4,
            currentCompany: c.currentCompany || 'Vetted Pool',
            previousIndustry: 'Industry Talent',
            skills: c.skills,
            availability: '15-30 days',
            expectedSalary: c.expectedSalary || 'As Per Profile',
            location: c.location || 'Kolkata, IN',
            notes: `${c.name} evaluated with CV Score ${c.qualityScore}%. Available in silver medalist talent pool.`
          }));
        }
        this.talents.set(loaded);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.warn('Talent bank API connection failed:', err);
        this.isLoading.set(false);
      }
    });
  }

  filteredTalents = computed(() => {
    const q = this.searchTerm().toLowerCase().trim();
    const dept = this.selectedDepartment();
    const exp = this.selectedExperience();

    return this.talents().filter(t => {
      const matchesSearch = !q ||
        t.name.toLowerCase().includes(q) ||
        t.currentCompany.toLowerCase().includes(q) ||
        t.skills.some(s => s.toLowerCase().includes(q));

      const matchesDept = dept === 'ALL' || t.department === dept;
      
      let matchesExp = true;
      if (exp === '5') matchesExp = t.experienceYears >= 5;
      if (exp === '8') matchesExp = t.experienceYears >= 8;

      return matchesSearch && matchesDept && matchesExp;
    });
  });

  paginatedTalents = computed(() => {
    const list = this.filteredTalents();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  onPageChange(page: number) {
    this.currentPage.set(page);
  }

  onPageSizeChange(size: number) {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

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
    this.searchTerm.set('');
    this.selectedDepartment.set('ALL');
    this.selectedExperience.set('ALL');
    this.selectedAvailability.set('ALL');
    this.currentPage.set(1);
  }
}
