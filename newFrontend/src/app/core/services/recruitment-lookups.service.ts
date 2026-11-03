import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RecruiterOption {
  recruiter_id: number;
  recruiter_name: string;
  email: string;
  User_ID: string;
  status: string;
}

interface RecruitmentLookups {
  departments: string[];
  teams: string[];
  hiring_managers: string[];
  priorities: string[];
  statuses: string[];
  recruiters: RecruiterOption[];
}

@Injectable({ providedIn: 'root' })
export class RecruitmentLookupsService {
  private http = inject(HttpClient);
  private state = signal<RecruitmentLookups>({
    departments: [],
    teams: [],
    hiring_managers: [],
    priorities: [],
    statuses: [],
    recruiters: []
  });

  readonly departments = computed(() => this.state().departments);
  readonly teams = computed(() => this.state().teams);
  readonly hiringManagers = computed(() => this.state().hiring_managers);
  readonly priorities = computed(() => this.state().priorities);
  readonly statuses = computed(() => this.state().statuses);
  readonly recruiters = computed(() => this.state().recruiters);
  readonly isLoading = signal(true);
  readonly loadError = signal('');

  constructor() {
    this.load().subscribe();
  }

  load() {
    this.isLoading.set(true);
    this.loadError.set('');
    return this.http.get<{ success: boolean; data: RecruitmentLookups }>(
      `${environment.apiUrl}/lookups/recruitment`
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.state.set({
            departments: response.data.departments || [],
            teams: response.data.teams || [],
            hiring_managers: response.data.hiring_managers || [],
            priorities: response.data.priorities || [],
            statuses: response.data.statuses || [],
            recruiters: response.data.recruiters || []
          });
        }
        this.isLoading.set(false);
      }),
      catchError(() => {
        this.loadError.set('Recruitment options could not be loaded from the database.');
        this.isLoading.set(false);
        return of(null);
      })
    );
  }
}
