import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div 
      class="rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all duration-300 relative overflow-hidden group border select-none h-36 flex flex-col justify-between"
      [ngClass]="cardBgClass"
    >
      <!-- Background Watermark Icon (Subtle & Non-Colliding) -->
      <div 
        *ngIf="icon" 
        class="absolute -right-2 -bottom-2 pointer-events-none transition-transform duration-500 group-hover:scale-110 opacity-[0.08]"
        [ngClass]="watermarkClass"
      >
        <app-icon [name]="icon" [size]="90"></app-icon>
      </div>

      <!-- Top Row: Title & Jewel Badge -->
      <div class="flex items-center justify-between relative z-10">
        <span class="text-xs font-bold uppercase tracking-wider text-slate-600 truncate mr-2">{{ title }}</span>
        <div 
          *ngIf="icon" 
          class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
          [ngClass]="badgeBgClass"
        >
          <app-icon [name]="icon" [size]="18" class="text-white"></app-icon>
        </div>
      </div>

      <!-- Middle: Big Metric Value -->
      <div class="my-auto flex items-baseline gap-1.5 relative z-10">
        <span class="text-2xl font-extrabold tracking-tight text-slate-900 font-sans leading-none">{{ value }}</span>
        <span *ngIf="unit" class="text-xs font-bold text-slate-600 leading-none">{{ unit }}</span>
      </div>

      <!-- Bottom Row: Subtitle & Trend Pill / Clean Arrow -->
      <div class="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs relative z-10 min-h-[24px]">
        <span class="text-slate-600 font-semibold truncate" [title]="subtitle || ''">{{ subtitle }}</span>
        <span *ngIf="showArrow" class="text-brand-600 font-bold text-sm shrink-0 transition-transform group-hover:translate-x-1 flex items-center gap-0.5">
          <app-icon name="arrow-right" [size]="14"></app-icon>
        </span>
        <span 
          *ngIf="trend && !showArrow" 
          class="font-extrabold inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] shadow-2xs whitespace-nowrap shrink-0"
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
    switch (this.accent) {
      case 'brand':
        return 'bg-brand-50/70 border-brand-200/90 text-brand-950';
      case 'danger':
        return 'bg-rose-50/70 border-rose-200/90 text-rose-950';
      case 'warning':
        return 'bg-amber-50/70 border-amber-200/90 text-amber-950';
      case 'info':
        return 'bg-sky-50/70 border-sky-200/90 text-sky-950';
      default:
        return 'bg-slate-50/80 border-slate-200/90 text-slate-900';
    }
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

  get watermarkClass(): string {
    switch (this.accent) {
      case 'brand':
        return 'text-brand-700';
      case 'danger':
        return 'text-red-700';
      case 'warning':
        return 'text-amber-700';
      case 'info':
        return 'text-blue-700';
      default:
        return 'text-slate-700';
    }
  }
}
