import { Injectable, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Position, HealthStatus, PriorityLevel, BottleneckInfo } from '../models/recruitment.model';
import positionsMock from '../../../assets/mock/positions.json';

@Injectable({
  providedIn: 'root'
})
export class PositionService {
  private positionsState = signal<Position[]>(positionsMock as Position[]);

  readonly positions = this.positionsState.asReadonly();

  readonly totalRequiredHc = computed(() => 
    this.positionsState().reduce((acc, p) => acc + p.requiredHc, 0)
  );

  readonly totalJoinedHc = computed(() => 
    this.positionsState().reduce((acc, p) => acc + p.joinedHc, 0)
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

  getPositions(): Observable<Position[]> {
    return of(this.positionsState());
  }

  getPositionById(id: string): Position | undefined {
    return this.positionsState().find(p => p.id.toLowerCase() === id.toLowerCase());
  }

  createPosition(newPosition: Partial<Position>): Position {
    const id = `POS-${100 + this.positionsState().length + 1}`;
    const position: Position = {
      id,
      title: newPosition.title || 'Untitled Position',
      department: newPosition.department || 'Engineering',
      requiredHc: newPosition.requiredHc || 1,
      joinedHc: 0,
      priority: newPosition.priority || 'P1',
      owner: newPosition.owner || 'Rahul Sharma',
      recruiterId: newPosition.recruiterId || 'REC-1',
      hiringManager: newPosition.hiringManager || 'Vikram Malhotra (VP Eng)',
      targetDate: newPosition.targetDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
      salaryRange: newPosition.salaryRange || '$120k - $150k',
      location: newPosition.location || 'San Francisco, CA (Hybrid)',
      experienceRange: newPosition.experienceRange || '5 - 8 Years',
      status: 'On Track',
      mustHaveSkills: newPosition.mustHaveSkills || ['Problem Solving', 'Communication'],
      knockoutCriteria: newPosition.knockoutCriteria || ['Experience requirement not met'],
      description: newPosition.description || 'Enterprise role responsible for operational scale.',
      funnelCounts: {
        sourced: 0,
        screened: 0,
        interviewed: 0,
        selected: 0,
        offered: 0,
        accepted: 0,
        joined: 0
      },
      activeCandidatesCount: 0
    };

    this.positionsState.update(list => [position, ...list]);
    return position;
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
