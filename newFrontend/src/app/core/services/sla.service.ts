import { Injectable, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { SlaRecord, SlaStatus } from '../models/recruitment.model';
import slaMock from '../../../assets/mock/sla.json';

@Injectable({
  providedIn: 'root'
})
export class SlaService {
  private slaRecordsState = signal<SlaRecord[]>(slaMock as SlaRecord[]);

  readonly slaRecords = this.slaRecordsState.asReadonly();

  readonly totalSlas = computed(() => this.slaRecordsState().length);

  readonly breachedCount = computed(() => 
    this.slaRecordsState().filter(s => s.status === 'Breached').length
  );

  readonly atRiskCount = computed(() => 
    this.slaRecordsState().filter(s => s.status === 'At Risk').length
  );

  readonly withinSlaCount = computed(() => 
    this.slaRecordsState().filter(s => s.status === 'Within SLA').length
  );

  readonly complianceRate = computed(() => {
    const total = this.totalSlas();
    if (!total) return 100;
    const compliant = this.withinSlaCount();
    return Math.round((compliant / total) * 1000) / 10;
  });

  getSlaRecords(): Observable<SlaRecord[]> {
    return of(this.slaRecordsState());
  }

  escalateSla(id: string, newLevel: 'Level 1' | 'Level 2' | 'Critical'): void {
    this.slaRecordsState.update(list =>
      list.map(s => {
        if (s.id === id) {
          return {
            ...s,
            escalationLevel: newLevel,
            lastUpdated: new Date().toISOString().split('T')[0]
          };
        }
        return s;
      })
    );
  }

  resolveSla(id: string): void {
    this.slaRecordsState.update(list =>
      list.map(s => {
        if (s.id === id) {
          return {
            ...s,
            status: 'Within SLA',
            escalationLevel: 'None',
            lastUpdated: new Date().toISOString().split('T')[0]
          };
        }
        return s;
      })
    );
  }
}
