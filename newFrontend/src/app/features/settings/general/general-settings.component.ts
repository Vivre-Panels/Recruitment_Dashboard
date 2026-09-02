import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../../core/services/settings.service';
import { ToastService } from '../../../core/services/toast.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-settings-general',
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
        title="General System Settings"
        subtitle="Configure organization identity, regional defaults, and global retention benchmarks."
      ></app-page-header>

      <div class="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs max-w-2xl space-y-5 text-xs text-slate-800">
        <div>
          <label class="block font-bold text-slate-700 mb-1.5">Organization / Enterprise Name</label>
          <input
            type="text"
            [(ngModel)]="settings.companyName"
            class="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1.5">Primary Operational Timezone</label>
          <select
            [(ngModel)]="settings.timezone"
            class="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="America/Los_Angeles (PST - UTC-8)">America/Los_Angeles (PST - UTC-8)</option>
            <option value="America/New_York (EST - UTC-5)">America/New_York (EST - UTC-5)</option>
            <option value="Europe/London (GMT - UTC+0)">Europe/London (GMT - UTC+0)</option>
            <option value="Asia/Kolkata (IST - UTC+5:30)">Asia/Kolkata (IST - UTC+5:30)</option>
          </select>
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1.5">Default Currency</label>
          <select
            [(ngModel)]="settings.defaultCurrency"
            class="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="USD ($)">USD ($) — US Dollar</option>
            <option value="EUR (€)">EUR (€) — Euro</option>
            <option value="GBP (£)">GBP (£) — British Pound</option>
            <option value="INR (₹)">INR (₹) — Indian Rupee</option>
          </select>
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1.5">Post-Hire Successful Hire Benchmark (Days)</label>
          <input
            type="number"
            [(ngModel)]="settings.retentionBenchmarkDays"
            class="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-mono font-bold"
          />
          <span class="text-[11px] text-slate-500 mt-1 block">Number of days a newly onboarded candidate must remain to qualify as a Successful Hire.</span>
        </div>

        <div class="pt-4 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            (click)="saveSettings()"
            class="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <app-icon name="check" [size]="14"></app-icon>
            Save General Preferences
          </button>
        </div>
      </div>
    </div>
  `
})
export class SettingsGeneralComponent {
  private settingsService = inject(SettingsService);
  private toastService = inject(ToastService);

  settings = { ...this.settingsService.settings() };

  saveSettings() {
    this.settingsService.updateGeneralSettings(this.settings);
    this.toastService.success('Settings Saved', 'General organizational preferences updated.');
  }
}
