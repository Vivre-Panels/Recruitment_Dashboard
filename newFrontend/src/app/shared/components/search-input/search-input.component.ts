import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="relative w-full max-w-md">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
        <app-icon name="search" [size]="16"></app-icon>
      </div>
      
      <input
        type="text"
        [(ngModel)]="value"
        (ngModelChange)="onValueChange($event)"
        [placeholder]="placeholder"
        class="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
      />

      <button
        *ngIf="value"
        (click)="clear()"
        class="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
        title="Clear search"
      >
        <app-icon name="x" [size]="14"></app-icon>
      </button>
    </div>
  `
})
export class SearchInputComponent {
  @Input() value = '';
  @Input() placeholder = 'Search...';
  @Output() valueChange = new EventEmitter<string>();

  onValueChange(val: string) {
    this.value = val;
    this.valueChange.emit(val);
  }

  clear() {
    this.value = '';
    this.valueChange.emit('');
  }
}
