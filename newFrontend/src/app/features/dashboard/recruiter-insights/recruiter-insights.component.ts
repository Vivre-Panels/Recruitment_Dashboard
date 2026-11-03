import { Component, computed, HostListener, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RecruiterService } from '../../../core/services/recruiter.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-recruiter-insights',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PageHeaderComponent, IconComponent],
  template: `
    <div class="app-page-container">
      <app-page-header [compact]="true" title="Recruiter Wise Monthly Insight" subtitle="Recruitment records loaded from the database across 8 funnel stages.">
        <a actions routerLink="/dashboard/overview" class="app-btn-secondary inline-flex items-center gap-2"><app-icon name="arrow-left" [size]="14"></app-icon>Back to Dashboard</a>
      </app-page-header>

      <section class="app-card p-5">
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1fr_1fr_180px_180px_auto] gap-4 items-end">
          <div class="relative insight-filter-dropdown">
            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Recruiter Name</label>
            <button type="button" (click)="toggleDropdown('recruiter')" [attr.aria-expanded]="activeDropdown() === 'recruiter'" class="w-full h-11 px-3.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 shadow-sm hover:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100 transition flex items-center justify-between gap-3">
              <span class="truncate">{{ recruiterFilter() === 'ALL' ? 'All Recruiters' : recruiterFilter() }}</span><app-icon name="chevron-down" [size]="15" class="text-slate-400 shrink-0"></app-icon>
            </button>
            <div *ngIf="activeDropdown() === 'recruiter'" (click)="$event.stopPropagation()" class="absolute z-30 mt-2 w-full min-w-[260px] rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
              <div class="relative mb-2"><app-icon name="search" [size]="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></app-icon><input type="text" [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)" placeholder="Search recruiters..." class="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100" /></div>
              <div class="max-h-56 overflow-y-auto">
                <button type="button" (click)="selectRecruiter('ALL')" class="w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold hover:bg-slate-50" [ngClass]="recruiterFilter() === 'ALL' ? 'bg-brand-50 text-brand-700' : 'text-slate-700'">All Recruiters</button>
                <button *ngFor="let value of filteredRecruiters()" type="button" (click)="selectRecruiter(value)" class="w-full rounded-xl px-3 py-2.5 text-left text-sm hover:bg-slate-50" [ngClass]="recruiterFilter() === value ? 'bg-brand-50 text-brand-700' : 'text-slate-700'">{{ value }}</button>
                <p *ngIf="filteredRecruiters().length === 0" class="px-3 py-4 text-center text-xs text-slate-500">No recruiters found</p>
              </div>
            </div>
          </div>

          <div class="relative insight-filter-dropdown">
            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Position</label>
            <button type="button" (click)="toggleDropdown('position')" [attr.aria-expanded]="activeDropdown() === 'position'" class="w-full h-11 px-3.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 shadow-sm hover:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100 transition flex items-center justify-between gap-3">
              <span class="truncate">{{ positionFilter() === 'ALL' ? 'All Positions' : positionFilter() }}</span><app-icon name="chevron-down" [size]="15" class="text-slate-400 shrink-0"></app-icon>
            </button>
            <div *ngIf="activeDropdown() === 'position'" (click)="$event.stopPropagation()" class="absolute z-30 mt-2 w-full min-w-[320px] rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
              <div class="relative mb-2"><app-icon name="search" [size]="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></app-icon><input type="text" [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)" placeholder="Search positions..." class="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100" /></div>
              <div class="max-h-64 overflow-y-auto">
                <button type="button" (click)="selectPosition('ALL')" class="w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold hover:bg-slate-50" [ngClass]="positionFilter() === 'ALL' ? 'bg-brand-50 text-brand-700' : 'text-slate-700'">All Positions</button>
                <button *ngFor="let value of filteredPositions()" type="button" (click)="selectPosition(value)" class="w-full rounded-xl px-3 py-2.5 text-left text-sm hover:bg-slate-50" [ngClass]="positionFilter() === value ? 'bg-brand-50 text-brand-700' : 'text-slate-700'">{{ value }}</button>
                <p *ngIf="filteredPositions().length === 0" class="px-3 py-4 text-center text-xs text-slate-500">No positions found</p>
              </div>
            </div>
          </div>

          <div><label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">From Date</label><input type="date" [ngModel]="fromDate()" (ngModelChange)="fromDate.set($event); loadData()" class="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-brand-100 focus:border-brand-400" /></div>
          <div><label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">To Date</label><input type="date" [ngModel]="toDate()" (ngModelChange)="toDate.set($event); loadData()" class="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-brand-100 focus:border-brand-400" /></div>
          <button type="button" (click)="resetFilters()" class="h-11 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold inline-flex items-center justify-center gap-2 transition"><app-icon name="rotate-ccw" [size]="14"></app-icon>Reset</button>
        </div>
      </section>

      <section class="app-card p-0 overflow-hidden">
        <div *ngIf="isLoading()" class="py-16 flex items-center justify-center gap-3 text-sm font-semibold text-slate-500"><span class="w-5 h-5 rounded-full border-2 border-brand-500 border-t-transparent animate-spin"></span>Loading recruiter insights...</div>
        <div *ngIf="!isLoading()" class="overflow-auto max-h-[calc(100vh-330px)]">
          <table class="w-full min-w-[1250px] text-left text-xs whitespace-nowrap">
            <thead class="sticky top-0 z-10 bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr><th class="py-3.5 px-4 sticky left-0 bg-slate-50 z-20 border-r border-slate-200">Recruiter Name</th><th class="py-3.5 px-4">Department</th><th class="py-3.5 px-4">Position</th><th class="py-3.5 px-4">Open Date</th><th class="py-3.5 px-4">Target Date</th><th class="py-3.5 px-3 text-center bg-blue-50/50 text-blue-800">CV Sourced</th><th class="py-3.5 px-3 text-center bg-purple-50/50 text-purple-800">Approved</th><th class="py-3.5 px-3 text-center bg-sky-50/50 text-sky-800">Interviewed</th><th class="py-3.5 px-3 text-center bg-emerald-50/50 text-emerald-800">Selected</th><th class="py-3.5 px-3 text-center bg-indigo-50/50 text-indigo-800">Offered</th><th class="py-3.5 px-3 text-center bg-teal-50/50 text-teal-800">Accepted</th><th class="py-3.5 px-3 text-center bg-green-50/50 text-green-900">Joined</th><th class="py-3.5 px-3 text-center bg-amber-50/60 text-amber-900">15 Days Retention</th><th class="py-3.5 px-3 text-center bg-brand-50/60 text-brand-900">30 Days Retention</th></tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let row of rows()" class="hover:bg-slate-50/80 transition-colors"><td class="py-3.5 px-4 font-bold text-slate-900 sticky left-0 bg-white border-r border-slate-100">{{ row.recruiter_name }}</td><td class="py-3.5 px-4 font-semibold text-slate-700">{{ row.department || '—' }}</td><td class="py-3.5 px-4 font-semibold text-slate-700">{{ row.position }}</td><td class="py-3.5 px-4 font-mono text-slate-600">{{ row.open_date || '—' }}</td><td class="py-3.5 px-4 font-mono text-slate-600">{{ row.target_date || '—' }}</td><td class="py-3.5 px-3 text-center font-mono font-bold text-blue-700">{{ row.cv_sourced }}</td><td class="py-3.5 px-3 text-center font-mono font-bold text-purple-700">{{ row.approved }}</td><td class="py-3.5 px-3 text-center font-mono font-bold text-sky-700">{{ row.interviewed }}</td><td class="py-3.5 px-3 text-center font-mono font-bold text-emerald-700">{{ row.selected }}</td><td class="py-3.5 px-3 text-center font-mono font-bold text-indigo-700">{{ row.offered }}</td><td class="py-3.5 px-3 text-center font-mono font-bold text-teal-700">{{ row.accepted }}</td><td class="py-3.5 px-3 text-center font-mono font-bold text-green-700">{{ row.joined }}</td><td class="py-3.5 px-3 text-center font-mono font-extrabold text-amber-700">{{ row.retention_15d ?? '—' }}</td><td class="py-3.5 px-3 text-center font-mono font-extrabold text-brand-700">{{ row.retention_30d ?? '—' }}</td></tr>
              <tr *ngIf="rows().length === 0"><td colspan="14" class="py-16 text-center text-slate-500">No recruitment data matches the selected filters.</td></tr>
            </tbody>
          </table>
        </div>
        <footer *ngIf="!isLoading()" class="px-5 py-4 border-t border-slate-100 bg-slate-50 text-xs font-medium text-slate-500">Showing {{ rows().length }} database response records</footer>
      </section>
      <section *ngIf="!isLoading() && bottleneckReasons().length" class="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3"><app-icon name="alert-triangle" [size]="18" class="text-amber-700"></app-icon><div><div class="text-xs font-bold text-amber-900 uppercase tracking-wide">Database bottleneck reasons</div><p class="text-xs text-amber-800 mt-1">{{ bottleneckReasons().join(' · ') }}</p></div></section>
    </div>
  `
})
export class RecruiterInsightsComponent implements OnInit {
  private recruiterService = inject(RecruiterService);
  recruiterFilter = signal('ALL');
  positionFilter = signal('ALL');
  fromDate = signal('');
  toDate = signal('');
  activeDropdown = signal<'recruiter' | 'position' | null>(null);
  searchQuery = signal('');
  rows = signal<any[]>([]);
  options = signal<{ recruiters: string[]; positions: string[] }>({ recruiters: [], positions: [] });
  isLoading = signal(false);
  filteredRecruiters = computed(() => this.filterOptions(this.options().recruiters));
  filteredPositions = computed(() => this.filterOptions(this.options().positions));
  bottleneckReasons = computed(() => this.rows().filter(row => row.bottleneck_reason).map(row => `${row.recruiter_name} (${row.position}): ${row.bottleneck_reason}`));

  ngOnInit() { this.loadData(); }

  @HostListener('document:click', ['$event'])
  closeDropdownOnOutsideClick(event: MouseEvent) {
    if (!(event.target as HTMLElement | null)?.closest('.insight-filter-dropdown')) this.activeDropdown.set(null);
  }

  private filterOptions(values: string[]) {
    const query = this.searchQuery().trim().toLowerCase();
    return values.filter(value => !query || value.toLowerCase().includes(query));
  }

  toggleDropdown(name: 'recruiter' | 'position') {
    this.activeDropdown.set(this.activeDropdown() === name ? null : name);
    this.searchQuery.set('');
  }

  selectRecruiter(value: string) { this.recruiterFilter.set(value); this.activeDropdown.set(null); this.loadData(); }
  selectPosition(value: string) { this.positionFilter.set(value); this.activeDropdown.set(null); this.loadData(); }

  resetFilters() {
    this.recruiterFilter.set('ALL'); this.positionFilter.set('ALL'); this.fromDate.set(''); this.toDate.set(''); this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    this.recruiterService.getRecruiterInsights({
      recruiter: this.recruiterFilter(), position: this.positionFilter(), from: this.fromDate(), to: this.toDate()
    }).subscribe(response => {
      this.rows.set(response?.success ? response.data || [] : []);
      if (response?.filter_options) this.options.set(response.filter_options);
      this.isLoading.set(false);
    });
  }
}
