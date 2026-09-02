import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../../core/services/settings.service';
import { ToastService } from '../../../core/services/toast.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PriorityBadgeComponent } from '../../../shared/components/priority-badge/priority-badge.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-settings-recruitment-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    PriorityBadgeComponent,
    IconComponent
  ],
  template: `
    <div class="space-y-6">
      <app-page-header
        title="Recruitment Workflow & Priority Configuration"
        subtitle="Define closure target buffers by priority and manage stages of the active recruitment lifecycle."
      ></app-page-header>

      <!-- Priority Threshold Configuration -->
      <div class="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs space-y-4">
        <h3 class="text-sm font-bold text-slate-900">Priority Target Closure Thresholds</h3>
        
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div class="p-4 bg-red-50/40 rounded-xl border border-red-200 space-y-2">
            <div class="flex items-center justify-between">
              <app-priority-badge priority="P0"></app-priority-badge>
              <span class="text-red-700 font-bold">Critical Role</span>
            </div>
            <label class="block font-semibold text-slate-700">Target Closure Days</label>
            <input
              type="number"
              [(ngModel)]="settings.p0TargetDays"
              class="w-full px-3 py-2 bg-white border border-red-200 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <span class="text-[11px] text-slate-500 block">Executive escalation trigger if exceeded</span>
          </div>

          <div class="p-4 bg-amber-50/40 rounded-xl border border-amber-200 space-y-2">
            <div class="flex items-center justify-between">
              <app-priority-badge priority="P1"></app-priority-badge>
              <span class="text-amber-700 font-bold">High Priority</span>
            </div>
            <label class="block font-semibold text-slate-700">Target Closure Days</label>
            <input
              type="number"
              [(ngModel)]="settings.p1TargetDays"
              class="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <span class="text-[11px] text-slate-500 block">Standard active engineering/business hiring</span>
          </div>

          <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div class="flex items-center justify-between">
              <app-priority-badge priority="P2"></app-priority-badge>
              <span class="text-slate-700 font-bold">Standard Role</span>
            </div>
            <label class="block font-semibold text-slate-700">Target Closure Days</label>
            <input
              type="number"
              [(ngModel)]="settings.p2TargetDays"
              class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <span class="text-[11px] text-slate-500 block">Ongoing pipeline and team replenishment</span>
          </div>
        </div>
      </div>

      <!-- Pipeline Stages List -->
      <div class="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
        <div class="p-4 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 class="text-sm font-bold text-slate-900">Standard Pipeline Stages</h3>
            <p class="text-xs text-slate-500">Ordered checkpoints for candidate progression</p>
          </div>
          <span class="text-xs font-mono text-slate-500 font-semibold">{{ settings.pipelineStages.length }} Stages</span>
        </div>

        <div class="divide-y divide-slate-100 text-xs">
          <div 
            *ngFor="let stg of settings.pipelineStages"
            class="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div class="flex items-center gap-3">
              <span class="w-6 h-6 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center font-mono">
                {{ stg.order }}
              </span>
              <div>
                <h4 class="font-bold text-slate-900 text-sm">{{ stg.name }}</h4>
                <p class="text-slate-500 text-[11px] mt-0.5">{{ stg.description }}</p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <span 
                class="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                [ngClass]="stg.isMandatory ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'"
              >
                {{ stg.isMandatory ? 'Mandatory Gate' : 'Optional' }}
              </span>
            </div>
          </div>
        </div>

        <div class="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            (click)="save()"
            class="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <app-icon name="check" [size]="14"></app-icon>
            Save Recruitment Configuration
          </button>
        </div>
      </div>
    </div>
  `
})
export class SettingsRecruitmentConfigComponent {
  private settingsService = inject(SettingsService);
  private toastService = inject(ToastService);

  settings = { ...this.settingsService.settings() };

  save() {
    this.settingsService.updateGeneralSettings(this.settings);
    this.toastService.success('Configuration Saved', 'Priority closure thresholds and stage settings saved.');
  }
}
