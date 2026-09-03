import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { SystemSettings } from '../models/recruitment.model';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private settingsState = signal<SystemSettings>({
    companyName: 'Vivre Panels ERP',
    timezone: 'Asia/Kolkata',
    defaultCurrency: 'INR',
    retentionBenchmarkDays: 30,
    p0TargetDays: 14,
    p1TargetDays: 30,
    p2TargetDays: 45,
    slaRules: [
      { stage: 'Screening', targetHours: 24, warningHours: 18, escalateTo: 'Lead Recruiter' },
      { stage: 'Interview', targetHours: 48, warningHours: 36, escalateTo: 'Hiring Manager' }
    ],
    pipelineStages: []
  });

  readonly settings = this.settingsState.asReadonly();

  getSettings(): Observable<SystemSettings> {
    return of(this.settingsState());
  }

  updateGeneralSettings(updates: Partial<SystemSettings>): void {
    this.settingsState.update(s => ({ ...s, ...updates }));
  }

  updateSlaRule(index: number, updatedRule: SystemSettings['slaRules'][0]): void {
    this.settingsState.update(s => {
      const rules = [...s.slaRules];
      rules[index] = updatedRule;
      return { ...s, slaRules: rules };
    });
  }
}
