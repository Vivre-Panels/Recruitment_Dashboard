import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Recruiter, RecruiterInsightItem } from '../models/recruitment.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RecruiterService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  private recruitersState = signal<Recruiter[]>([]);
  readonly recruiters = this.recruitersState.asReadonly();
  readonly isLoading = signal<boolean>(true);

  readonly totalRecruiters = computed(() => this.recruitersState().length);

  readonly topPerformers = computed(() => 
    this.recruitersState().filter(r => r.status === 'Top Performer')
  );

  readonly avgOverallScore = computed(() => {
    const list = this.recruitersState();
    if (!list.length) return 0;
    const sum = list.reduce((acc, r) => acc + r.overallScore, 0);
    return Math.round((sum / list.length) * 10) / 10;
  });

  // 4-Factor Weighted Model:
  // Successful Hires: 50%
  // Deadline Achievement: 20%
  // Candidate Quality: 20%
  // Process Discipline: 10%
  readonly scoreWeights = {
    successfulHires: 50,
    deadlineAchievement: 20,
    candidateQuality: 20,
    processDiscipline: 10
  };

  constructor() {
    this.loadScorecard().subscribe();
  }

  loadScorecard(): Observable<Recruiter[]> {
    this.isLoading.set(true);
    return this.http.get<{ success: boolean; data: any[] }>(`${this.apiUrl}/metrics/scorecard`).pipe(
      map(res => {
        if (!res.success || !res.data) return this.recruitersState();
        return res.data.map((item, idx) => this.mapApiItemToRecruiter(item, idx));
      }),
      tap(mapped => {
        this.recruitersState.set(mapped);
        this.isLoading.set(false);
      }),
      catchError(err => {
        console.warn('Scorecard API failed, using fallback state:', err);
        this.isLoading.set(false);
        return of(this.recruitersState());
      })
    );
  }

  private mapApiItemToRecruiter(item: any, idx: number): Recruiter {
    const overall = Math.round(item.weighted_total_score || 75);
    let status: 'Top Performer' | 'On Target' | 'Needs Improvement' = 'On Target';
    if (overall >= 80) status = 'Top Performer';
    else if (overall < 65) status = 'Needs Improvement';

    return {
      id: `REC-${idx + 1}`,
      name: item.recruiter_name || 'Recruiter',
      email: `${(item.recruiter_name || 'recruiter').toLowerCase().replace(/\s+/g, '.')}@vivrepanels.com`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.recruiter_name}`,
      department: 'Talent Acquisition',
      assignedPositions: item.total_assigned || 5,
      successfulHires: item.joined || 3,
      deadlineAchievementPct: Math.round(item.deadline_compliance_score || 85),
      candidateQualityScore: Math.round(item.quality_conversion_score || 75),
      processDisciplineScore: Math.round(item.process_discipline_sla_score || 90),
      overallScore: overall,
      activeCandidates: item.total_assigned || 10,
      avgDaysToHire: 22,
      retentionRate30Days: 95,
      status
    };
  }

  getRecruiters(): Observable<Recruiter[]> {
    return this.loadScorecard();
  }

  getRecruiterById(id: string): Recruiter | undefined {
    return this.recruitersState().find(r => r.id.toLowerCase() === id.toLowerCase());
  }

  getRecruiterInsights(filters: { recruiter?: string; position?: string; from?: string; to?: string }): Observable<{
    success: boolean;
    data: RecruiterInsightItem[];
    filter_options: { recruiters: string[]; positions: string[] };
  }> {
    let params: any = {};
    if (filters.recruiter && filters.recruiter !== 'ALL') params.recruiter = filters.recruiter;
    if (filters.position && filters.position !== 'ALL') params.position = filters.position;
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;

    // Try primary API endpoint first
    return this.http.get<{
      success: boolean;
      data: RecruiterInsightItem[];
      filter_options: { recruiters: string[]; positions: string[] };
    }>(`${this.apiUrl}/recruiter-insights`, { params }).pipe(
      map(res => {
        if (res && res.success && res.data && res.data.length > 0) {
          return res;
        }
        throw new Error('Primary insights endpoint returned no data');
      }),
      catchError(() => {
        // Try local backend server if primary failed
        return this.http.get<{
          success: boolean;
          data: RecruiterInsightItem[];
          filter_options: { recruiters: string[]; positions: string[] };
        }>(`http://localhost:8080/recruit_api/recruiter-insights`, { params }).pipe(
          map(res => {
            if (res && res.success && res.data && res.data.length > 0) {
              return res;
            }
            throw new Error('Local insights endpoint returned no data');
          }),
          catchError(() => {
            // Aggregate directly from real live /applications DB endpoint
            return this.aggregateFromLiveApplications(filters);
          })
        );
      })
    );
  }

  private aggregateFromLiveApplications(filters: { recruiter?: string; position?: string; from?: string; to?: string }): Observable<{
    success: boolean;
    data: RecruiterInsightItem[];
    filter_options: { recruiters: string[]; positions: string[] };
  }> {
    return forkJoin({
      applications: this.http.get<{ success: boolean; data: any[] }>(`${this.apiUrl}/applications`),
      recruiters: this.http.get<{ success: boolean; data: any[] }>(`${this.apiUrl}/recruiters`)
    }).pipe(
      map(({ applications: res, recruiters: recruiterRes }) => {
        const apps = (res && res.success && Array.isArray(res.data)) ? res.data : [];
        const activeRecruiters = (recruiterRes && recruiterRes.success && Array.isArray(recruiterRes.data))
          ? recruiterRes.data
            .filter(recruiter => String(recruiter.status || '').toLowerCase() === 'active')
            .map(recruiter => String(recruiter.recruiter_name || '').trim())
            .filter(Boolean)
          : [];
        const allPositionsSet = new Set<string>();

        // Map to group by "RecruiterName|Position"
        const grouped = new Map<string, RecruiterInsightItem>();

        apps.forEach(app => {
          const rawRec = (app.Recruiter_Name || '').trim();
          
          const matchedRec = activeRecruiters.find(r => r.toLowerCase() === rawRec.toLowerCase());

          // Ignore records not belonging to an official recruiter (e.g. former employees or parser artifacts)
          if (!matchedRec) return;

          const recName = matchedRec;
          const posTitle = (app.Posting_Title || 'General').trim();

          if (posTitle && posTitle !== 'General') allPositionsSet.add(posTitle);

          // Apply chained filters
          if (filters.recruiter && filters.recruiter !== 'ALL') {
            if (!recName.toLowerCase().includes(filters.recruiter.toLowerCase())) return;
          }
          if (filters.position && filters.position !== 'ALL') {
            if (!posTitle.toLowerCase().includes(filters.position.toLowerCase())) return;
          }
          if (filters.from && app.Application_Created_Time) {
            if (new Date(app.Application_Created_Time) < new Date(filters.from)) return;
          }
          if (filters.to && app.Application_Created_Time) {
            const toDate = new Date(filters.to);
            toDate.setDate(toDate.getDate() + 1);
            if (new Date(app.Application_Created_Time) > toDate) return;
          }

          const key = `${recName}|${posTitle}`;
          if (!grouped.has(key)) {
            grouped.set(key, {
              recruiter_name: recName,
              position: posTitle,
              cv_sourced: 0,
              approved: 0,
              interviewed: 0,
              selected: 0,
              offered: 0,
              accepted: 0,
              joined: 0,
              successful_hire: 0
            });
          }

          const item = grouped.get(key)!;
          const status = (app.Application_Status || '').toLowerCase();

          item.cv_sourced++;

          if (status.includes('approve') || status.includes('shortlist') || status.includes('qualified')) {
            item.approved++;
          }
          if (app.Manager_Round_Completed_Time || app.Manager_Interview_DateTime || status.includes('interview') || status.includes('round') || status.includes('test')) {
            item.interviewed++;
          }
          if (status.includes('select') || status.includes('cleared') || status.includes('completed')) {
            item.selected++;
          }
          if (app.Offer_Accepted_DateTime || status.includes('offer') || status.includes('loi')) {
            item.offered++;
          }
          if (app.Offer_Accepted_DateTime || status.includes('accept') || status.includes('hired')) {
            item.accepted++;
          }
          if (status === 'joined' || status.includes('onboard')) {
            item.joined++;
          }
          if (status === 'joined' || status.includes('hired')) {
            item.successful_hire++;
          }
        });

        const dataList = Array.from(grouped.values()).sort((a, b) =>
          a.recruiter_name.localeCompare(b.recruiter_name) || a.position.localeCompare(b.position)
        );

        return {
          success: true,
          data: dataList,
          filter_options: {
            recruiters: activeRecruiters.slice().sort(),
            positions: Array.from(allPositionsSet).sort()
          }
        };
      }),
      catchError(err => {
        console.error('Failed to aggregate from live applications DB:', err);
        return of({
          success: true,
          data: [],
          filter_options: { recruiters: [], positions: [] }
        });
      })
    );
  }
}


