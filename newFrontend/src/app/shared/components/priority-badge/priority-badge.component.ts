import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PriorityLevel } from '../../../core/models/recruitment.model';

@Component({
  selector: 'app-priority-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span 
      class="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold font-mono tracking-wider select-none uppercase"
      [ngClass]="priorityClass"
    >
      {{ priority }}
    </span>
  `
})
export class PriorityBadgeComponent {
  @Input() priority: PriorityLevel | string = 'P1';

  get priorityClass(): string {
    switch (this.priority) {
      case 'P0':
        return 'bg-red-600 text-white shadow-2xs';
      case 'P1':
        return 'bg-amber-500 text-white shadow-2xs';
      case 'P2':
        return 'bg-slate-100 text-slate-700 border border-slate-200';
      default:
        return 'bg-slate-100 text-slate-600 border border-slate-200';
    }
  }
}
