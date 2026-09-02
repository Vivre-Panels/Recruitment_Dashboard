import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="py-12 px-4 text-center flex flex-col items-center justify-center max-w-md mx-auto">
      <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
        <app-icon [name]="icon" [size]="22"></app-icon>
      </div>
      <h3 class="text-base font-semibold text-slate-800">{{ title }}</h3>
      <p class="mt-1 text-sm text-slate-500 max-w-sm">{{ message }}</p>
      
      <div *ngIf="actionLabel" class="mt-4">
        <button
          type="button"
          (click)="actionClick.emit()"
          class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <app-icon *ngIf="actionIcon" [name]="actionIcon" [size]="14"></app-icon>
          {{ actionLabel }}
        </button>
      </div>
    </div>
  `
})
export class EmptyStateComponent {
  @Input() title = 'No data found';
  @Input() message = 'Try adjusting your search criteria or filters.';
  @Input() icon = 'search';
  @Input() actionLabel?: string;
  @Input() actionIcon?: string;
  @Output() actionClick = new EventEmitter<void>();
}
