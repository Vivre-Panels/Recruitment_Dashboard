import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap, catchError, switchMap } from 'rxjs/operators';
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
      switchMap((res: { success: boolean; data: any[] }): Observable<Position[]> => {
        if (res.success && res.data && res.data.length > 0) {
          return of(res.data.map((item: any) => this.mapApiItemToPosition(item)));
        }
        return this.http.get<{ success: boolean; data: any[] }>(`${this.apiUrl}/requisitions`).pipe(
          map((reqRes: { success: boolean; data: any[] }) => {
            if (!reqRes.success || !reqRes.data) return this.positionsState();
            return reqRes.data.map((item: any) => this.mapApiItemToPosition(item));
          }),
          catchError(() => of(this.positionsState()))
        );
      }),
      tap((mapped: Position[]) => {
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
    if (item.rag_status === 'Red' || item.Status === 'Critical') status = 'Critical';
    else if (item.rag_status === 'Amber' || item.Status === 'At Risk') status = 'At Risk';

    return {
      id: item.job_opening_id || item.Job_Opening_ID || item.requisition_id || item.Requisition_ID || `POS-${item.id}`,
      title: item.job_title || item.Job_Title || 'Untitled Position',
      department: item.department || item.Department || 'Engineering',
      team: item.team || item.Team || '',
      requiredHc: item.required_hc || item.no_of_openings || item.No_Of_Openings || 1,
      joinedHc: funnel.joined || 0,
      priority: (item.priority || item.Priority as PriorityLevel) || 'P1',
      owner: item.owner || item.recruiter_name || item.Recruiter_Name || '',
      recruiterId: `REC-${item.id}`,
      hiringManager: item.hiring_manager || item.Hiring_Manager || '',
      targetDate: item.target_date || item.Target_Date || '',
      createdAt: item.opening_date || item.Opening_Date || '',
      salaryRange: item.salary_range || item.Salary_Range || '',
      location: item.location || item.Location || '',
      experienceRange: item.experience_required || item.Experience_Required || '',
      status,
      mustHaveSkills: item.must_haves ? item.must_haves.split(',') : (item.job_title || item.Job_Title ? [item.job_title || item.Job_Title] : []),
      knockoutCriteria: item.knockout_criteria ? item.knockout_criteria.split(',') : [],
      description: item.remarks || item.job_description || item.Job_Description || '',
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
