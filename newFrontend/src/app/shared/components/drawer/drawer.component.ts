import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-drawer',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div 
      *ngIf="isOpen" 
      class="fixed inset-0 z-50 overflow-hidden"
    >
      <!-- Backdrop -->
      <div 
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out"
        (click)="close()"
      ></div>

      <!-- Drawer panel -->
      <div class="fixed inset-y-0 right-0 max-w-full flex pl-10 z-10">
        <div 
          class="w-screen bg-white shadow-2xl flex flex-col transform transition ease-in-out duration-300"
          [ngClass]="widthClass"
        >
          <!-- Header -->
          <div class="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div>
              <h2 class="text-base sm:text-lg font-bold text-slate-900 tracking-tight">{{ title }}</h2>
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
          <div class="flex-1 p-6 overflow-y-auto space-y-6">
            <ng-content></ng-content>
          </div>

          <!-- Footer -->
          <div *ngIf="showFooter" class="p-6 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end gap-3 shrink-0">
            <ng-content select="[footer]"></ng-content>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DrawerComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() subtitle?: string;
  @Input() width: 'sm' | 'md' | 'lg' | 'xl' | '2xl' = 'lg';
  @Input() showFooter = true;
  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() closed = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.isOpen) {
      this.close();
    }
  }

  get widthClass(): string {
    switch (this.width) {
      case 'sm': return 'max-w-sm';
      case 'md': return 'max-w-md';
      case 'lg': return 'max-w-lg';
      case 'xl': return 'max-w-2xl';
      case '2xl': return 'max-w-4xl';
      default: return 'max-w-lg';
    }
  }

  close() {
    this.isOpen = false;
    this.isOpenChange.emit(false);
    this.closed.emit();
  }
}
