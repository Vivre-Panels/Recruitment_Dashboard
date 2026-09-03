import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SlaService } from '../../../core/services/sla.service';
import { ToastService } from '../../../core/services/toast.service';
import { SlaRecord } from '../../../core/models/recruitment.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { SearchInputComponent } from '../../../shared/components/search-input/search-input.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { DrawerComponent } from '../../../shared/components/drawer/drawer.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';

@Component({
  selector: 'app-analytics-sla',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    PageHeaderComponent,
    KpiCardComponent,
    StatusBadgeComponent,
    SearchInputComponent,
    IconComponent,
    EmptyStateComponent,
    DrawerComponent,
    LoadingStateComponent
  ],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto">
      <app-page-header
        title="SLA Monitoring & Governance"
        subtitle="Turnaround tracking across interview scheduling, debriefs, and offer approvals."
      >
        <div badges class="flex items-center gap-2">
          <span class="text-xs font-mono font-semibold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
            SLA Compliance: {{ slaService.complianceRate() }}%
          </span>
        </div>
      </app-page-header>

      <!-- Skeleton KPI Cards Loader -->
      <app-loading-state *ngIf="slaService.isLoading()" type="kpis"></app-loading-state>

      <!-- 3 Primary Summary Cards (Prompt Rule 17) -->
      <div *ngIf="!slaService.isLoading()" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <app-kpi-card
          title="Breached"
          [value]="slaService.breachedCount()"
          subtitle="Target limit exceeded"
          icon="alert-triangle"
          accent="danger"
        ></app-kpi-card>

        <app-kpi-card
          title="At Risk"
          [value]="slaService.atRiskCount()"
          subtitle=">75% Time elapsed"
          icon="clock"
          accent="warning"
        ></app-kpi-card>

        <app-kpi-card
          title="Within SLA"
          [value]="slaService.withinSlaCount()"
          subtitle="On schedule"
          icon="check-circle"
          accent="brand"
        ></app-kpi-card>
      </div>

      <!-- Search & Filters -->
      <div class="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex-1 max-w-md">
          <app-search-input
            [value]="searchTerm"
            (valueChange)="searchTerm = $event"
            placeholder="Search by position, stage, pending owner..."
          ></app-search-input>
        </div>

        <div class="flex items-center gap-2">
          <select
            [(ngModel)]="selectedStatus"
            class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
          >
            <option value="ALL">All SLA Statuses</option>
            <option value="Within SLA">Within SLA</option>
            <option value="At Risk">At Risk</option>
            <option value="Breached">Breached</option>
          </select>
        </div>
      </div>

      <!-- SLA Table (Prompt Rule 17) -->
      <div class="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th class="py-3.5 px-4">Position</th>
                <th class="py-3.5 px-3">Stage</th>
                <th class="py-3.5 px-3">Pending Owner</th>
                <th class="py-3.5 px-3 text-center">Status</th>
                <th class="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              <tr 
                *ngFor="let s of filteredSlas()"
                (click)="openDrawer(s)"
                class="hover:bg-slate-50/80 transition-colors cursor-pointer"
              >
                <!-- Position -->
                <td class="py-3.5 px-4 font-semibold text-slate-900">
                  <div class="font-bold text-slate-900">{{ s.positionTitle }}</div>
                  <div class="text-[11px] text-slate-500 mt-0.5">Code: {{ s.positionId }}</div>
                </td>

                <!-- Stage -->
                <td class="py-3.5 px-3 font-medium text-slate-800">
                  {{ s.stage }}
                </td>

                <!-- Pending Owner -->
                <td class="py-3.5 px-3">
                  <div class="font-bold text-slate-900">{{ s.pendingWith }}</div>
                  <span class="text-[10px] text-slate-400 font-medium block">{{ s.role }}</span>
                </td>

                <!-- Status -->
                <td class="py-3.5 px-3 text-center">
                  <app-status-badge [status]="s.status"></app-status-badge>
                </td>

                <!-- Action -->
                <td class="py-3.5 px-4 text-right" (click)="$event.stopPropagation()">
                  <button
                    type="button"
                    (click)="openDrawer(s)"
                    class="px-3 py-1.5 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 font-semibold rounded-lg text-xs transition-colors"
                  >
                    View
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <app-empty-state
            *ngIf="filteredSlas().length === 0"
            title="No SLA records found"
            message="All checkpoints match standard operational targets."
            actionLabel="Reset Filter"
            (actionClick)="resetFilters()"
          ></app-empty-state>
        </div>
      </div>

      <!-- SLA Detail Drawer (Prompt Rule 17) -->
      <app-drawer
        [(isOpen)]="isDrawerOpen"
        [title]="selectedSla?.positionTitle || ''"
        subtitle="SLA Governance Detail"
        width="lg"
      >
        <div *ngIf="selectedSla as s" class="space-y-5 text-xs">
          <!-- Status Strip -->
          <div class="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div>
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Checkpoint Stage</span>
              <span class="font-bold text-slate-900 mt-0.5 text-sm block">{{ s.stage }}</span>
            </div>
            <app-status-badge [status]="s.status"></app-status-badge>
          </div>

          <!-- Pending Info -->
          <div class="p-3.5 bg-white rounded-xl border border-slate-200/80 space-y-2">
            <div class="flex justify-between">
              <span class="text-slate-500 font-medium">Pending Stakeholder:</span>
              <span class="font-bold text-slate-900">{{ s.pendingWith }} ({{ s.role }})</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500 font-medium">Elapsed vs Target:</span>
              <span class="font-bold font-mono text-slate-900">{{ s.elapsedHours }}h / {{ s.targetHours }}h</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500 font-medium">Escalation Tier:</span>
              <span class="font-bold font-mono text-red-700">{{ s.escalationLevel }}</span>
            </div>
          </div>
        </div>

        <div footer class="flex items-center justify-between w-full">
          <button 
            type="button" 
            (click)="isDrawerOpen = false"
            class="px-3.5 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg bg-white"
          >
            Close
          </button>

          <div *ngIf="selectedSla" class="flex gap-2">
            <button
              *ngIf="selectedSla.status !== 'Within SLA'"
              type="button"
              (click)="escalate(selectedSla)"
              class="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-xs"
            >
              Escalate
            </button>
            <button
              type="button"
              (click)="resolve(selectedSla)"
              class="px-3.5 py-1.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg text-xs"
            >
              Resolve Checkpoint
            </button>
          </div>
        </div>
      </app-drawer>
    </div>
  `
})
export class AnalyticsSlaComponent {
  slaService = inject(SlaService);
  private toastService = inject(ToastService);

  searchTerm = '';
  selectedStatus = 'ALL';

  isDrawerOpen = false;
  selectedSla?: SlaRecord;

  filteredSlas = computed(() => {
    return this.slaService.slaRecords().filter(s => {
      const matchesSearch = !this.searchTerm ||
        s.positionTitle.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        s.stage.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        s.pendingWith.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesStatus = this.selectedStatus === 'ALL' || s.status === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });
  });

  openDrawer(s: SlaRecord) {
    this.selectedSla = s;
    this.isDrawerOpen = true;
  }

  escalate(s: SlaRecord) {
    this.slaService.escalateSla(s.id, 'Critical');
    this.toastService.warning(
      'Escalation Dispatched',
      `Alert sent regarding ${s.positionTitle}.`
    );
  }

  resolve(s: SlaRecord) {
    this.slaService.resolveSla(s.id);
    this.toastService.success(
      'SLA Resolved',
      `Checkpoint cleared for ${s.positionTitle}.`
    );
    this.isDrawerOpen = false;
  }

  resetFilters() {
    this.searchTerm = '';
    this.selectedStatus = 'ALL';
  }
}
