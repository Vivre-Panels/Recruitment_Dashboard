# Manual Testing Guide & Workflow Flowchart

This guide provides an end-to-end manual testing walkthrough for the **TalentOps Control Tower & Recruitment Management System**.

---

## 🗺 End-to-End User Testing Flowchart

```
                          ┌──────────────────────────┐
                          │  1. Launch Application   │
                          │   http://localhost:4200  │
                          └─────────────┬────────────┘
                                        │
                                        ▼
                          ┌──────────────────────────┐
                          │  2. Dashboard Overview   │
                          │  Check 4 Key Requisition │
                          │     KPIs & Requisitions  │
                          └─────────────┬────────────┘
                                        │
             ┌──────────────────────────┼──────────────────────────┐
             ▼                          ▼                          ▼
 ┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐
 │  3. Control Tower    │   │ 4. Requisitions &    │   │ 5. Candidate         │
 │  Inspect SLA Status &│   │    Positions         │   │    Pipeline          │
 │  Escalations Grid    │   │  Filter, Add & View  │   │ Drag & Move Cards    │
 └───────────┬──────────┘   └───────────┬──────────┘   └───────────┬──────────┘
             │                          │                          │
             └──────────────────────────┼──────────────────────────┘
                                        │
                                        ▼
                          ┌──────────────────────────┐
                          │ 6. Candidate Database &  │
                          │     Candidate 360 View   │
                          │  View Profile & Stage    │
                          └─────────────┬────────────┘
                                        │
             ┌──────────────────────────┼──────────────────────────┐
             ▼                          ▼                          ▼
 ┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐
 │ 7. Recruitment       │   │ 8. Performance       │   │ 9. Weekly Executive  │
 │    Analytics         │   │    Scorecards        │   │    Review            │
 │ Funnel & SLA Breach  │   │ Behaviour & Output   │   │ Exceptions & Actions │
 └───────────┬──────────┘   └───────────┬──────────┘   └───────────┬──────────┘
             │                          │                          │
             └──────────────────────────┼──────────────────────────┘
                                        │
                                        ▼
                          ┌──────────────────────────┐
                          │ 10. System Settings      │
                          │ SLA & Priority Thresholds│
                          └──────────────────────────┘
```

---

## 🧪 Step-by-Step Manual Test Execution Script

### Test Case 1: Dashboard Overview (`/dashboard/overview`)
1. **Action**: Open browser at `http://localhost:4200`.
2. **Verify**:
   * Page loads with header "Recruitment Overview" and brand logo.
   * Top 4 KPI cards render clean numbers (Required HC, Joined, Successful Hires, At Risk).
   * Requisitions list displays active positions with status indicators (**🔴 Critical**, **🟡 At Risk**, **🟢 On Track**).
3. **Pass Criteria**: All cards and metrics display with clean typography and brand green accents.

---

### Test Case 2: Control Tower Operations (`/dashboard/control-tower`)
1. **Action**: Click **Control Tower** in the left sidebar navigation.
2. **Verify**:
   * Operational Grid renders with positions, assigned recruiters, progress metrics, and SLA status badges.
3. **Action**: Click the **"View"** button on any critical position row.
4. **Verify**:
   * Right slide-over drawer opens showing detailed position breakdown, open bottlenecks, and target closure dates.
5. **Action**: Press `ESC` or click the `X` button on the drawer.
6. **Pass Criteria**: Drawer closes smoothly and focus returns to the main grid.

---

### Test Case 3: Requisition & Position Management (`/recruitment/positions`)
1. **Action**: Navigate to **Recruitment -> Positions**.
2. **Action**: Click the **"+ New Position"** button in the header.
3. **Verify**:
   * Modal dialog appears with inputs for Title, Department, Headcount, Priority (P0/P1/P2), and Target Date.
4. **Action**: Fill in test position details and click **"Save Position"**.
5. **Pass Criteria**: The new position is appended to the position list and a success toast/notification appears.

---

### Test Case 4: Candidate Pipeline Kanban (`/recruitment/pipeline`)
1. **Action**: Navigate to **Recruitment -> Candidate Pipeline**.
2. **Verify**:
   * 6 Kanban stage columns appear (`Sourced`, `Screening`, `Tech Interview`, `Managerial Interview`, `Offer`, `Joined`).
   * Candidate cards display name, role, recruiter avatar, and candidate quality percentage.
3. **Action**: Click on any candidate card.
4. **Verify**:
   * Candidate details drawer opens showing profile resume overview, interviewer feedback, and current stage.
5. **Pass Criteria**: Interactive view displays cleanly without horizontal overflow.

---

### Test Case 5: Global Candidates & 360 View (`/recruitment/candidates`)
1. **Action**: Navigate to **Recruitment -> Candidates**.
2. **Action**: Click **"Filters"** to toggle search/filter controls.
3. **Action**: Search for a candidate name (e.g. "Rahul") or filter by stage.
4. **Action**: Click on a candidate row to navigate to `/recruitment/candidates/:id`.
5. **Verify**:
   * Candidate 360 view loads with tabbed interface (`Profile`, `Journey`, `Interviews`, `Notes`).
   * Clicking each tab updates the visible section cleanly without reloading the page.
6. **Pass Criteria**: All tabs display corresponding candidate evaluation data.

---

### Test Case 6: Analytics & SLA Monitoring (`/analytics/*`)
1. **Action**: Navigate through the sub-routes under **Analytics**:
   * `/analytics/funnel`: View conversion yields and drop-off percentages.
   * `/analytics/recruiter-metrics`: Inspect recruiter workload & efficiency breakdown.
   * `/analytics/hire-quality`: Check 90-day retention and performance ratings.
   * `/analytics/sla`: Check SLA breach logs (>48h warnings).
2. **Pass Criteria**: Charts, KPI cards, and data tables render cleanly across all four sub-views.

---

### Test Case 7: Recruiter Performance & Behavioral Evaluation (`/performance/*`)
1. **Action**: Navigate to **Performance -> Recruiter Scorecard**.
2. **Verify**: Recruiter target vs actual scorecards display with score percentages.
3. **Action**: Navigate to **Performance -> Behaviour Evaluation**.
4. **Verify**: Distinct behavioral assessment metrics (communication, teamwork, stakeholder rating) display clearly separated from numerical outputs.
5. **Pass Criteria**: Performance and Behaviour metrics remain separate dedicated views.

---

### Test Case 8: Weekly Executive Review (`/weekly-review/*`)
1. **Action**: Navigate to **Weekly Review -> Overview**.
2. **Verify**: Executive summary with planned vs actual target fulfillment.
3. **Action**: Navigate to **Weekly Review -> Exceptions**.
4. **Verify**: Escalated bottlenecks and stalled offers list display.
5. **Action**: Navigate to **Weekly Review -> Decisions & Actions**.
6. **Action**: Click **"+ New Action Item"** modal, type action title, assigned owner, due date, and submit.
7. **Pass Criteria**: New action item is added to the decision tracking table.

---

### Test Case 9: System Configuration (`/settings/*`)
1. **Action**: Navigate to **Settings -> SLA Config**.
2. **Verify**: Table of SLA stage targets (Screening target hours, Interview warning hours, Escalation rules).
3. **Action**: Modify target hours for a stage and click **"Save SLA Settings"**.
4. **Pass Criteria**: Changes save cleanly with feedback notification.
