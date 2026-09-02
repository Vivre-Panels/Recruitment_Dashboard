import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div 
      *ngIf="isOpen" 
      class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6"
    >
      <!-- Backdrop -->
      <div 
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
        (click)="closeOnBackdrop ? close() : null"
      ></div>

      <!-- Dialog panel -->
      <div 
        class="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full overflow-hidden transform transition-all duration-200 z-10 flex flex-col max-h-[90vh]"
        [ngClass]="sizeClass"
      >
        <!-- Header -->
        <div class="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/60">
          <div>
            <h3 class="text-base font-bold text-slate-900 tracking-tight">{{ title }}</h3>
            <p *ngIf="subtitle" class="text-xs text-slate-500 mt-1 leading-relaxed">{{ subtitle }}</p>
          </div>
          <button 
            type="button" 
            (click)="close()"
            class="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-200/60 transition-colors"
          >
            <app-icon name="x" [size]="18"></app-icon>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 overflow-y-auto flex-1 text-xs sm:text-sm text-slate-700 space-y-6">
          <ng-content></ng-content>
        </div>

        <!-- Footer -->
        <div *ngIf="showFooter" class="p-6 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end gap-3 shrink-0">
          <ng-content select="[footer]"></ng-content>
        </div>
      </div>
    </div>
  `
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() subtitle?: string;
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' | '2xl' = 'md';
  @Input() showFooter = true;
  @Input() closeOnBackdrop = true;
  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() closed = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.isOpen) {
      this.close();
    }
  }

  get sizeClass(): string {
    switch (this.size) {
      case 'sm': return 'max-w-sm';
      case 'md': return 'max-w-md';
      case 'lg': return 'max-w-lg';
      case 'xl': return 'max-w-2xl';
      case '2xl': return 'max-w-4xl';
      default: return 'max-w-md';
    }
  }

  close() {
    this.isOpen = false;
    this.isOpenChange.emit(false);
    this.closed.emit();
  }
}
