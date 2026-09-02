import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../../core/services/toast.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      <div 
        *ngFor="let toast of toastService.toasts()"
        class="pointer-events-auto bg-white border rounded-xl shadow-lg p-4 flex items-start gap-3 transform transition-all duration-300 ease-out translate-y-0 opacity-100"
        [ngClass]="{
          'border-emerald-200 bg-emerald-50/40 text-emerald-900': toast.type === 'success',
          'border-amber-200 bg-amber-50/40 text-amber-900': toast.type === 'warning',
          'border-red-200 bg-red-50/40 text-red-900': toast.type === 'error',
          'border-blue-200 bg-blue-50/40 text-blue-900': toast.type === 'info'
        }"
      >
        <div 
          class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
          [ngClass]="{
            'bg-emerald-100 text-emerald-600': toast.type === 'success',
            'bg-amber-100 text-amber-600': toast.type === 'warning',
            'bg-red-100 text-red-600': toast.type === 'error',
            'bg-blue-100 text-blue-600': toast.type === 'info'
          }"
        >
          <app-icon [name]="getIconName(toast.type)" [size]="14"></app-icon>
        </div>

        <div class="flex-1 min-w-0">
          <h4 class="text-sm font-semibold leading-none">{{ toast.title }}</h4>
          <p class="text-xs mt-1 text-slate-600 leading-snug">{{ toast.message }}</p>
        </div>

        <button 
          (click)="toastService.dismiss(toast.id)"
          class="text-slate-400 hover:text-slate-600 shrink-0 p-1 transition-colors"
        >
          <app-icon name="x" [size]="14"></app-icon>
        </button>
      </div>
    </div>
  `
})
export class ToastContainerComponent {
  toastService = inject(ToastService);

  getIconName(type: ToastMessage['type']): string {
    switch (type) {
      case 'success': return 'check';
      case 'warning': return 'alert-triangle';
      case 'error': return 'alert-triangle';
      case 'info': return 'clock';
    }
  }
}
