import { Injectable, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { FunnelMetric, HireQualityMetric } from '../models/recruitment.model';
import analyticsMock from '../../../assets/mock/analytics.json';
import hireQualityMock from '../../../assets/mock/hire-quality.json';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private funnelState = signal<FunnelMetric[]>(analyticsMock.funnel as FunnelMetric[]);
  private dropOffReasonsState = signal(analyticsMock.topDropOffReasons);
  private hireQualityState = signal<HireQualityMetric[]>(hireQualityMock as HireQualityMetric[]);

  readonly funnel = this.funnelState.asReadonly();
  readonly dropOffReasons = this.dropOffReasonsState.asReadonly();
  readonly hireQuality = this.hireQualityState.asReadonly();

  readonly overallConversionRate = computed(() => {
    const list = this.funnelState();
    if (!list.length) return 0;
    const initial = list[0].count;
    const final = list[list.length - 1].count;
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

  getFunnelMetrics(): Observable<FunnelMetric[]> {
    return of(this.funnelState());
  }

  getHireQualityMetrics(): Observable<HireQualityMetric[]> {
    return of(this.hireQualityState());
  }
}
