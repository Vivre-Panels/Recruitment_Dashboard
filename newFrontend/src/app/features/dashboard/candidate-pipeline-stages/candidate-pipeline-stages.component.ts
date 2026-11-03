import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CandidateService } from '../../../core/services/candidate.service';
import { PositionService } from '../../../core/services/position.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-candidate-pipeline-stages',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PageHeaderComponent, IconComponent],
  template: `
    <div class="app-page-container !p-2 -mt-3 !max-w-6xl">
      <app-page-header [compact]="true" title="Candidate Pipeline Stages">
        <a actions routerLink="/dashboard/overview" class="app-btn-secondary inline-flex items-center gap-2"><app-icon name="arrow-left" [size]="14"></app-icon>Back to Dashboard</a>
      </app-page-header>

      <section class="app-card candidate-pipeline-container !p-4 flex flex-col min-h-0 overflow-visible">
        <div class="ml-auto w-full sm:max-w-xl pipeline-position-dropdown flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-4 shrink-0">
        <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Position Title</label>
        <div class="relative w-full sm:max-w-md">
          <div class="relative flex items-center">
            <app-icon name="search" [size]="15" class="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 pointer-events-none"></app-icon>
            <input type="text" [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event); dropdownOpen.set(true)" (focus)="dropdownOpen.set(true)" placeholder="Search or select a position..." class="w-full h-10 pl-10 pr-10 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100" />
          <button *ngIf="selectedPosition() || searchQuery()" type="button" (click)="selectPosition('')" class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 hover:text-slate-700"><app-icon name="x" [size]="14"></app-icon></button>
          </div>
          <div *ngIf="dropdownOpen()" class="absolute z-20 top-full mt-2 w-full rounded-xl border border-slate-200 bg-white p-1 shadow-xl max-h-64 overflow-y-auto">
            <button type="button" (click)="selectPosition('ALL')" class="w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-brand-700 hover:bg-brand-50">All Positions</button>
            <button *ngFor="let title of filteredPositions()" type="button" (click)="selectPosition(title)" class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 truncate">{{ title }}</button>
            <p *ngIf="filteredPositions().length === 0" class="px-3 py-4 text-center text-xs text-slate-500">No matching positions found</p>
          </div>
        </div>
        </div>

        <div *ngIf="candidates.isLoading()" class="mt-4 py-7 border-t border-slate-100 flex items-center justify-center gap-3 text-sm font-semibold text-slate-500 shrink-0">
          <span class="w-5 h-5 rounded-full border-2 border-brand-500 border-t-transparent animate-spin"></span>
          Loading candidate stages...
        </div>
        <div *ngIf="!candidates.isLoading() && !selectedPosition()" class="mt-4 min-h-32 border-t border-slate-100 flex flex-col items-center justify-center text-center flex-1">
          <span class="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-2"><app-icon name="filter" [size]="16"></app-icon></span>
          <p class="text-sm font-bold text-slate-800">Select role from the dropdown</p>
          <p class="text-xs text-slate-500 mt-1">Choose a position to see its candidate stage counts.</p>
        </div>
        <div *ngIf="!candidates.isLoading() && selectedPosition()" class="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 flex-1 min-h-0 overflow-y-auto content-start">
          <article *ngFor="let stage of stages" class="p-4 rounded-2xl border flex flex-col justify-between min-h-32" [ngClass]="stage.bg + ' ' + stage.border">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-bold text-slate-700 uppercase tracking-wide">{{ stage.number }}. {{ stage.label }}</span>
              <span class="p-1.5 rounded-xl" [ngClass]="stage.iconBg"><app-icon [name]="stage.icon" [size]="14"></app-icon></span>
            </div>
            <div class="text-2xl font-extrabold font-mono" [ngClass]="stage.text">{{ counts()[stage.key] }}</div>
          </article>
        </div>
      </section>
    </div>
  `
})
export class CandidatePipelineStagesComponent {
  candidates = inject(CandidateService);
  private positions = inject(PositionService);
  selectedPosition = signal('');
  searchQuery = signal('');
  dropdownOpen = signal(false);

  stages = [
    { key: 'sourced', label: 'Sourced', number: '1', icon: 'users', bg: 'bg-blue-50/60', border: 'border-blue-200', text: 'text-blue-700', iconBg: 'bg-blue-100 text-blue-700' },
    { key: 'screening', label: 'Screening', number: '2', icon: 'filter', bg: 'bg-purple-50/60', border: 'border-purple-200', text: 'text-purple-700', iconBg: 'bg-purple-100 text-purple-700' },
    { key: 'interviewed', label: 'Interviewed', number: '3', icon: 'activity', bg: 'bg-sky-50/60', border: 'border-sky-200', text: 'text-sky-700', iconBg: 'bg-sky-100 text-sky-700' },
    { key: 'pipeline', label: 'Pipeline', number: '4', icon: 'kanban', bg: 'bg-indigo-50/60', border: 'border-indigo-200', text: 'text-indigo-700', iconBg: 'bg-indigo-100 text-indigo-700' },
    { key: 'in_progress', label: 'In Progress', number: '5', icon: 'clock', bg: 'bg-amber-50/60', border: 'border-amber-200', text: 'text-amber-700', iconBg: 'bg-amber-100 text-amber-700' },
    { key: 'shortlisted', label: 'Shortlisted', number: '6', icon: 'sparkles', bg: 'bg-emerald-50/60', border: 'border-emerald-200', text: 'text-emerald-700', iconBg: 'bg-emerald-100 text-emerald-700' },
    { key: 'follow_up', label: 'Follow Up', number: '7', icon: 'phone', bg: 'bg-yellow-50/60', border: 'border-yellow-200', text: 'text-yellow-700', iconBg: 'bg-yellow-100 text-yellow-700' },
    { key: 'rejected', label: 'Rejected', number: '8', icon: 'x', bg: 'bg-rose-50/60', border: 'border-rose-200', text: 'text-rose-700', iconBg: 'bg-rose-100 text-rose-700' },
    { key: 'hired', label: 'Hired', number: '9', icon: 'check-circle', bg: 'bg-green-50/60', border: 'border-green-200', text: 'text-green-700', iconBg: 'bg-green-100 text-green-700' }
  ];

  positionsList = computed(() => [...new Set([
    ...this.positions.positions().map(position => position.title),
    ...this.candidates.candidates().map(candidate => candidate.positionTitle)
  ].filter(Boolean))].sort((a, b) => a.localeCompare(b)));

  filteredPositions = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    return this.positionsList().filter(title => title.toLowerCase().includes(query));
  });

  @HostListener('document:click', ['$event'])
  closeDropdownOnOutsideClick(event: MouseEvent) {
    if (!(event.target as HTMLElement | null)?.closest('.pipeline-position-dropdown')) {
      this.dropdownOpen.set(false);
    }
  }

  counts = computed(() => {
    const result: Record<string, number> = { sourced: 0, screening: 0, interviewed: 0, pipeline: 0, in_progress: 0, shortlisted: 0, follow_up: 0, rejected: 0, hired: 0 };
    const selection = this.selectedPosition();
    if (!selection) return result;
    const candidates = this.candidates.candidates().filter(candidate => selection === 'ALL' || candidate.positionTitle.toLowerCase() === selection.toLowerCase());
    result['sourced'] = candidates.length;
    for (const candidate of candidates) {
      const callTime = (candidate.telleCallingTime || '').trim();
      if (callTime && callTime !== 'null' && callTime !== 'undefined') { result['screening']++; continue; }
      const raw = `${candidate.currentStage || ''} ${candidate.status || ''} ${candidate.rawStatus || ''}`.toLowerCase();
      const normalized = raw.replace(/[\s\-_]+/g, '');
      if (normalized.includes('followup')) result['follow_up']++;
      else if (normalized.includes('reject') || normalized.includes('drop') || normalized.includes('unsuitable') || normalized.includes('notinterested') || /future[\s\-_]*(?:hireable|hirable)/i.test(raw)) result['rejected']++;
      else if (['join', 'offer', 'accept', 'hire', 'success'].some(value => normalized.includes(value))) result['hired']++;
      else if (normalized.includes('round') || normalized.includes('inprogress') || normalized.includes('process')) result['in_progress']++;
      else if (['select', 'shortlist', 'approved', 'telecall'].some(value => normalized.includes(value))) result['shortlisted']++;
      else if (normalized.includes('interview') || normalized.includes('manager')) result['interviewed']++;
      else if (normalized.includes('screen')) result['screening']++;
      else if (normalized.includes('pipeline')) result['pipeline']++;
    }
    return result;
  });

  selectPosition(position: string) {
    this.selectedPosition.set(position);
    this.searchQuery.set(position === 'ALL' ? 'All Positions' : position);
    this.dropdownOpen.set(false);
  }
}
