import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { FunnelMetric, HireQualityMetric, PipelineStage } from '../models/recruitment.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  private funnelState = signal<FunnelMetric[]>([]);
  private dropOffReasonsState = signal([]);
  private hireQualityState = signal<HireQualityMetric[]>([]);

  readonly funnel = this.funnelState.asReadonly();
  readonly dropOffReasons = this.dropOffReasonsState.asReadonly();
  readonly hireQuality = this.hireQualityState.asReadonly();
  readonly isLoading = signal<boolean>(true);

  readonly overallConversionRate = computed(() => {
    const list = this.funnelState();
    if (!list.length) return 0;
    const initial = list[0].count;
    const final = list[list.length - 1].count;
    if (initial === 0) return 0;
    return Math.round((final / initial) * 1000) / 10;
  });

  readonly totalJoined = computed(() => 
    this.hireQualityState().reduce((acc, h) => acc + h.totalJoined, 0)
  );

  readonly avgRetention7Days = computed(() => {
    const list = this.hireQualityState();
    if (!list.length) return 0;
    const sum = list.reduce((acc, h) => acc + h.retention7DaysPct, 0);
    return Math.round((sum / list.length) * 10) / 10;
  });

  readonly avgRetention30Days = computed(() => {
    const list = this.hireQualityState();
    if (!list.length) return 0;
    const sum = list.reduce((acc, h) => acc + h.retention30DaysPct, 0);
    return Math.round((sum / list.length) * 10) / 10;
  });

  readonly avgFailure30Days = computed(() => {
    const list = this.hireQualityState();
    if (!list.length) return 0;
    const sum = list.reduce((acc, h) => acc + h.failure30DaysPct, 0);
    return Math.round((sum / list.length) * 10) / 10;
  });

  readonly avgReplacementRate = computed(() => {
    const list = this.hireQualityState();
    if (!list.length) return 0;
    const sum = list.reduce((acc, h) => acc + h.replacementRatePct, 0);
    return Math.round((sum / list.length) * 10) / 10;
  });

  readonly successfulHireIndex = computed(() => {
    const list = this.hireQualityState();
    if (!list.length) return 0;
    const sum = list.reduce((acc, h) => acc + h.successfulHireIndexPct, 0);
    return Math.round((sum / list.length) * 10) / 10;
  });

  constructor() {
    this.loadAnalytics().subscribe();
    this.getHireQualityMetrics();
  }

  loadAnalytics(): Observable<any> {
    this.isLoading.set(true);
    return this.http.get<{ success: boolean; data: any }>(`${this.apiUrl}/funnel-metrics`).pipe(
      tap(res => {
        if (res.success && res.data && res.data.stages) {
          const mapped: FunnelMetric[] = res.data.stages.map((st: any) => ({
            stage: st.stage as PipelineStage,
            count: st.count || 0,
            conversionRate: Math.round(st.conversion_from_prev || 100),
            dropOffRate: Math.max(0, 100 - Math.round(st.conversion_from_prev || 100)),
            avgDaysInStage: 3
          }));
          this.funnelState.set(mapped);
        }
        this.isLoading.set(false);
      }),
      catchError(err => {
        console.warn('Funnel metrics API failed, using fallback:', err);
        this.isLoading.set(false);
        return of(null);
      })
    );
  }

  getFunnelMetrics(): Observable<FunnelMetric[]> {
    this.loadAnalytics().subscribe();
    return of(this.funnelState());
  }

  getHireQualityMetrics(): Observable<HireQualityMetric[]> {
    this.http.get<{ success: boolean; data: any }>(`${this.apiUrl}/retention/metrics`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const d = res.data;
          const mapped: HireQualityMetric[] = [
            {
              department: 'All Departments',
              totalJoined: d.total_joined || 0,
              retention7DaysPct: Math.round(d.retention_7d?.rate_percentage || 100),
              retention30DaysPct: Math.round(d.retention_30d?.rate_percentage || 100),
              failure30DaysPct: d.total_joined ? Math.round((d.failures_30d_count / d.total_joined) * 100) : 0,
              replacementRatePct: d.total_joined ? Math.round((d.replacement_tickets_active / d.total_joined) * 100) : 0,
              successfulHireIndexPct: Math.round(d.retention_30d?.rate_percentage || 100),
              avgOnboardingFeedback: 4.8
            }
          ];
          this.hireQualityState.set(mapped);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.warn('Retention metrics API failed, using fallback:', err);
        this.isLoading.set(false);
      }
    });

    return of(this.hireQualityState());
  }
}
