import { Component, EventEmitter, HostListener, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PositionService } from '../../core/services/position.service';
import { CandidateService } from '../../core/services/candidate.service';
import { SlaService } from '../../core/services/sla.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent, StatusBadgeComponent],
  template: `
    <header class="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20 shadow-2xs">
      <!-- Left: Mobile Toggle & Global Search -->
      <div class="flex items-center gap-3 flex-1 max-w-xl">
        <button 
          type="button" 
          (click)="toggleSidebar.emit()"
          class="md:hidden p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          title="Toggle Navigation"
        >
          <app-icon name="menu" [size]="20"></app-icon>
        </button>

        <!-- Global Search with Quick Results -->
        <div class="relative w-full">
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <app-icon name="search" [size]="16"></app-icon>
            </div>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (input)="onSearchInput()"
              (focus)="showSearchResults = true"
              placeholder="Search positions, candidates, recruiters, or SLAs... (e.g. POS-101, Arjun)"
              class="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs md:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-2xs"
            />
            <button
              *ngIf="searchQuery"
              (click)="clearSearch()"
              class="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
            >
              <app-icon name="x" [size]="14"></app-icon>
            </button>
          </div>

          <!-- Search Results Dropdown -->
          <div 
            *ngIf="showSearchResults && searchQuery.trim().length > 0"
            class="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 max-h-96 overflow-y-auto"
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
      </div>

      <!-- Right: SLA Alerts, View-Only Indicator, Profile -->
      <div class="flex items-center gap-2 sm:gap-3">
        <!-- SLA Alerts Bell Button -->
        <div class="relative">
          <button 
            type="button" 
            (click)="toggleNotifications($event)"
            class="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="SLA Risk & Alert Center"
          >
            <app-icon name="bell" [size]="18"></app-icon>
            <span 
              *ngIf="slaService.breachedCount() > 0"
              class="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse"
            ></span>
          </button>

          <!-- Notifications Popup -->
          <div 
            *ngIf="showNotifications"
            (click)="$event.stopPropagation()"
            class="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50"
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
        </div>

        <!-- Read-Only Mode Badge (Action Buttons Disabled) -->
        <span class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
          Read-Only Admin Monitor
        </span>

        <!-- Divider -->
        <div class="h-6 w-px bg-slate-200 mx-1"></div>

        <!-- User Profile Pill -->
        <div class="flex items-center gap-2.5 pl-1">
          <div class="w-8.5 h-8.5 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
            RS
          </div>
          <div class="hidden lg:block text-left">
            <span class="text-xs font-bold text-slate-900 block leading-tight">Rahul Sharma</span>
            <span class="text-[10px] text-slate-500 block leading-tight font-medium">Head of Talent Ops</span>
          </div>
        </div>
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

  searchQuery = '';
  showSearchResults = false;
  showNotifications = false;

  matchedPositions: any[] = [];
  matchedCandidates: any[] = [];

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
    this.router.navigate(['/recruitment/candidates', id]);
  }

  navigateToSla() {
    this.showNotifications = false;
    this.router.navigate(['/analytics/sla']);
  }

  toggleNotifications(event?: MouseEvent) {
    if (event) event.stopPropagation();
    this.showNotifications = !this.showNotifications;
  }
}
