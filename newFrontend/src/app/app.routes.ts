import { Routes } from '@angular/router';
import { AppShellComponent } from './layout/shell/app-shell.component';

export const routes: Routes = [
  {
    path: '',
    component: AppShellComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard/overview'
      },
      // Dashboard Routes
      {
        path: 'dashboard/overview',
        loadComponent: () =>
          import('./features/dashboard/overview/overview.component').then(
            m => m.DashboardOverviewComponent
          )
      },
      {
        path: 'dashboard/control-tower',
        loadComponent: () =>
          import('./features/dashboard/control-tower/control-tower.component').then(
            m => m.DashboardControlTowerComponent
          )
      },
      // Recruitment Routes
      {
        path: 'recruitment/positions',
        loadComponent: () =>
          import('./features/recruitment/positions/positions.component').then(
            m => m.RecruitmentPositionsComponent
          )
      },
      {
        path: 'recruitment/positions/:id',
        loadComponent: () =>
          import('./features/recruitment/position-detail/position-detail.component').then(
            m => m.RecruitmentPositionDetailComponent
          )
      },
      {
        path: 'recruitment/candidates',
        loadComponent: () =>
          import('./features/recruitment/candidates/candidates.component').then(
            m => m.RecruitmentCandidatesComponent
          )
      },
      {
        path: 'recruitment/candidates/:id',
        loadComponent: () =>
          import('./features/recruitment/candidate-detail/candidate-detail.component').then(
            m => m.RecruitmentCandidateDetailComponent
          )
      },
      {
        path: 'recruitment/pipeline',
        loadComponent: () =>
          import('./features/recruitment/pipeline/pipeline.component').then(
            m => m.RecruitmentPipelineComponent
          )
      },
      {
        path: 'recruitment/requirements',
        loadComponent: () =>
          import('./features/recruitment/requirements/requirements.component').then(
            m => m.RecruitmentRequirementsComponent
          )
      },
      {
        path: 'recruitment/talent-bank',
        loadComponent: () =>
          import('./features/recruitment/talent-bank/talent-bank.component').then(
            m => m.RecruitmentTalentBankComponent
          )
      },
      // Analytics Routes
      {
        path: 'analytics/funnel',
        loadComponent: () =>
          import('./features/analytics/funnel/funnel-analytics.component').then(
            m => m.AnalyticsFunnelComponent
          )
      },
      {
        path: 'analytics/recruiter-metrics',
        loadComponent: () =>
          import('./features/analytics/recruiter-metrics/recruiter-metrics.component').then(
            m => m.AnalyticsRecruiterMetricsComponent
          )
      },
      {
        path: 'analytics/hire-quality',
        loadComponent: () =>
          import('./features/analytics/hire-quality/hire-quality.component').then(
            m => m.AnalyticsHireQualityComponent
          )
      },
      {
        path: 'analytics/sla',
        loadComponent: () =>
          import('./features/analytics/sla/sla-monitoring.component').then(
            m => m.AnalyticsSlaComponent
          )
      },
      // Performance Routes
      {
        path: 'performance/recruiter-scorecard',
        loadComponent: () =>
          import('./features/performance/recruiter-scorecard/recruiter-scorecard.component').then(
            m => m.PerformanceRecruiterScorecardComponent
          )
      },
      {
        path: 'performance/performance-evaluation',
        loadComponent: () =>
          import('./features/performance/performance-evaluation/performance-evaluation.component').then(
            m => m.PerformanceEvaluationComponent
          )
      },
      {
        path: 'performance/behaviour-evaluation',
        loadComponent: () =>
          import('./features/performance/behaviour-evaluation/behaviour-evaluation.component').then(
            m => m.PerformanceBehaviourEvaluationComponent
          )
      },
      // Weekly Review Routes
      {
        path: 'weekly-review/overview',
        loadComponent: () =>
          import('./features/weekly-review/overview/weekly-overview.component').then(
            m => m.WeeklyReviewOverviewComponent
          )
      },
      {
        path: 'weekly-review/exceptions',
        loadComponent: () =>
          import('./features/weekly-review/exceptions/exceptions.component').then(
            m => m.WeeklyReviewExceptionsComponent
          )
      },
      {
        path: 'weekly-review/actions',
        loadComponent: () =>
          import('./features/weekly-review/actions/decisions-actions.component').then(
            m => m.WeeklyReviewActionsComponent
          )
      },
      // Settings Routes
      {
        path: 'settings/general',
        loadComponent: () =>
          import('./features/settings/general/general-settings.component').then(
            m => m.SettingsGeneralComponent
          )
      },
      // {
      //   path: 'settings/recruitment',
      //   loadComponent: () =>
      //     import('./features/settings/recruitment-config/recruitment-config.component').then(
      //       m => m.SettingsRecruitmentConfigComponent
      //     )
      // },
      {
        path: 'settings/sla',
        loadComponent: () =>
          import('./features/settings/sla-config/sla-config.component').then(
            m => m.SettingsSlaConfigComponent
          )
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard/overview'
  }
];
