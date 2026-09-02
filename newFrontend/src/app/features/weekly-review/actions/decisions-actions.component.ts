import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WeeklyReviewService } from '../../../core/services/weekly-review.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PriorityBadgeComponent } from '../../../shared/components/priority-badge/priority-badge.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-weekly-review-actions',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    PageHeaderComponent,
    PriorityBadgeComponent,
    StatusBadgeComponent,
    IconComponent
  ],
  template: `
    <div class="app-page-container">
      <app-page-header
        title="Decisions & Action Items Tracker"
        subtitle="Operational commitments agreed upon during weekly recruitment reviews (Read-Only Data View)."
      >
        <div badges class="flex items-center gap-2">
          <span class="text-xs font-mono font-semibold px-3 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200">
            {{ reviewService.pendingActionsCount() + reviewService.inProgressActionsCount() }} Active Commitments
          </span>
          <span class="text-xs font-semibold px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
            Read-Only Matrix
          </span>
        </div>
      </app-page-header>

      <!-- Actions Read-Only Table -->
      <div class="app-card p-0 overflow-hidden">
        <div class="p-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
          <h3 class="text-sm font-bold text-slate-900">Weekly Action Matrix</h3>
          <span class="text-xs text-slate-500 font-mono">{{ reviewService.actions().length }} Total Action Items</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr>
                <th class="app-table-th">Action Item & Issue</th>
                <th class="app-table-th">Position</th>
                <th class="app-table-th">Owner</th>
                <th class="app-table-th font-mono">Due Date</th>
                <th class="app-table-th text-center">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              <tr 
                *ngFor="let a of reviewService.actions()"
                class="hover:bg-slate-50/80 transition-colors"
              >
                <!-- Issue -->
                <td class="app-table-td font-semibold text-slate-900">
                  <span class="font-bold text-slate-900 block">{{ a.issue }}</span>
                  <span class="text-[11px] text-slate-500 block font-normal mt-0.5">{{ a.decision }}</span>
                </td>

                <!-- Position -->
                <td class="app-table-td font-medium text-slate-800">{{ a.positionTitle }}</td>

                <!-- Owner -->
                <td class="app-table-td font-bold text-slate-900">{{ a.owner }}</td>

                <!-- Due Date -->
                <td class="app-table-td font-mono text-slate-600 whitespace-nowrap">{{ a.dueDate }}</td>

                <!-- Status -->
                <td class="app-table-td text-center">
                  <app-status-badge [status]="a.status"></app-status-badge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class WeeklyReviewActionsComponent {
  reviewService = inject(WeeklyReviewService);
}
