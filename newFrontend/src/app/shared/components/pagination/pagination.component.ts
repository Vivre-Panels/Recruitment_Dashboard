import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t border-slate-100 text-xs">
      <!-- Item Count Summary -->
      <div class="text-slate-500 font-medium">
        Showing <span class="font-bold text-slate-800 font-mono">{{ startItem }}</span>
        to <span class="font-bold text-slate-800 font-mono">{{ endItem }}</span>
        of <span class="font-bold text-slate-900 font-mono">{{ totalItems }}</span> entries
      </div>

      <!-- Controls -->
      <div class="flex items-center gap-4">
        <!-- Page Size Select -->
        <div class="flex items-center gap-1.5 text-slate-600">
          <span>Rows per page:</span>
          <select
            [value]="pageSize"
            (change)="onPageSizeSelect($event)"
            class="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option *ngFor="let opt of pageSizeOptions" [value]="opt">{{ opt }}</option>
          </select>
        </div>

        <!-- Navigation Buttons -->
        <div class="flex items-center gap-1">
          <button
            type="button"
            [disabled]="currentPage === 1"
            (click)="goToPage(1)"
            class="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="First Page"
          >
            <app-icon name="chevrons-left" [size]="14"></app-icon>
          </button>

          <button
            type="button"
            [disabled]="currentPage === 1"
            (click)="goToPage(currentPage - 1)"
            class="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Previous Page"
          >
            <app-icon name="chevron-left" [size]="14"></app-icon>
          </button>

          <span class="px-3 py-1 font-mono font-bold text-slate-800">
            {{ currentPage }} / {{ totalPages }}
          </span>

          <button
            type="button"
            [disabled]="currentPage >= totalPages"
            (click)="goToPage(currentPage + 1)"
            class="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Next Page"
          >
            <app-icon name="chevron-right" [size]="14"></app-icon>
          </button>

          <button
            type="button"
            [disabled]="currentPage >= totalPages"
            (click)="goToPage(totalPages)"
            class="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Last Page"
          >
            <app-icon name="chevrons-right" [size]="14"></app-icon>
          </button>
        </div>
      </div>
    </div>
  `
})
export class PaginationComponent {
  @Input() currentPage = 1;
  @Input() pageSize = 10;
  @Input() totalItems = 0;
  @Input() pageSizeOptions = [10, 25, 50, 100];

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  get totalPages(): number {
    if (!this.totalItems || !this.pageSize) return 1;
    return Math.ceil(this.totalItems / this.pageSize);
  }

  get startItem(): number {
    if (this.totalItems === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }

  onPageSizeSelect(event: Event) {
    const val = Number((event.target as HTMLSelectElement).value);
    this.pageSizeChange.emit(val);
  }
}
