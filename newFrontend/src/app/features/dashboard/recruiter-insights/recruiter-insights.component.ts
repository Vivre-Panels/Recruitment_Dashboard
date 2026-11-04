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
    <div class="app-page-container !p-2 -mt-3">
      <app-page-header [compact]="true" title="Recruiter Wise Monthly Insight">
        <a actions routerLink="/dashboard/overview" class="app-btn-secondary inline-flex items-center gap-2"><app-icon name="arrow-left" [size]="14"></app-icon>Back to Dashboard</a>
      </app-page-header>

      <section class="app-card p-3">
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[minmax(220px,1.15fr)_minmax(240px,1.15fr)_minmax(150px,.7fr)_minmax(150px,.7fr)_auto] gap-2 items-end">
          <div class="relative insight-filter-dropdown">
            <label class="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Recruiter Name</label>
            <button type="button" (click)="toggleDropdown('recruiter')" [attr.aria-expanded]="activeDropdown() === 'recruiter'" class="w-full h-9 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 hover:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 transition flex items-center justify-between gap-2">
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
            <label class="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Position</label>
            <button type="button" (click)="toggleDropdown('position')" [attr.aria-expanded]="activeDropdown() === 'position'" class="w-full h-9 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 hover:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 transition flex items-center justify-between gap-2">
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

          <div class="relative insight-calendar">
            <label class="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">From Date</label>
            <button type="button" (click)="toggleCalendar('from')" [attr.aria-expanded]="activeCalendar() === 'from'" class="w-full h-9 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-left text-slate-800 hover:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 transition flex items-center justify-between gap-2">
              <span [ngClass]="fromDate() ? 'text-slate-800' : 'text-slate-400'">{{ fromDate() ? formatDate(fromDate()) : 'Select start date' }}</span><app-icon name="calendar" [size]="15" class="text-slate-400 shrink-0"></app-icon>
            </button>
            <div *ngIf="activeCalendar() === 'from'" (click)="$event.stopPropagation()" class="absolute z-40 mt-2 w-[280px] rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
              <div class="mb-3 flex items-center justify-between"><button type="button" (click)="shiftCalendarMonth(-1)" aria-label="Previous month" class="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><app-icon name="chevron-left" [size]="16"></app-icon></button><span class="text-sm font-bold text-slate-800">{{ calendarMonthLabel() }}</span><button type="button" (click)="shiftCalendarMonth(1)" aria-label="Next month" class="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><app-icon name="chevron-right" [size]="16"></app-icon></button></div>
              <div class="mb-1 grid grid-cols-7 text-center text-[10px] font-bold uppercase text-slate-400"><span *ngFor="let day of weekDays">{{ day }}</span></div>
              <div class="grid grid-cols-7 gap-y-1"><ng-container *ngFor="let day of calendarDays()"><span *ngIf="!day" class="h-8"></span><button *ngIf="day" type="button" (click)="selectDate('from', day)" class="mx-auto grid h-8 w-8 place-items-center rounded-lg text-xs transition" [ngClass]="isSelectedDate('from', day) ? 'bg-brand-600 text-white font-bold shadow-sm' : isToday(day) ? 'border border-brand-300 text-brand-700 font-semibold hover:bg-brand-50' : 'text-slate-700 hover:bg-slate-100'">{{ day.getDate() }}</button></ng-container></div>
              <div class="mt-3 flex justify-between border-t border-slate-100 pt-2"><button type="button" (click)="clearDate('from')" class="text-xs font-semibold text-slate-500 hover:text-slate-800">Clear</button><button type="button" (click)="selectToday('from')" class="text-xs font-semibold text-brand-700 hover:text-brand-800">Today</button></div>
            </div>
          </div>
          <div class="relative insight-calendar">
            <label class="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">To Date</label>
            <button type="button" (click)="toggleCalendar('to')" [attr.aria-expanded]="activeCalendar() === 'to'" class="w-full h-9 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-left text-slate-800 hover:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 transition flex items-center justify-between gap-2">
              <span [ngClass]="toDate() ? 'text-slate-800' : 'text-slate-400'">{{ toDate() ? formatDate(toDate()) : 'Select end date' }}</span><app-icon name="calendar" [size]="15" class="text-slate-400 shrink-0"></app-icon>
            </button>
            <div *ngIf="activeCalendar() === 'to'" (click)="$event.stopPropagation()" class="absolute z-40 mt-2 w-[280px] rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
              <div class="mb-3 flex items-center justify-between"><button type="button" (click)="shiftCalendarMonth(-1)" aria-label="Previous month" class="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><app-icon name="chevron-left" [size]="16"></app-icon></button><span class="text-sm font-bold text-slate-800">{{ calendarMonthLabel() }}</span><button type="button" (click)="shiftCalendarMonth(1)" aria-label="Next month" class="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><app-icon name="chevron-right" [size]="16"></app-icon></button></div>
              <div class="mb-1 grid grid-cols-7 text-center text-[10px] font-bold uppercase text-slate-400"><span *ngFor="let day of weekDays">{{ day }}</span></div>
              <div class="grid grid-cols-7 gap-y-1"><ng-container *ngFor="let day of calendarDays()"><span *ngIf="!day" class="h-8"></span><button *ngIf="day" type="button" (click)="selectDate('to', day)" class="mx-auto grid h-8 w-8 place-items-center rounded-lg text-xs transition" [ngClass]="isSelectedDate('to', day) ? 'bg-brand-600 text-white font-bold shadow-sm' : isToday(day) ? 'border border-brand-300 text-brand-700 font-semibold hover:bg-brand-50' : 'text-slate-700 hover:bg-slate-100'">{{ day.getDate() }}</button></ng-container></div>
              <div class="mt-3 flex justify-between border-t border-slate-100 pt-2"><button type="button" (click)="clearDate('to')" class="text-xs font-semibold text-slate-500 hover:text-slate-800">Clear</button><button type="button" (click)="selectToday('to')" class="text-xs font-semibold text-brand-700 hover:text-brand-800">Today</button></div>
            </div>
          </div>
          <button type="button" (click)="resetFilters()" class="h-9 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition"><app-icon name="rotate-ccw" [size]="13"></app-icon>Reset</button>
        </div>
      </section>

      <section class="app-card p-0 overflow-hidden">
        <div *ngIf="isLoading()" class="py-16 flex items-center justify-center gap-3 text-sm font-semibold text-slate-500"><span class="w-5 h-5 rounded-full border-2 border-brand-500 border-t-transparent animate-spin"></span>Loading recruiter insights...</div>
        <div *ngIf="!isLoading()" class="relative h-[min(44vh,400px)] min-h-[300px] overflow-auto">
          <table class="w-full min-w-[1250px] text-left text-xs whitespace-nowrap">
            <thead class="sticky top-0 z-10 bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr><th class="py-3 px-3 sticky left-0 bg-slate-100 z-20 border-r border-slate-200">Recruiter Name</th><!-- <th class="py-3 px-3">Department</th> --><th class="py-3 px-3">Position</th><th class="py-3 px-3">Open Date</th><th class="py-3 px-3">Target Date</th><th class="py-3 px-2 text-center bg-blue-50 text-blue-800">CV Sourced</th><th class="py-3 px-2 text-center bg-purple-50 text-purple-800">Approved</th><th class="py-3 px-2 text-center bg-sky-50 text-sky-800">Interviewed</th><th class="py-3 px-2 text-center bg-emerald-50 text-emerald-800">Selected</th><th class="py-3 px-2 text-center bg-indigo-50 text-indigo-800">Offered</th><th class="py-3 px-2 text-center bg-teal-50 text-teal-800">Accepted</th><th class="py-3 px-2 text-center bg-green-50 text-green-900">Joined</th><th class="py-3 px-2 text-center bg-amber-50 text-amber-900 font-sans"><span class="tabular-nums font-extrabold">15</span> Days Retention</th><th class="py-3 px-2 text-center bg-brand-50 text-brand-900 font-sans"><span class="tabular-nums font-extrabold">30</span> Days Retention</th></tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let row of rows()" class="group hover:bg-slate-50 transition-colors"><td class="py-2.5 px-3 font-bold text-slate-900 sticky left-0 bg-white group-hover:bg-slate-50 border-r border-slate-100">{{ row.recruiter_name }}</td><!-- <td class="py-2.5 px-3 font-medium text-slate-600">{{ row.department || '—' }}</td> --><td class="py-2.5 px-3 font-semibold text-slate-800">{{ row.position }}</td><td class="py-2.5 px-3 font-mono text-slate-500">{{ row.open_date || '—' }}</td><td class="py-2.5 px-3 font-mono text-slate-500">{{ row.target_date || '—' }}</td><td class="py-2.5 px-2 text-center tabular-nums font-bold text-blue-700">{{ row.cv_sourced }}</td><td class="py-2.5 px-2 text-center tabular-nums font-bold text-purple-700">{{ row.approved }}</td><td class="py-2.5 px-2 text-center tabular-nums font-bold text-sky-700">{{ row.interviewed }}</td><td class="py-2.5 px-2 text-center tabular-nums font-bold text-emerald-700">{{ row.selected }}</td><td class="py-2.5 px-2 text-center tabular-nums font-bold text-indigo-700">{{ row.offered }}</td><td class="py-2.5 px-2 text-center tabular-nums font-bold text-teal-700">{{ row.accepted }}</td><td class="py-2.5 px-2 text-center tabular-nums font-bold text-green-700">{{ row.joined }}</td><td class="py-2.5 px-2 text-center tabular-nums font-extrabold text-amber-700">{{ row.retention_15d ?? '—' }}</td><td class="py-2.5 px-2 text-center tabular-nums font-extrabold text-brand-700">{{ row.retention_30d ?? '—' }}</td></tr>
              <tr *ngIf="rows().length > 0" class="sticky bottom-0 z-10 bg-slate-100 border-t-2 border-slate-300 shadow-[0_-3px_8px_rgba(15,23,42,0.06)]"><td class="py-2.5 px-3 sticky left-0 bg-slate-100 border-r border-slate-200 font-extrabold uppercase tracking-wide text-slate-800">Total</td><!-- <td class="py-2.5 px-3 text-slate-400">—</td> --><td class="py-2.5 px-3 text-slate-400">{{ rows().length }} positions</td><td class="py-2.5 px-3 text-slate-400">—</td><td class="py-2.5 px-3 text-slate-400">—</td><td class="py-2.5 px-2 text-center tabular-nums font-extrabold text-blue-800">{{ totalFor('cv_sourced') }}</td><td class="py-2.5 px-2 text-center tabular-nums font-extrabold text-purple-800">{{ totalFor('approved') }}</td><td class="py-2.5 px-2 text-center tabular-nums font-extrabold text-sky-800">{{ totalFor('interviewed') }}</td><td class="py-2.5 px-2 text-center tabular-nums font-extrabold text-emerald-800">{{ totalFor('selected') }}</td><td class="py-2.5 px-2 text-center tabular-nums font-extrabold text-indigo-800">{{ totalFor('offered') }}</td><td class="py-2.5 px-2 text-center tabular-nums font-extrabold text-teal-800">{{ totalFor('accepted') }}</td><td class="py-2.5 px-2 text-center tabular-nums font-extrabold text-green-800">{{ totalFor('joined') }}</td><td class="py-2.5 px-2 text-center tabular-nums font-extrabold text-amber-800">{{ totalFor('retention_15d') }}</td><td class="py-2.5 px-2 text-center tabular-nums font-extrabold text-brand-800">{{ totalFor('retention_30d') }}</td></tr>
            </tbody>
          </table>
          <div *ngIf="rows().length === 0" class="absolute inset-x-0 top-[42px] bottom-0 flex items-center justify-center bg-white/95 px-4 text-center text-sm font-medium text-slate-500">No recruitment data matches the selected filters.</div>
        </div>
        <footer *ngIf="!isLoading()" class="px-4 py-3 border-t border-slate-100 bg-slate-50 text-[11px] font-medium text-slate-500">Showing {{ rows().length }} database response records</footer>
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
  activeCalendar = signal<'from' | 'to' | null>(null);
  calendarCursor = signal(new Date());
  readonly weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  searchQuery = signal('');
  rows = signal<any[]>([]);
  options = signal<{ recruiters: string[]; positions: string[] }>({ recruiters: [], positions: [] });
  isLoading = signal(false);
  filteredRecruiters = computed(() => this.filterOptions(this.options().recruiters));
  filteredPositions = computed(() => this.filterOptions(this.options().positions));
  bottleneckReasons = computed(() => this.rows().filter(row => row.bottleneck_reason).map(row => `${row.recruiter_name} (${row.position}): ${row.bottleneck_reason}`));

  totalFor(column: string): number {
    return this.rows().reduce((total, row) => {
      const value = Number(row[column]);
      return total + (Number.isFinite(value) ? value : 0);
    }, 0);
  }

  ngOnInit() { this.loadData(); }

  @HostListener('document:click', ['$event'])
  closeDropdownOnOutsideClick(event: MouseEvent) {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.insight-filter-dropdown')) this.activeDropdown.set(null);
    if (!target?.closest('.insight-calendar')) this.activeCalendar.set(null);
  }

  toggleCalendar(which: 'from' | 'to') {
    if (this.activeCalendar() === which) { this.activeCalendar.set(null); return; }
    this.activeCalendar.set(which);
    const selected = this.parseDate(which === 'from' ? this.fromDate() : this.toDate());
    this.calendarCursor.set(selected || new Date());
  }

  shiftCalendarMonth(amount: number) {
    const date = this.calendarCursor();
    this.calendarCursor.set(new Date(date.getFullYear(), date.getMonth() + amount, 1));
  }

  calendarMonthLabel() { return this.calendarCursor().toLocaleDateString(undefined, { month: 'long', year: 'numeric' }); }

  calendarDays(): Array<Date | null> {
    const cursor = this.calendarCursor();
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const offset = first.getDay();
    const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    return [...Array<Date | null>(offset).fill(null), ...Array.from({ length: days }, (_, index) => new Date(cursor.getFullYear(), cursor.getMonth(), index + 1))];
  }

  formatDate(value: string) {
    const date = this.parseDate(value);
    return date?.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) || value;
  }

  selectDate(which: 'from' | 'to', date: Date) {
    this.setDate(which, this.toDateValue(date));
  }

  selectToday(which: 'from' | 'to') { this.selectDate(which, new Date()); }

  clearDate(which: 'from' | 'to') { this.setDate(which, ''); }

  private setDate(which: 'from' | 'to', value: string) {
    (which === 'from' ? this.fromDate : this.toDate).set(value);
    this.activeCalendar.set(null);
    this.loadData();
  }

  isSelectedDate(which: 'from' | 'to', date: Date) {
    return (which === 'from' ? this.fromDate() : this.toDate()) === this.toDateValue(date);
  }

  isToday(date: Date) { return this.toDateValue(date) === this.toDateValue(new Date()); }

  private toDateValue(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parseDate(value: string) {
    if (!value) return null;
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
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
