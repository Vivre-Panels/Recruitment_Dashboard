# TalentOps Control Tower & Recruitment Management System

An enterprise-grade, interactive Angular frontend application built for **Recruitment Management, SLA Tracking, Candidate Pipeline Management, Recruiter Performance, and Executive Control Tower Operations**.

![Brand Color](https://img.shields.io/badge/Brand%20Color-%235D9240-5D9240?style=for-the-badge)
![Angular](https://img.shields.io/badge/Angular-v22-dd0031?style=for-the-badge&logo=angular)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3.4-38bdf8?style=for-the-badge&logo=tailwindcss)
![TypeScript](https://img.shields.io/badge/TypeScript-v6.0-3178c6?style=for-the-badge&logo=typescript)

---

## 📌 Executive Summary

**TalentOps Control Tower** is a comprehensive SaaS recruitment management platform. It standardizes the end-to-end talent acquisition process:

$$\text{Vacancy Requirement} \longrightarrow \text{Position Sourcing} \longrightarrow \text{Candidate Pipeline} \longrightarrow \text{SLA Monitoring} \longrightarrow \text{Quality of Hire} \longrightarrow \text{Weekly Executive Review}$$

Designed with **Progressive Disclosure UI/UX Principles**, the application displays clear overview metrics on the primary view while keeping detailed attributes, timelines, logs, and evaluation metrics accessible via slide-over drawers, action modals, and contextual tabs.

---

## 🏗 System Architecture & Technology Stack

| Layer | Technology | Key Details |
| :--- | :--- | :--- |
| **Framework** | Angular v22 (Standalone Components) | Strict type safety, signals & RxJS state streams |
| **Styling** | TailwindCSS v3.4 + PostCSS | Custom `#5D9240` brand palette, responsive grid |
| **Typography** | Google Poppins Font | Clean enterprise readability across all devices |
| **Icons** | Custom Angular Feather/Lucide Icon Set | SVG-based icon component |
| **Data Layer** | Reactive RxJS Mock Services | Pre-seeded enterprise dataset with full CRUD simulation |
| **Routing** | Angular Lazy-Loaded Router | 20+ feature paths nested under `AppShellComponent` |

---

## 🧭 Application Modules & Route Architecture

```
/
├── dashboard/
│   ├── overview             # Executive KPIs, At-Risk Positions, Sourcing Velocity
│   └── control-tower        # Real-time operational bottleneck tracking & escalation grid
├── recruitment/
│   ├── positions            # Position Management table with Drawer details & "+ New Position" modal
│   ├── positions/:id        # Deep position breakdown with Overview / Candidates / SLA tabs
│   ├── pipeline             # Kanban Drag-and-Drop Pipeline (Sourced -> Offered -> Joined)
│   ├── candidates           # Global Candidate Database with multi-filter drawer
│   ├── candidates/:id       # Candidate 360 view (Profile / Interview Logs / Evaluation / Offer)
│   ├── requirements         # Requisition cards & approval lifecycle
│   └── talent-bank          # Resume pool & passive candidate search
├── analytics/
│   ├── funnel               # Stage conversion percentages & drop-off metrics
│   ├── recruiter-metrics    # Recruiter performance grid & workload allocation
│   ├── hire-quality         # 90-day retention & performance rating correlations
│   └── sla                  # SLA breach monitoring & turnaround time analysis
├── performance/
│   ├── scorecard            # Recruiter target vs actual scorecards
│   ├── behaviour-evaluation # Behavioral assessments & stakeholder satisfaction ratings
│   └── performance-eval     # Quantitative recruitment output evaluations
├── weekly-review/
│   ├── overview             # Weekly executive review dashboard
│   ├── exceptions           # Escalated bottlenecks & critical delay tracker
│   └── actions              # Decision & Action items tracker with "+ New Action" modal
└── settings/
    ├── general              # System preferences & currency/timezone rules
    ├── recruitment-config   # Priority thresholds (P0/P1/P2) & custom stages
    └── sla-config           # Editable SLA rules table per stage & department
```

---

## 📊 Core Features & Workflow Coverage

### 1. Recruitment Control Tower (`/dashboard/control-tower`)
* Real-time monitoring of open requisitions.
* Visual SLA breach warnings (**🔴 Critical**, **🟡 At Risk**, **🟢 On Track**).
* Quick action slide-over drawer for instantaneous position reassignment or stage escalation.

### 2. Candidate Pipeline (`/recruitment/pipeline`)
* Dynamic visual Kanban board displaying candidate movement through stages:
  `Sourced` → `Screening` → `Technical Interview` → `Managerial Interview` → `Offer Extended` → `Joined`.
* Clean, uncluttered candidate cards showing candidate name, role, photo, and quality score.

### 3. Position & Requisition Lifecycle (`/recruitment/positions`)
* Manage headcounts, priority levels (P0, P1, P2), hiring managers, and assigned recruiters.
* Create new positions with validation modal.
* Interactive slide-over drawer detailing open bottlenecks and target closure dates.

### 4. Recruiter Performance & Behavioral Evaluation (`/performance/*`)
* Recruiter velocity metrics: Time-to-Fill, Offer Acceptance Rate, Sourcing Yield.
* Multi-dimensional evaluations separating **Performance Evaluation** (hard numbers) from **Behavioral Evaluation** (communication, teamwork, stakeholder rating).

### 5. SLA Monitoring & Escalation Management (`/analytics/sla`)
* Department-level SLA tracking against configured turnaround thresholds.
* Warning indicators when candidates spend >48 hours in single interview stage.

### 6. Weekly Executive Review (`/weekly-review/*`)
* Executive summary of weekly milestones.
* Critical exception log highlighting stalled offers or missing interviewer feedback.
* Action item decision tracking with target completion dates and assigned owners.

---

## 🛠 Setup & Running Locally

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher
* **Angular CLI**: v22+

### Installation & Execution
```bash
# 1. Clone repository
git clone <repository-url>
cd Recruitement

# 2. Install dependencies
npm install

# 3. Start development server
npm run start
```
The application will launch automatically at **`http://localhost:4200`**.

---

## 🎨 UI/UX Design System Guidelines

1. **Color Palette**:
   * Brand Green: `#5D9240` (`bg-brand-500`, `text-brand-500`)
   * Neutral Slate: `#f8fafc` background, `#1e293b` body text, `#e2e8f0` borders
   * Status Colors: Semantic Red (`#ef4444`), Yellow (`#f59e0b`), Green (`#10b981`)
2. **Progressive Disclosure**:
   * Overview screens display top 4 KPIs and key highlights.
   * Full details, history logs, and raw metrics reside inside slide-over drawers or dedicated sub-tabs.
3. **Modals & Drawers**:
   * Keyboard accessible (`ESC` key to close).
   * Modals for short transactional inputs (+ New Position, + New Action Item).
   * Drawers for deep contextual views (Position Breakdown, Candidate 360 View).
