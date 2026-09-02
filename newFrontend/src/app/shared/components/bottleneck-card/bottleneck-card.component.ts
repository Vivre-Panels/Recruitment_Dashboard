import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BottleneckInfo } from '../../../core/models/recruitment.model';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-bottleneck-card',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent, IconComponent],
  template: `
    <div 
      class="bg-white border rounded-xl p-5 shadow-xs transition-all relative"
      [ngClass]="{
        'border-red-200 bg-red-50/10': bottleneck?.slaStatus === 'Breached',
        'border-amber-200 bg-amber-50/10': bottleneck?.slaStatus === 'At Risk',
        'border-slate-200': bottleneck?.slaStatus === 'Within SLA' || !bottleneck
      }"
    >
      <div class="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div class="flex items-center gap-2">
          <div 
            class="w-7 h-7 rounded-lg flex items-center justify-center"
            [ngClass]="{
              'bg-red-100 text-red-700': bottleneck?.slaStatus === 'Breached',
              'bg-amber-100 text-amber-700': bottleneck?.slaStatus === 'At Risk',
              'bg-emerald-100 text-emerald-700': bottleneck?.slaStatus === 'Within SLA' || !bottleneck
            }"
          >
            <app-icon name="alert-triangle" [size]="15"></app-icon>
          </div>
          <div>
            <h4 class="text-sm font-bold text-slate-900 leading-none">Operational Bottleneck Analysis</h4>
            <span class="text-xs text-slate-500">Recruitment velocity checkpoint</span>
          </div>
        </div>

        <app-status-badge *ngIf="bottleneck" [status]="bottleneck.slaStatus"></app-status-badge>
      </div>

      <div *ngIf="bottleneck; else noBottleneck" class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Current Issue</span>
          <span class="text-sm font-medium text-slate-900 mt-1 block">{{ bottleneck.issue }}</span>
          <span class="text-xs text-slate-500 mt-0.5 block">Stage: {{ bottleneck.stage }}</span>
        </div>

        <div>
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Pending Ownership</span>
          <span class="text-sm font-medium text-slate-900 mt-1 block">{{ bottleneck.pendingWith }}</span>
          <span 
            class="text-xs font-medium mt-0.5 inline-flex items-center gap-1"
            [ngClass]="bottleneck.pendingSinceDays >= 4 ? 'text-red-600' : 'text-slate-600'"
          >
            <app-icon name="clock" [size]="12"></app-icon>
            Pending since {{ bottleneck.pendingSinceDays }} days
          </span>
        </div>

        <div>
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Latest Remark</span>
          <p class="text-xs text-slate-600 mt-1 italic bg-slate-50 p-2 rounded-lg border border-slate-200/60">
            "{{ bottleneck.remark || 'No remark logged yet.' }}"
          </p>
        </div>
      </div>

      <ng-template #noBottleneck>
        <div class="py-6 text-center text-xs text-slate-500">
          No active operational bottlenecks for this position. Pipeline is flowing within SLA.
        </div>
      </ng-template>

      <!-- Action Buttons -->
      <div *ngIf="bottleneck" class="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          (click)="sendReminder.emit()"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-lg border border-amber-200 transition-colors"
        >
          <app-icon name="bell" [size]="13"></app-icon>
          Send Reminder
        </button>

        <button
          type="button"
          (click)="addRemark.emit()"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
        >
          <app-icon name="edit" [size]="13"></app-icon>
          Add Remark
        </button>

        <button
          type="button"
          (click)="updateStatus.emit()"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-800 text-xs font-semibold rounded-lg border border-brand-200 transition-colors"
        >
          <app-icon name="check" [size]="13"></app-icon>
          Update Status
        </button>
      </div>
    </div>
  `
})
export class BottleneckCardComponent {
  @Input() bottleneck?: BottleneckInfo;
  @Output() sendReminder = new EventEmitter<void>();
  @Output() addRemark = new EventEmitter<void>();
  @Output() updateStatus = new EventEmitter<void>();
}
