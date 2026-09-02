import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { SystemSettings } from '../models/recruitment.model';
import settingsMock from '../../../assets/mock/settings.json';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private settingsState = signal<SystemSettings>(settingsMock as SystemSettings);

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
