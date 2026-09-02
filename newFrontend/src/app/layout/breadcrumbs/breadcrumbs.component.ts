import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { IconComponent } from '../../shared/components/icon/icon.component';

interface BreadcrumbItem {
  label: string;
  url: string;
}

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  template: `
    <nav *ngIf="breadcrumbs.length > 0" class="flex items-center text-xs text-slate-500 mb-4" aria-label="Breadcrumb">
      <ol class="inline-flex items-center space-x-1 md:space-x-2">
        <li class="inline-flex items-center">
          <a 
            routerLink="/dashboard/overview" 
            class="text-slate-400 hover:text-slate-700 inline-flex items-center gap-1 font-medium transition-colors"
          >
            <app-icon name="dashboard" [size]="13"></app-icon>
            Home
          </a>
        </li>

        <li *ngFor="let item of breadcrumbs; let last = last">
          <div class="flex items-center gap-1 md:gap-2">
            <app-icon name="chevron-right" [size]="12" class="text-slate-400"></app-icon>
            <span *ngIf="last" class="font-semibold text-slate-800">{{ item.label }}</span>
            <a 
              *ngIf="!last" 
              [routerLink]="item.url" 
              class="font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              {{ item.label }}
            </a>
          </div>
        </li>
      </ol>
    </nav>
  `
})
export class BreadcrumbsComponent {
  private router = inject(Router);
  breadcrumbs: BreadcrumbItem[] = [];

  constructor() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.generateBreadcrumbs();
      });
    this.generateBreadcrumbs();
  }

  private generateBreadcrumbs() {
    const url = this.router.url.split('?')[0];
    const segments = url.split('/').filter(s => s.length > 0);
    
    this.breadcrumbs = [];
    let currentPath = '';

    for (const segment of segments) {
      currentPath += `/${segment}`;
      
      let label = segment.replace(/-/g, ' ');
      // Format label
      label = label.charAt(0).toUpperCase() + label.slice(1);
      
      if (segment.toUpperCase().startsWith('POS-') || segment.toUpperCase().startsWith('CAN-')) {
        label = segment.toUpperCase();
      }

      this.breadcrumbs.push({
        label,
        url: currentPath
      });
    }
  }
}
