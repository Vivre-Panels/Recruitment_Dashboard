import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PerformanceService } from '../../../core/services/performance.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-performance-evaluation',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PageHeaderComponent,
    IconComponent
  ],
  template: `
    <div class="space-y-6">
      <app-page-header
        title="Performance Evaluation (Operational Deliverables)"
        subtitle="Objective assessment of Results, Candidate Quality, Deadline Achievement, and End-to-End Ownership."
      >
        <div badges class="flex items-center gap-2">
          <span class="text-xs font-mono font-semibold px-2.5 py-1 bg-brand-50 text-brand-700 rounded-full border border-brand-200">
            Operational Dimension (KPI Driven)
          </span>
        </div>
      </app-page-header>

      <!-- Evaluation Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div 
          *ngFor="let p of performanceService.performanceEvaluations()"
          class="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4"
        >
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 class="text-base font-bold text-slate-900">{{ p.recruiterName }}</h3>
              <span class="text-xs font-mono text-slate-400">{{ p.recruiterId }}</span>
            </div>
            <div class="text-right">
              <span class="text-base font-bold font-mono text-brand-700">{{ p.overallPerformanceScore }}%</span>
              <span class="text-[10px] uppercase font-bold text-slate-400 block">Performance Index</span>
            </div>
          </div>

          <!-- 4 Dimensions Score Blocks -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div class="p-2.5 bg-slate-50 rounded-lg border border-slate-200/70">
              <span class="text-[10px] text-slate-400 uppercase font-bold block">1. Results</span>
              <span class="text-sm font-bold text-slate-900 font-mono mt-0.5 block">{{ p.resultsScore }}%</span>
            </div>

            <div class="p-2.5 bg-slate-50 rounded-lg border border-slate-200/70">
              <span class="text-[10px] text-slate-400 uppercase font-bold block">2. Quality</span>
              <span class="text-sm font-bold text-emerald-700 font-mono mt-0.5 block">{{ p.qualityScore }}%</span>
            </div>

            <div class="p-2.5 bg-slate-50 rounded-lg border border-slate-200/70">
              <span class="text-[10px] text-slate-400 uppercase font-bold block">3. Deadlines</span>
              <span class="text-sm font-bold text-blue-700 font-mono mt-0.5 block">{{ p.deadlinesScore }}%</span>
            </div>

            <div class="p-2.5 bg-slate-50 rounded-lg border border-slate-200/70">
              <span class="text-[10px] text-slate-400 uppercase font-bold block">4. Ownership</span>
              <span class="text-sm font-bold text-brand-700 font-mono mt-0.5 block">{{ p.ownershipScore }}%</span>
            </div>
          </div>

          <!-- Strengths -->
          <div>
            <span class="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">Key Strengths</span>
            <ul class="space-y-1 text-xs text-slate-700">
              <li *ngFor="let str of p.strengths" class="flex items-center gap-1.5">
                <app-icon name="check-circle" [size]="13" class="text-emerald-500 shrink-0"></app-icon>
                <span>{{ str }}</span>
              </li>
            </ul>
          </div>

          <!-- Improvement Areas -->
          <div>
            <span class="text-[11px] font-bold text-amber-800 uppercase tracking-wider block mb-1">Improvement Priorities</span>
            <ul class="space-y-1 text-xs text-slate-700">
              <li *ngFor="let imp of p.improvements" class="flex items-center gap-1.5">
                <app-icon name="alert-triangle" [size]="13" class="text-amber-500 shrink-0"></app-icon>
                <span>{{ imp }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PerformanceEvaluationComponent {
  performanceService = inject(PerformanceService);
}
