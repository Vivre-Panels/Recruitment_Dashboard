import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div 
      class="rounded-xl p-3.5 bg-white shadow-2xs hover:shadow-sm transition-all duration-200 relative overflow-hidden group border select-none h-[120px] flex flex-col justify-between"
      [ngClass]="cardBgClass"
    >
      <!-- Label and icon -->
      <div class="flex items-center justify-between gap-2 relative z-10">
        <span class="text-[11px] font-semibold text-slate-600 truncate">{{ title }}</span>
        <div 
          *ngIf="icon" 
          class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          [ngClass]="badgeBgClass"
        >
          <app-icon [name]="icon" [size]="15" class="text-white"></app-icon>
        </div>
      </div>

      <!-- Middle: Big Metric Value -->
      <div class="my-auto flex items-baseline gap-1.5 relative z-10">
        <span class="text-xl font-bold tracking-tight text-slate-900 font-sans leading-none truncate">{{ value }}</span>
        <span *ngIf="unit" class="text-[11px] font-semibold text-slate-500 leading-none">{{ unit }}</span>
      </div>

      <!-- Bottom Row: Subtitle & Trend Pill / Clean Arrow -->
      <div class="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1 text-xs relative z-10 min-h-[22px]">
        <span class="text-[10px] text-slate-500 font-medium truncate" [title]="subtitle || ''">{{ subtitle }}</span>
        <span *ngIf="showArrow" class="text-brand-600 font-bold text-sm shrink-0 transition-transform group-hover:translate-x-1 flex items-center gap-0.5">
          <app-icon name="arrow-right" [size]="14"></app-icon>
        </span>
        <span 
          *ngIf="trend && !showArrow" 
          class="font-bold inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] whitespace-nowrap shrink-0"
          [ngClass]="trendPositive ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'"
        >
          {{ trend }}
        </span>
      </div>
    </div>
  `
})
export class KpiCardComponent {
  @Input() title = '';
  @Input() value: string | number = 0;
  @Input() unit?: string;
  @Input() subtitle?: string;
  @Input() trend?: string;
  @Input() showArrow = false;
  @Input() trendPositive = true;
  @Input() icon?: string;
  @Input() accent?: 'brand' | 'danger' | 'warning' | 'info';

  get cardBgClass(): string {
    return 'bg-white border-slate-200';
  }

  get badgeBgClass(): string {
    switch (this.accent) {
      case 'brand':
        return 'bg-brand-500 text-white shadow-brand-500/30';
      case 'danger':
        return 'bg-red-500 text-white shadow-red-500/30';
      case 'warning':
        return 'bg-amber-500 text-white shadow-amber-500/30';
      case 'info':
        return 'bg-blue-500 text-white shadow-blue-500/30';
      default:
        return 'bg-slate-900 text-white';
    }
  }
}
