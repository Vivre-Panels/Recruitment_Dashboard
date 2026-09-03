import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PositionService } from '../../../core/services/position.service';
import { ToastService } from '../../../core/services/toast.service';
import { Position, PriorityLevel } from '../../../core/models/recruitment.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PriorityBadgeComponent } from '../../../shared/components/priority-badge/priority-badge.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { SearchInputComponent } from '../../../shared/components/search-input/search-input.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';

@Component({
  selector: 'app-recruitment-requirements',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    PageHeaderComponent,
    PriorityBadgeComponent,
    StatusBadgeComponent,
    SearchInputComponent,
    IconComponent,
    ModalComponent,
    LoadingStateComponent
  ],
  template: `
    <div class="space-y-6">
      <app-page-header
        title="Vacancy Requirement Cards"
        subtitle="Formal enterprise hiring mandates, job specifications, and approval governance documents."
      >
        <div badges class="flex items-center gap-2">
          <span class="text-xs font-mono font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
            {{ positionService.positions().length }} Approved Requisitions
          </span>
        </div>

        <div actions class="flex items-center gap-2">
          <app-search-input
            [value]="searchTerm"
            (valueChange)="searchTerm = $event"
            placeholder="Search requirement mandates..."
          ></app-search-input>
        </div>
      </app-page-header>

      <!-- Skeleton Cards Loader -->
      <app-loading-state *ngIf="positionService.isLoading()" type="cards"></app-loading-state>

      <!-- Cards Grid -->
      <div *ngIf="!positionService.isLoading()" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          *ngFor="let pos of filteredPositions()"
          class="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group"
        >
          <!-- Card Header -->
          <div>
            <div class="flex items-start justify-between gap-2 mb-2">
              <div class="flex items-center gap-1.5">
                <app-priority-badge [priority]="pos.priority"></app-priority-badge>
                <span class="text-[10px] font-mono font-medium px-1.5 py-0.2 bg-slate-100 text-slate-500 rounded">{{ pos.id }}</span>
              </div>
              <app-status-badge [status]="pos.status"></app-status-badge>
            </div>

            <h3 class="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors leading-snug">
              {{ pos.title }}
            </h3>
            <span class="text-xs text-slate-500 font-medium block mt-0.5">{{ pos.department }}</span>

            <!-- Key Spec Rows -->
            <div class="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
              <div class="flex items-center justify-between">
                <span class="text-slate-400">Headcount (HC):</span>
                <span class="font-bold text-slate-900">{{ pos.joinedHc }} Joined / {{ pos.requiredHc }} Target</span>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-slate-400">Target Date:</span>
                <span class="font-mono font-medium text-slate-800">{{ pos.targetDate }}</span>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-slate-400">Location:</span>
                <span class="text-slate-800 truncate max-w-[170px]">{{ pos.location }}</span>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-slate-400">Experience:</span>
                <span class="font-medium text-slate-800">{{ pos.experienceRange }}</span>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-slate-400">Hiring Manager:</span>
                <span class="text-slate-800 truncate max-w-[160px]">{{ pos.hiringManager }}</span>
              </div>
            </div>

            <!-- Skills Preview -->
            <div class="mt-3 flex flex-wrap gap-1">
              <span 
                *ngFor="let s of pos.mustHaveSkills.slice(0, 3)"
                class="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium"
              >
                {{ s }}
              </span>
              <span *ngIf="pos.mustHaveSkills.length > 3" class="text-[10px] text-slate-400 self-center">
                +{{ pos.mustHaveSkills.length - 3 }} more
              </span>
            </div>
          </div>

          <!-- Card Actions Footer -->
          <div class="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              (click)="openRequirementDoc(pos)"
              class="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              <app-icon name="file-text" [size]="13"></app-icon>
              View Document
            </button>

            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="duplicateRequirement(pos)"
                class="p-1 text-slate-400 hover:text-slate-700 rounded"
                title="Duplicate Requisition"
              >
                <app-icon name="copy" [size]="14"></app-icon>
              </button>
              <a
                [routerLink]="['/recruitment/positions', pos.id]"
                class="p-1 text-slate-400 hover:text-brand-600 rounded"
                title="Open Position"
              >
                <app-icon name="eye" [size]="14"></app-icon>
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Formal Requirement Document Modal -->
      <app-modal
        [(isOpen)]="isDocModalOpen"
        [title]="'Formal Hiring Requisition Document: ' + (activeDocPosition?.id || '')"
        subtitle="Internal Mandate & Approval Specification"
        size="xl"
      >
        <div *ngIf="activeDocPosition" class="space-y-6 text-xs text-slate-800 p-2 font-sans">
          <!-- Document Header -->
          <div class="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
            <div>
              <span class="text-[10px] uppercase font-bold text-brand-400 tracking-wider">Enterprise Hiring Requisition</span>
              <h2 class="text-base font-bold tracking-tight text-white mt-0.5">{{ activeDocPosition.title }}</h2>
              <p class="text-xs text-slate-300 mt-1">{{ activeDocPosition.department }} • {{ activeDocPosition.location }}</p>
            </div>
            <div class="text-right">
              <div class="text-xs font-mono font-bold text-brand-300">REQ-APPROVED</div>
              <div class="text-[10px] text-slate-400 mt-1">Date: {{ activeDocPosition.createdAt }}</div>
            </div>
          </div>

          <!-- Financial & Headcount Governance Grid -->
          <div class="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span class="text-slate-400 uppercase text-[10px] font-bold block">Approved HC</span>
              <span class="text-sm font-bold text-slate-900 mt-0.5 block">{{ activeDocPosition.requiredHc }} Positions</span>
            </div>
            <div>
              <span class="text-slate-400 uppercase text-[10px] font-bold block">Budget Band</span>
              <span class="text-sm font-bold text-brand-700 mt-0.5 block">{{ activeDocPosition.salaryRange }}</span>
            </div>
            <div>
              <span class="text-slate-400 uppercase text-[10px] font-bold block">Target Joining</span>
              <span class="text-sm font-bold text-slate-900 font-mono mt-0.5 block">{{ activeDocPosition.targetDate }}</span>
            </div>
          </div>

          <!-- Mandate Description -->
          <div>
            <h4 class="font-bold text-slate-900 uppercase text-[11px] tracking-wider mb-1.5">1. Role Purpose & Mandate</h4>
            <p class="p-3 bg-slate-50 rounded-lg border border-slate-200 leading-relaxed text-slate-700">
              {{ activeDocPosition.description }}
            </p>
          </div>

          <!-- Must Have Competencies -->
          <div>
            <h4 class="font-bold text-slate-900 uppercase text-[11px] tracking-wider mb-1.5">2. Mandatory Core Competencies</h4>
            <div class="flex flex-wrap gap-1.5">
              <span 
                *ngFor="let m of activeDocPosition.mustHaveSkills"
                class="px-2.5 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-md font-semibold text-xs"
              >
                {{ m }}
              </span>
            </div>
          </div>

          <!-- Knockout Criteria -->
          <div>
            <h4 class="font-bold text-red-700 uppercase text-[11px] tracking-wider mb-1.5">3. Non-Negotiable Knockout Criteria</h4>
            <ul class="space-y-1">
              <li 
                *ngFor="let k of activeDocPosition.knockoutCriteria"
                class="p-2 bg-red-50 text-red-900 border border-red-100 rounded-md text-[11px] flex items-center gap-2"
              >
                <app-icon name="x" [size]="13" class="text-red-500"></app-icon>
                {{ k }}
              </li>
            </ul>
          </div>

          <!-- Stakeholder Signatures -->
          <div class="pt-4 border-t border-slate-200 grid grid-cols-2 gap-4 text-slate-500 text-[11px]">
            <div>
              <span class="block font-semibold text-slate-800">Hiring Manager Approval:</span>
              <span>{{ activeDocPosition.hiringManager }} (Digitally Signed)</span>
            </div>
            <div>
              <span class="block font-semibold text-slate-800">Lead Recruiter Assigned:</span>
              <span>{{ activeDocPosition.owner }}</span>
            </div>
          </div>
        </div>

        <div footer class="flex items-center gap-2">
          <button 
            type="button" 
            (click)="isDocModalOpen = false"
            class="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg bg-white"
          >
            Close Document
          </button>
          <button 
            type="button" 
            (click)="printDoc()"
            class="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
          >
            Print Requisition
          </button>
        </div>
      </app-modal>
    </div>
  `
})
export class RecruitmentRequirementsComponent {
  positionService = inject(PositionService);
  private toastService = inject(ToastService);

  searchTerm = '';
  isDocModalOpen = false;
  activeDocPosition?: Position;

  filteredPositions = computed(() => {
    return this.positionService.positions().filter(p => {
      if (!this.searchTerm) return true;
      const q = this.searchTerm.toLowerCase();
      return p.title.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q) ||
        p.owner.toLowerCase().includes(q);
    });
  });

  openRequirementDoc(pos: Position) {
    this.activeDocPosition = pos;
    this.isDocModalOpen = true;
  }

  duplicateRequirement(pos: Position) {
    const duplicated = this.positionService.createPosition({
      title: `${pos.title} (Clone)`,
      department: pos.department,
      requiredHc: pos.requiredHc,
      priority: pos.priority,
      targetDate: pos.targetDate,
      hiringManager: pos.hiringManager,
      owner: pos.owner,
      salaryRange: pos.salaryRange,
      location: pos.location,
      experienceRange: pos.experienceRange,
      mustHaveSkills: [...pos.mustHaveSkills],
      knockoutCriteria: [...pos.knockoutCriteria],
      description: pos.description
    });

    this.toastService.success(
      'Requirement Duplicated',
      `Cloned ${pos.id} into new vacancy ${duplicated.id}.`
    );
  }

  printDoc() {
    this.toastService.info('Requisition Exported', 'Document sent to print preview queue.');
  }
}
