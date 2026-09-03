import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HealthStatus } from '../../../core/models/recruitment.model';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span 
      class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide border shadow-2xs select-none whitespace-nowrap shrink-0"
      [ngClass]="badgeClass"
    >
      <span class="w-2 h-2 rounded-full" [ngClass]="dotClass"></span>
      {{ status }}
    </span>
  `
})
export class StatusBadgeComponent {
  @Input() status: HealthStatus | string = 'On Track';

  get badgeClass(): string {
    switch (this.status) {
      case 'On Track':
      case 'Active':
      case 'Joined':
      case 'Resolved':
      case 'Within SLA':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'At Risk':
      case 'In Progress':
      case 'Offer Sent':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Critical':
      case 'Breached':
      case 'Rejected':
        return 'bg-red-50 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  }

  get dotClass(): string {
    switch (this.status) {
      case 'On Track':
      case 'Active':
      case 'Joined':
      case 'Resolved':
      case 'Within SLA':
        return 'bg-emerald-500';
      case 'At Risk':
      case 'In Progress':
      case 'Offer Sent':
        return 'bg-amber-500';
      case 'Critical':
      case 'Breached':
      case 'Rejected':
        return 'bg-red-500';
      default:
        return 'bg-slate-400';
    }
  }
}
