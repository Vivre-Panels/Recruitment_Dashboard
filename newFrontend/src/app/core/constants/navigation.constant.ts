export interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: string;
  badgeType?: 'danger' | 'warning' | 'success' | 'info';
}

export const NAV_MODULES: NavItem[] = [
  {
    label: 'Dashboard',
    icon: 'dashboard',
    route: '/dashboard/overview'
  },
  {
    label: 'Recruitment',
    icon: 'briefcase',
    route: '/recruitment/positions'
  },
  {
    label: 'Analytics',
    icon: 'trending-up',
    route: '/analytics/funnel'
  },
  {
    label: 'Performance',
    icon: 'award',
    route: '/performance/recruiter-scorecard'
  },
  {
    label: 'Weekly Review',
    icon: 'calendar',
    route: '/weekly-review/overview'
  }
];

export const PIPELINE_STAGES: Array<{ name: string; key: string; color: string; description: string }> = [
  { name: 'Sourced', key: 'Sourced', color: 'bg-slate-100 text-slate-700 border-slate-300', description: 'CVs identified and added to pipeline' },
  { name: 'Screening', key: 'Screening', color: 'bg-blue-50 text-blue-700 border-blue-200', description: 'Recruiter preliminary screening' },
  { name: 'Interview', key: 'Interview', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', description: 'Technical & hiring manager interviews' },
  { name: 'Selected', key: 'Selected', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', description: 'Selected by panel for offer rollout' },
  { name: 'Offered', key: 'Offered', color: 'bg-amber-50 text-amber-700 border-amber-200', description: 'Formal offer letter generated' },
  { name: 'Accepted', key: 'Accepted', color: 'bg-teal-50 text-teal-700 border-teal-200', description: 'Offer accepted by candidate' },
  { name: 'Joined', key: 'Joined', color: 'bg-green-50 text-green-700 border-green-200', description: 'Candidate reported for Day 1 onboarding' },
  { name: 'Successful', key: 'Successful', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', description: 'Completed 30-day retention successfully' }
];

export const DEPARTMENTS = [
  'Engineering',
  'Product Management',
  'Data & AI',
  'Sales & BD',
  'Operations',
  'Marketing',
  'Design & UX',
  'Finance & Legal'
];

export const RECRUITERS_LIST = [
  { id: 'REC-1', name: 'Banashree Roy', email: 'banashree.roy@vivrepanels.com', avatar: 'BR' },
  { id: 'REC-2', name: 'Meghna Deb Sarkar', email: 'meghna.debsarkar@vivrepanels.com', avatar: 'MD' },
  { id: 'REC-3', name: 'Poushali Das', email: 'poushali.das@vivrepanels.com', avatar: 'PD' },
  { id: 'REC-4', name: 'Priya Saha', email: 'priya.saha@vivrepanels.com', avatar: 'PS' }
];

export const HIRING_MANAGERS = [
  'Vikram Malhotra (VP Eng)',
  'Ananya Roy (Head of Product)',
  'Devendra Singh (Director Data)',
  'Kavita Deshmukh (VP Sales)',
  'Rohit Joshi (Operations Lead)'
];
