import { Routes } from '@angular/router';
import { AppShellComponent } from './layout/shell/app-shell.component';
import { authGuard, roleGuard } from './core/auth/auth.guards';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/auth-page.component').then(m => m.AuthPageComponent),
    data: { mode: 'login' }
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    canActivateChild: [roleGuard],
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
        path: 'dashboard/employees',
        data: { roles: ['superadmin'] },
        loadComponent: () =>
          import('./features/dashboard/employees/employees.component').then(
            m => m.EmployeesComponent
          )
      },
      {
        path: 'dashboard/control-tower',
        loadComponent: () =>
          import('./features/dashboard/control-tower/control-tower.component').then(
            m => m.DashboardControlTowerComponent
          )
      },
      {
        path: 'dashboard/candidate-pipeline',
        loadComponent: () =>
          import('./features/dashboard/candidate-pipeline-stages/candidate-pipeline-stages.component').then(
            m => m.CandidatePipelineStagesComponent
          )
      },
      {
        path: 'dashboard/recruiter-insights',
        loadComponent: () =>
          import('./features/dashboard/recruiter-insights/recruiter-insights.component').then(
            m => m.RecruiterInsightsComponent
          )
      },
      {
        path: 'dashboard/application-insights',
        data: { roles: ['superadmin', 'recruiter'] },
        loadComponent: () =>
          import('./features/dashboard/application-insights/application-insights.component').then(
            m => m.ApplicationInsightsComponent
          )
      },
      {
        path: 'dashboard/recruiter-posting-delay-report',
        loadComponent: () =>
          import('./features/dashboard/recruiter-posting-delay-report/recruiter-posting-delay-report.component').then(
            m => m.RecruiterPostingDelayReportComponent
          )
      },
      // Recruitment Routes
      {
        path: 'recruitment/requisitions',
        loadComponent: () =>
          import('./features/recruitment/requisitions/requisitions.component').then(
            m => m.RecruitmentRequisitionsComponent
          )
      },
      {
        path: 'recruitment/positions',
        redirectTo: 'recruitment/requisitions',
        pathMatch: 'full'
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
      // {
      //   path: 'recruitment/requirements',
      //   loadComponent: () =>
      //     import('./features/recruitment/requirements/requirements.component').then(
      //       m => m.RecruitmentRequirementsComponent
      //     )
      // },
      // {
      //   path: 'recruitment/talent-bank',
      //   loadComponent: () =>
      //     import('./features/recruitment/talent-bank/talent-bank.component').then(
      //       m => m.RecruitmentTalentBankComponent
      //     )
      // },
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
    redirectTo: 'login'
  }
];
