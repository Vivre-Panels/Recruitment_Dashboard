import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IconComponent } from '../icon/icon.component';

export interface ViewTab {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-view-switcher-tabs',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  template: `
    <div class="inline-flex items-center p-1 bg-slate-100/80 border border-slate-200/90 rounded-xl shadow-2xs overflow-x-auto max-w-full">
      <a
        *ngFor="let tab of tabs"
        [routerLink]="tab.route"
        routerLinkActive="bg-white text-brand-700 shadow-2xs font-bold"
        [routerLinkActiveOptions]="{ exact: false }"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 transition-all cursor-pointer whitespace-nowrap"
      >
        <app-icon [name]="tab.icon" [size]="14"></app-icon>
        <span>{{ tab.label }}</span>
      </a>
    </div>
  `
})
export class ViewSwitcherTabsComponent {
  @Input() tabs: ViewTab[] = [];
}
