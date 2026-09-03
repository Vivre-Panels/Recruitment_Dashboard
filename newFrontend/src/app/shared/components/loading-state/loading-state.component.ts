import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Spinner Mode -->
    <div *ngIf="type === 'spinner'" class="py-12 px-4 flex flex-col items-center justify-center">
      <div class="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin mb-3"></div>
      <p class="text-xs font-medium text-slate-500">{{ message }}</p>
    </div>

    <!-- Skeleton Table Mode -->
    <div *ngIf="type === 'table'" class="w-full bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3 animate-pulse">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <div class="h-4 bg-slate-200 rounded w-1/4"></div>
        <div class="h-8 bg-slate-200 rounded-xl w-32"></div>
      </div>
      <div class="space-y-2.5">
        <div *ngFor="let row of rowsArray" class="flex items-center space-x-4 py-2 border-b border-slate-50">
          <div class="h-4 bg-slate-200 rounded w-1/3"></div>
          <div class="h-4 bg-slate-100 rounded w-1/6"></div>
          <div class="h-4 bg-slate-200 rounded w-1/6"></div>
          <div class="h-4 bg-slate-100 rounded w-1/6"></div>
          <div class="h-4 bg-slate-200 rounded w-1/12 ml-auto"></div>
        </div>
      </div>
    </div>

    <!-- Skeleton KPI Grid Mode -->
    <div *ngIf="type === 'kpis'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      <div *ngFor="let k of [1,2,3,4]" class="p-4 bg-white border border-slate-200/90 rounded-2xl space-y-3">
        <div class="flex justify-between items-center">
          <div class="h-3 bg-slate-200 rounded w-24"></div>
          <div class="w-8 h-8 bg-slate-100 rounded-xl"></div>
        </div>
        <div class="h-7 bg-slate-200 rounded w-16"></div>
        <div class="h-3 bg-slate-100 rounded w-32"></div>
      </div>
    </div>

    <!-- Skeleton Cards Mode -->
    <div *ngIf="type === 'cards'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
      <div *ngFor="let c of [1,2,3,4,5,6]" class="p-5 bg-white border border-slate-200/90 rounded-2xl space-y-3">
        <div class="flex justify-between">
          <div class="h-4 bg-slate-200 rounded w-1/2"></div>
          <div class="h-4 bg-slate-200 rounded w-12"></div>
        </div>
        <div class="h-3 bg-slate-100 rounded w-3/4"></div>
        <div class="pt-3 border-t border-slate-100 flex justify-between">
          <div class="h-3 bg-slate-200 rounded w-20"></div>
          <div class="h-3 bg-slate-200 rounded w-20"></div>
        </div>
      </div>
    </div>

    <!-- Skeleton Kanban Mode -->
    <div *ngIf="type === 'kanban'" class="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 animate-pulse">
      <div *ngFor="let col of [1,2,3,4,5,6]" class="bg-slate-50/80 rounded-2xl p-3 border border-slate-200/60 space-y-3">
        <div class="h-4 bg-slate-200 rounded w-20"></div>
        <div *ngFor="let card of [1,2]" class="p-3 bg-white rounded-xl border border-slate-200/80 space-y-2">
          <div class="h-3 bg-slate-200 rounded w-full"></div>
          <div class="h-3 bg-slate-100 rounded w-2/3"></div>
        </div>
      </div>
    </div>
  `
})
export class LoadingStateComponent {
  @Input() type: 'spinner' | 'table' | 'kpis' | 'cards' | 'kanban' = 'table';
  @Input() message = 'Loading data...';
  @Input() rows = 5;

  get rowsArray() {
    return Array(this.rows).fill(0);
  }
}
