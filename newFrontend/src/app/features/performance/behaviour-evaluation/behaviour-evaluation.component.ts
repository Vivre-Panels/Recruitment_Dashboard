import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PerformanceService } from '../../../core/services/performance.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-performance-behaviour-evaluation',
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
        title="Behaviour & Working Evaluation"
        subtitle="Qualitative review of working discipline, team collaboration, transparency, responsiveness, and process adherence."
      >
        <div badges class="flex items-center gap-2">
          <span class="text-xs font-mono font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
            Qualitative & Culture Dimension
          </span>
        </div>
      </app-page-header>

      <!-- Behaviour Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div 
          *ngFor="let b of performanceService.behaviourEvaluations()"
          class="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4"
        >
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 class="text-base font-bold text-slate-900">{{ b.recruiterName }}</h3>
              <span class="text-xs font-mono text-slate-400">{{ b.recruiterId }}</span>
            </div>
            <div class="text-right">
              <span class="text-base font-bold font-mono text-blue-700">{{ b.overallBehaviourScore }}%</span>
              <span class="text-[10px] uppercase font-bold text-slate-400 block">Behaviour Index</span>
            </div>
          </div>

          <!-- 7 Dimensions Rating Matrix -->
          <div class="space-y-2.5 text-xs">
            <div class="flex items-center justify-between">
              <span class="text-slate-600 font-medium">1. Reliability & Commitment</span>
              <span class="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">★ {{ b.reliabilityScore }} / 5.0</span>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-slate-600 font-medium">2. Transparency & Honest Status Reporting</span>
              <span class="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">★ {{ b.transparencyScore }} / 5.0</span>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-slate-600 font-medium">3. Initiative & Proactive Problem Solving</span>
              <span class="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">★ {{ b.initiativeScore }} / 5.0</span>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-slate-600 font-medium">4. Team Collaboration & Peer Behaviour</span>
              <span class="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">★ {{ b.teamBehaviourScore }} / 5.0</span>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-slate-600 font-medium">5. Operational Discipline</span>
              <span class="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">★ {{ b.disciplineScore }} / 5.0</span>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-slate-600 font-medium">6. Responsiveness to Stakeholders</span>
              <span class="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">★ {{ b.responsivenessScore }} / 5.0</span>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-slate-600 font-medium">7. Process & ATS Policy Adherence</span>
              <span class="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">★ {{ b.processAdherenceScore }} / 5.0</span>
            </div>
          </div>

          <!-- Manager Qualitative Remarks -->
          <div class="pt-2 border-t border-slate-100">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Manager Qualitative Assessment</span>
            <p class="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200/70 italic leading-relaxed">
              "{{ b.managerNotes }}"
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PerformanceBehaviourEvaluationComponent {
  performanceService = inject(PerformanceService);
}
