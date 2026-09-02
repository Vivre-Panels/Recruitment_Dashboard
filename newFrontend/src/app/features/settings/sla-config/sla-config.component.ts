import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../../core/services/settings.service';
import { ToastService } from '../../../core/services/toast.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-settings-sla-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    IconComponent
  ],
  template: `
    <div class="space-y-6">
      <app-page-header
        title="SLA Rules & Escalation Matrix"
        subtitle="Configure turnaround SLA targets (hours), warning buffer thresholds, and automatic escalation pathways."
      ></app-page-header>

      <!-- SLA Rules Table -->
      <div class="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
        <div class="p-4 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
          <h3 class="text-sm font-bold text-slate-900">Configured SLA Targets</h3>
          <span class="text-xs text-slate-500 font-mono">{{ rules.length }} Rule Policies</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th class="py-3 px-4">Stage / Checkpoint</th>
                <th class="py-3 px-3 text-center">Target SLA (Hours)</th>
                <th class="py-3 px-3 text-center">Warning Buffer (Hours)</th>
                <th class="py-3 px-4">Automatic Escalation To</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              <tr *ngFor="let r of rules; let i = index" class="hover:bg-slate-50">
                <td class="py-3.5 px-4 font-semibold text-slate-900">{{ r.stage }}</td>
                <td class="py-3.5 px-3 text-center">
                  <input
                    type="number"
                    [(ngModel)]="r.targetHours"
                    class="w-20 px-2 py-1 bg-white border border-slate-300 rounded text-center font-mono font-bold text-slate-900"
                  />
                </td>
                <td class="py-3.5 px-3 text-center">
                  <input
                    type="number"
                    [(ngModel)]="r.warningHours"
                    class="w-20 px-2 py-1 bg-white border border-slate-300 rounded text-center font-mono font-bold text-amber-700"
                  />
                </td>
                <td class="py-3.5 px-4">
                  <input
                    type="text"
                    [(ngModel)]="r.escalateTo"
                    class="w-full max-w-xs px-2.5 py-1 bg-white border border-slate-300 rounded font-medium text-slate-800"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            (click)="saveSlaRules()"
            class="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <app-icon name="check" [size]="14"></app-icon>
            Save SLA Matrix
          </button>
        </div>
      </div>
    </div>
  `
})
export class SettingsSlaConfigComponent {
  private settingsService = inject(SettingsService);
  private toastService = inject(ToastService);

  rules = JSON.parse(JSON.stringify(this.settingsService.settings().slaRules));

  saveSlaRules() {
    this.settingsService.updateGeneralSettings({ slaRules: this.rules });
    this.toastService.success('SLA Matrix Saved', 'SLA target hours and escalation pathways updated.');
  }
}
