import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NAV_MODULES, NavItem } from '../../core/constants/navigation.constant';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  template: `
    <aside 
      class="h-screen bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 ease-in-out select-none border-r border-slate-800 shrink-0 z-30 shadow-md"
      [ngClass]="isCollapsed ? 'w-16' : 'w-64'"
    >
      <!-- Logo Header -->
      <div class="h-16 flex items-center px-3 border-b border-slate-800 justify-between">
        <div class="flex items-center gap-3 overflow-hidden" [ngClass]="{ 'justify-center w-full': isCollapsed }">
          <div class="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center text-white shrink-0 font-bold shadow-xs">
            <app-icon name="tower" [size]="20" class="text-white"></app-icon>
          </div>
          <div *ngIf="!isCollapsed" class="flex flex-col min-w-0 transition-opacity duration-200">
            <span class="text-sm font-bold text-white tracking-tight leading-none truncate">TalentOps</span>
            <span class="text-[10px] uppercase font-bold text-brand-400 tracking-wider mt-1">Control Tower</span>
          </div>
        </div>

        <button 
          type="button" 
          (click)="toggleCollapse()"
          *ngIf="!isCollapsed"
          class="hidden md:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
          title="Collapse Sidebar"
        >
          <app-icon name="chevron-left" [size]="16"></app-icon>
        </button>
      </div>

      <!-- Concise Module Navigation Links -->
      <div class="flex-1 overflow-y-auto py-4 px-2 space-y-1.5 custom-sidebar-scroll">
        <a
          *ngFor="let module of navModules"
          [routerLink]="module.route"
          (click)="linkClicked.emit()"
          routerLinkActive="bg-brand-500/15 text-brand-400 font-bold border-r-2 border-brand-500"
          class="flex items-center px-3 py-3 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 transition-all duration-150 group cursor-pointer"
          [ngClass]="isCollapsed ? 'justify-center px-0' : 'justify-between'"
          [title]="isCollapsed ? module.label : ''"
        >
          <div class="flex items-center gap-3 min-w-0" [ngClass]="{ 'justify-center': isCollapsed }">
            <app-icon [name]="module.icon" [size]="20" class="text-slate-400 group-hover:text-brand-400 transition-colors shrink-0"></app-icon>
            <span *ngIf="!isCollapsed" class="truncate text-xs font-bold tracking-tight">{{ module.label }}</span>
          </div>
        </a>
      </div>

      <!-- Recruiter Performance Pill Footer -->
      <div class="p-2 border-t border-slate-800 bg-slate-950/60">
        <div class="flex items-center gap-3 px-2 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60 shadow-2xs" [ngClass]="{ 'justify-center': isCollapsed }">
          <div class="relative shrink-0">
            <div class="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              TA
            </div>
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900 absolute -bottom-0.5 -right-0.5"></span>
          </div>
          <div *ngIf="!isCollapsed" class="min-w-0 flex-1">
            <p class="text-xs font-bold text-slate-100 truncate">Talent Ops Admin</p>
            <p class="text-[10px] text-brand-400 font-mono font-semibold">Active Monitor</p>
          </div>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .custom-sidebar-scroll::-webkit-scrollbar {
      width: 4px;
    }
    .custom-sidebar-scroll::-webkit-scrollbar-thumb {
      background: #334155;
      border-radius: 4px;
    }
  `]
})
export class SidebarComponent {
  @Input() isCollapsed = false;
  @Output() isCollapsedChange = new EventEmitter<boolean>();
  @Output() linkClicked = new EventEmitter<void>();

  navModules = NAV_MODULES;

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
    this.isCollapsedChange.emit(this.isCollapsed);
  }
}
