import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Position, HealthStatus, PriorityLevel } from '../models/recruitment.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PositionService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  private positionsState = signal<Position[]>([]);
  readonly positions = this.positionsState.asReadonly();
  readonly isLoading = signal<boolean>(true);

  readonly totalRequiredHc = computed(() => 
    this.positionsState().reduce((acc, p) => acc + (p.requiredHc || 1), 0)
  );

  readonly totalJoinedHc = computed(() => 
    this.positionsState().reduce((acc, p) => acc + (p.joinedHc || 0), 0)
  );

  readonly balanceHc = computed(() => 
    this.totalRequiredHc() - this.totalJoinedHc()
  );

  readonly p0PositionsCount = computed(() => 
    this.positionsState().filter(p => p.priority === 'P0').length
  );

  readonly positionsAtRiskCount = computed(() => 
    this.positionsState().filter(p => p.status === 'At Risk').length
  );

  readonly positionsCriticalCount = computed(() => 
    this.positionsState().filter(p => p.status === 'Critical').length
  );

  readonly positionsOnTrackCount = computed(() => 
    this.positionsState().filter(p => p.status === 'On Track').length
  );

  constructor() {
    this.loadPositions().subscribe();
  }

  loadPositions(): Observable<Position[]> {
    if (this.positionsState().length === 0) {
      this.isLoading.set(true);
    }
    return this.http.get<{ success: boolean; data: any[] }>(`${this.apiUrl}/control-tower`).pipe(
      map(res => {
        if (!res.success || !res.data) return this.positionsState();
        return res.data.map(item => this.mapApiItemToPosition(item));
      }),
      tap(mapped => {
        this.positionsState.set(mapped);
        this.isLoading.set(false);
      }),
      catchError(err => {
        console.warn('Backend connection failed, using existing state fallback:', err);
        this.isLoading.set(false);
        return of(this.positionsState());
      })
    );
  }

  private mapApiItemToPosition(item: any): Position {
    const funnel = item.funnel || {};
    const b = item.bottleneck || {};
    
    let status: HealthStatus = 'On Track';
    if (item.rag_status === 'Red') status = 'Critical';
    else if (item.rag_status === 'Amber') status = 'At Risk';

    return {
      id: item.job_opening_id || item.requisition_id || `POS-${item.id}`,
      title: item.job_title || 'Untitled Position',
      department: item.department || 'Engineering',
      requiredHc: item.required_hc || 1,
      joinedHc: funnel.joined || 0,
      priority: (item.priority as PriorityLevel) || 'P1',
      owner: item.owner || 'Recruiter',
      recruiterId: `REC-${item.id}`,
      hiringManager: item.hiring_manager || 'Hiring Manager',
      targetDate: item.target_date || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
      salaryRange: item.salary_range || 'Not Disclosed',
      location: item.location || 'Pan India',
      experienceRange: item.experience_required || 'Not Specified',
      status,
      mustHaveSkills: item.must_haves ? item.must_haves.split(',') : (item.job_title ? [item.job_title] : []),
      knockoutCriteria: item.knockout_criteria ? item.knockout_criteria.split(',') : [],
      description: item.remarks || item.job_description || '',
      funnelCounts: {
        sourced: funnel.sourced || 0,
        screened: funnel.screened || 0,
        interviewed: funnel.interview_completed || funnel.interview_scheduled || 0,
        selected: funnel.comp_approval || 0,
        offered: funnel.offered || 0,
        accepted: funnel.offered || 0,
        joined: funnel.joined || 0
      },
      bottleneck: b.type ? {
        stage: b.type,
        issue: b.remarks || b.type,
        pendingWith: b.action_owner || 'Owner',
        pendingSinceDays: b.elapsed_hours ? Math.round(b.elapsed_hours / 24) : 1,
        slaStatus: item.rag_status === 'Red' ? 'Breached' : (item.rag_status === 'Amber' ? 'At Risk' : 'Within SLA'),
        remark: b.remarks,
        actionTaken: b.action_owner
      } : undefined,
      activeCandidatesCount: (funnel.sourced || 0) - (funnel.joined || 0)
    };
  }

  getPositions(): Observable<Position[]> {
    return this.loadPositions();
  }

  getPositionById(id: string): Position | undefined {
    return this.positionsState().find(p => p.id.toLowerCase() === id.toLowerCase());
  }

  createPosition(newPosition: Partial<Position>): Position {
    const payload = {
      Requisition_ID: `REQ-${Date.now()}`,
      Job_Opening_ID: newPosition.id || `JOB-${Date.now()}`,
      Job_Title: newPosition.title,
      Department: newPosition.department,
      No_Of_Openings: newPosition.requiredHc || 1,
      Recruiter_Name: newPosition.owner,
      Hiring_Manager: newPosition.hiringManager,
      Priority: newPosition.priority || 'P1',
      Target_Date: newPosition.targetDate,
      Status: 'Open'
    };

    this.http.post(`${this.apiUrl}/requisition`, payload).subscribe({
      next: () => this.loadPositions().subscribe(),
      error: (err) => console.error('Failed to create requisition API:', err)
    });

    const created = this.mapApiItemToPosition(payload);
    this.positionsState.update(list => [created, ...list]);
    return created;
  }

  updatePosition(id: string, updates: Partial<Position>): boolean {
    let updated = false;
    this.positionsState.update(list => 
      list.map(p => {
        if (p.id === id) {
          updated = true;
          return { ...p, ...updates };
        }
        return p;
      })
    );
    return updated;
  }

  updateBottleneck(positionId: string, remark: string, slaStatus?: 'Within SLA' | 'At Risk' | 'Breached'): void {
    this.positionsState.update(list =>
      list.map(p => {
        if (p.id === positionId && p.bottleneck) {
          return {
            ...p,
            bottleneck: {
              ...p.bottleneck,
              remark,
              slaStatus: slaStatus || p.bottleneck.slaStatus,
              actionTaken: `Updated on ${new Date().toLocaleDateString()}`
            }
          };
        }
        return p;
      })
    );
  }

  updateStatus(positionId: string, status: HealthStatus): void {
    this.updatePosition(positionId, { status });
  }
}
