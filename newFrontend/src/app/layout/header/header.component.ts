import { Component, EventEmitter, HostListener, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PositionService } from '../../core/services/position.service';
import { CandidateService } from '../../core/services/candidate.service';
import { SlaService } from '../../core/services/sla.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { NAV_MODULES } from '../../core/constants/navigation.constant';
import { AuthService } from '../../core/services/auth.service';
import { isNavigationRouteActive } from '../../core/utils/navigation-active';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent, StatusBadgeComponent],
  template: `
    <header class="bg-slate-800 border-b border-slate-700 text-slate-100 sticky top-0 z-30 shadow-md shadow-slate-950/10 select-none">
      <!-- Main Header Row -->
      <div class="px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <!-- Left: Logo & Mobile Toggle -->
        <div class="flex items-center gap-3 shrink-0">
          <!-- Mobile Menu Hamburger Button -->
          <button 
            type="button" 
            (click)="isMobileMenuOpen = !isMobileMenuOpen"
            class="lg:hidden p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
            title="Toggle Navigation"
          >
            <app-icon [name]="isMobileMenuOpen ? 'x' : 'menu'" [size]="20"></app-icon>
          </button>

          <!-- TalentOps Logo & Brand Text -->
          <a [routerLink]="auth.user()?.role === 'recruiter' ? '/dashboard/application-insights' : '/dashboard/overview'" class="flex items-center gap-3 group">
            <div class="w-9 h-9 rounded-xl bg-white/10 border border-slate-600 p-1 flex items-center justify-center shrink-0 shadow-2xs group-hover:bg-white/15 group-hover:border-slate-400 transition-colors">
              <img src="assets/logo.svg" alt="TalentOps Logo" class="w-full h-full object-contain" />
            </div>
            <span class="text-base font-bold text-white tracking-tight leading-none hidden sm:inline-block">TalentOps</span>
          </a>
        </div>

        <!-- Center: Primary Nav Links (Desktop) -->
        <nav class="hidden lg:flex items-center gap-1.5 overflow-x-auto py-1">
          <a
            *ngFor="let module of navModules"
            [routerLink]="module.route"
            [class.bg-slate-700]="isRouteActive(module.route)"
            [class.text-white]="isRouteActive(module.route)"
            [class.font-bold]="isRouteActive(module.route)"
            [class.border-slate-500]="isRouteActive(module.route)"
            class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-slate-200 hover:text-white hover:bg-slate-700 border border-transparent transition-all cursor-pointer whitespace-nowrap"
          >
            <app-icon [name]="module.icon" [size]="16" [class.text-sky-300]="isRouteActive(module.route)" class="text-slate-400 transition-colors"></app-icon>
            <span>{{ module.label }}</span>
          </a>
        </nav>

        <!-- Right: Global Search, SLA Alerts, Monitor Badge, Profile -->
        <div class="flex items-center gap-2 sm:gap-3 shrink-0">
          <!-- Global Search -->
          <div *ngIf="auth.user()?.role === 'superadmin'" class="relative max-w-xs sm:max-w-sm w-44 sm:w-60 md:w-64">
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <app-icon name="search" [size]="15"></app-icon>
              </div>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (input)="onSearchInput()"
                (focus)="showSearchResults = true"
                placeholder="Search positions, candidates..."
                class="w-full pl-8 pr-7 py-1.5 bg-slate-900/70 hover:bg-slate-900 focus:bg-slate-900 border border-slate-700 focus:border-sky-400 rounded-xl text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 transition-all shadow-2xs"
              />
              <button
                *ngIf="searchQuery"
                (click)="clearSearch()"
                class="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-200"
              >
                <app-icon name="x" [size]="13"></app-icon>
              </button>
            </div>

            <!-- Search Results Dropdown -->
            <div 
              *ngIf="showSearchResults && searchQuery.trim().length > 0"
              class="absolute top-full right-0 w-80 sm:w-96 max-w-[calc(100vw-1rem)] mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 max-h-96 overflow-y-auto text-slate-900"
            >
              <!-- Positions Matches -->
              <div *ngIf="matchedPositions.length > 0">
                <div class="px-3.5 py-2 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-100 flex items-center gap-1.5">
                  <app-icon name="briefcase" [size]="12" class="text-brand-600"></app-icon>
                  Positions ({{ matchedPositions.length }})
                </div>
                <div 
                  *ngFor="let p of matchedPositions"
                  (click)="navigateToPosition(p.id)"
                  class="px-4 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-100/60 last:border-0 flex items-center justify-between"
                >
                  <div>
                    <div class="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <span>{{ p.title }}</span>
                      <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">{{ p.id }}</span>
                    </div>
                    <div class="text-[11px] text-slate-500 mt-0.5">{{ p.department }} • HC: {{ p.joinedHc }}/{{ p.requiredHc }} • Owner: {{ p.owner }}</div>
                  </div>
                  <app-status-badge [status]="p.status"></app-status-badge>
                </div>
              </div>

              <!-- Candidate Matches -->
              <div *ngIf="matchedCandidates.length > 0">
                <div class="px-3.5 py-2 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-100 flex items-center gap-1.5">
                  <app-icon name="users" [size]="12" class="text-brand-600"></app-icon>
                  Candidates ({{ matchedCandidates.length }})
                </div>
                <div 
                  *ngFor="let c of matchedCandidates"
                  (click)="navigateToCandidate(c.id)"
                  class="px-4 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-100/60 last:border-0 flex items-center justify-between"
                >
                  <div>
                    <div class="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <span>{{ c.name }}</span>
                      <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">{{ c.id }}</span>
                    </div>
                    <div class="text-[11px] text-slate-500 mt-0.5">{{ c.positionTitle }} • {{ c.experienceYears }} yrs exp • Stage: <span class="font-semibold text-brand-700">{{ c.currentStage }}</span></div>
                  </div>
                  <span class="text-[11px] font-bold text-emerald-700 font-mono">{{ c.qualityScore }}% Score</span>
                </div>
              </div>

              <div *ngIf="matchedPositions.length === 0 && matchedCandidates.length === 0" class="p-4 text-center text-xs text-slate-500">
                No matching positions or candidates found for "{{ searchQuery }}".
              </div>
            </div>
          </div>

          <button type="button" (click)="logout()" class="rounded-lg border border-slate-600 px-3 py-2 text-[11px] font-bold text-slate-200 hover:border-slate-400 hover:bg-slate-700" aria-label="Sign out">Sign out</button>

          <!-- SLA Alerts Bell Button -->
          <!-- <div class="relative">
            <button 
              type="button" 
              (click)="toggleNotifications($event)"
              class="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="SLA Risk & Alert Center"
            >
              <app-icon name="bell" [size]="18"></app-icon>
              <span 
                *ngIf="slaService.breachedCount() > 0"
                class="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-slate-900 animate-pulse"
              ></span>
            </button>

            <div 
              *ngIf="showNotifications"
              (click)="$event.stopPropagation()"
              class="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50"
            >
              <div class="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <app-icon name="bell" [size]="16" class="text-brand-400"></app-icon>
                  <span class="text-xs font-bold uppercase tracking-wider">SLA & Escalation Center</span>
                </div>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-mono font-bold border border-red-500/30">
                  {{ slaService.breachedCount() }} Breached
                </span>
              </div>

              <div class="max-h-72 overflow-y-auto divide-y divide-slate-100">
                <div 
                  *ngFor="let s of slaService.slaRecords()"
                  class="p-3.5 hover:bg-slate-50 transition-colors cursor-pointer"
                  (click)="navigateToSla()"
                >
                  <div class="flex items-start justify-between gap-2">
                    <span class="text-xs font-bold text-slate-900 leading-snug">{{ s.positionTitle }}</span>
                    <app-status-badge [status]="s.status"></app-status-badge>
                  </div>
                  <p class="text-[11px] text-slate-600 mt-1">Pending with: <span class="font-semibold text-slate-800">{{ s.pendingWith }}</span> ({{ s.elapsedHours }}h / {{ s.targetHours }}h SLA)</p>
                </div>
              </div>

              <div class="p-3 bg-slate-50 border-t border-slate-100 text-center">
                <a 
                  routerLink="/analytics/sla" 
                  (click)="showNotifications = false"
                  class="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
                >
                  View Complete SLA Monitor →
                </a>
              </div>
            </div>
          </div> -->

        </div>
      </div>

      <!-- Mobile Dropdown Navigation Menu -->
      <div *ngIf="isMobileMenuOpen" class="lg:hidden bg-slate-800 border-t border-slate-700 px-4 py-3 space-y-1">
        <a
          *ngFor="let module of navModules"
          [routerLink]="module.route"
          (click)="isMobileMenuOpen = false"
          [class.bg-slate-700]="isRouteActive(module.route)"
          [class.text-white]="isRouteActive(module.route)"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <app-icon [name]="module.icon" [size]="18" class="text-slate-400"></app-icon>
          <span>{{ module.label }}</span>
        </a>
      </div>
    </header>
  `
})
export class HeaderComponent {
  @Output() toggleSidebar = new EventEmitter<void>();

  private positionService = inject(PositionService);
  private candidateService = inject(CandidateService);
  slaService = inject(SlaService);
  private router = inject(Router);
  auth = inject(AuthService);

  get navModules() {
    return this.auth.user()?.role === 'recruiter'
      ? [{ label: 'Application Wise Insight', icon: 'users', route: '/dashboard/application-insights' }]
      : NAV_MODULES;
  }
  searchQuery = '';
  showSearchResults = false;
  showNotifications = false;
  isMobileMenuOpen = false;

  matchedPositions: any[] = [];
  matchedCandidates: any[] = [];

  isRouteActive(baseRoute: string): boolean {
    return isNavigationRouteActive(this.router, baseRoute);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.showNotifications = false;
      this.showSearchResults = false;
    }
  }

  onSearchInput() {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) {
      this.matchedPositions = [];
      this.matchedCandidates = [];
      return;
    }

    this.matchedPositions = this.positionService.positions().filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.department.toLowerCase().includes(q) ||
      p.owner.toLowerCase().includes(q)
    ).slice(0, 4);

    this.matchedCandidates = this.candidateService.candidates().filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      c.positionTitle.toLowerCase().includes(q) ||
      c.skills.some(s => s.toLowerCase().includes(q))
    ).slice(0, 4);
  }

  clearSearch() {
    this.searchQuery = '';
    this.showSearchResults = false;
    this.matchedPositions = [];
    this.matchedCandidates = [];
  }

  navigateToPosition(id: string) {
    this.clearSearch();
    this.router.navigate(['/recruitment/positions', id]);
  }

  navigateToCandidate(id: string) {
    this.clearSearch();
    this.router.navigate(['/recruitment/candidates', id]);
  }

  navigateToSla() {
    this.showNotifications = false;
    this.router.navigate(['/analytics/sla']);
  }

  logout() { this.auth.logout(); }

  toggleNotifications(event?: MouseEvent) {
    if (event) event.stopPropagation();
    this.showNotifications = !this.showNotifications;
  }
}
