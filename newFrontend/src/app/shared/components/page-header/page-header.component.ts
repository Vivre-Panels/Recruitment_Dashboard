import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [ngClass]="compact ? 'mb-0 min-h-14 py-2' : 'mb-6 min-h-20 py-3'" class="flex flex-col md:flex-row items-center md:justify-between gap-4 border-b border-slate-200/80 pl-4 border-l-4 border-l-brand-500 rounded-l">
      <div class="min-h-12 flex flex-col justify-center">
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-bold tracking-tight text-slate-900">{{ title }}</h1>
          <ng-content select="[badges]"></ng-content>
        </div>
        <p *ngIf="subtitle" class="mt-1 text-xs sm:text-sm text-slate-500 font-normal leading-relaxed">{{ subtitle }}</p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <ng-content select="[actions]"></ng-content>
      </div>
    </div>
  `
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle?: string;
  @Input() compact = false;
}
