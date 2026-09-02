import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="py-12 px-4 flex flex-col items-center justify-center">
      <div class="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin mb-3"></div>
      <p class="text-xs font-medium text-slate-500">{{ message }}</p>
    </div>
  `
})
export class LoadingStateComponent {
  @Input() message = 'Loading data...';
}
