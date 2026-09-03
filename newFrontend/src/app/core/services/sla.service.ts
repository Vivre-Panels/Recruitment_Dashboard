import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { SlaRecord, SlaStatus } from '../models/recruitment.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SlaService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  private slaRecordsState = signal<SlaRecord[]>([]);
  readonly slaRecords = this.slaRecordsState.asReadonly();
  readonly isLoading = signal<boolean>(true);

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

  constructor() {
    this.loadSLAs().subscribe();
  }

  loadSLAs(): Observable<SlaRecord[]> {
    this.isLoading.set(true);
    return this.http.get<{ success: boolean; candidates: any[] }>(`${this.apiUrl}/sla/summary`).pipe(
      map(res => {
        if (!res.success || !res.candidates) return this.slaRecordsState();
        return res.candidates.map((c, idx) => this.mapApiItemToSla(c, idx));
      }),
      tap(mapped => {
        this.slaRecordsState.set(mapped);
        this.isLoading.set(false);
      }),
      catchError(err => {
        console.warn('SLA API failed, using fallback:', err);
        this.isLoading.set(false);
        return of(this.slaRecordsState());
      })
    );
  }

  private mapApiItemToSla(c: any, idx: number): SlaRecord {
    let status: SlaStatus = 'Within SLA';
    if (c.sla_status === 'Breached' || c.breach_indicator) status = 'Breached';

    return {
      id: `SLA-${c.id || idx + 1}`,
      positionId: c.application_id || `POS-${idx + 1}`,
      positionTitle: c.position || 'Position Role',
      candidateId: c.application_id,
      candidateName: c.candidate_name || 'Candidate',
      stage: c.current_stage || 'Interview Feedback',
      pendingWith: c.pending_with || 'Hiring Manager',
      role: c.pending_with?.includes('Manager') ? 'Hiring Manager' : 'Recruiter',
      elapsedHours: c.elapsed_hours || 24,
      targetHours: c.sla_limit_hours || 24,
      status,
      escalationLevel: status === 'Breached' ? 'Level 1' : 'None',
      lastUpdated: new Date().toISOString().split('T')[0]
    };
  }

  getSlaRecords(): Observable<SlaRecord[]> {
    return this.loadSLAs();
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
