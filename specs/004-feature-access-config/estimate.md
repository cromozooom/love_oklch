# ⏱️ Implementation Time Estimate for Admin-Configurable Feature Access Control

This estimate is based on a detailed analysis of all 79 tasks, their complexity, dependencies, and the E2E-first TDD approach. See `tasks.md` for the full breakdown.

---

## 🎯 MVP Scope (Phases 1-3: Tasks T001-T029b)

| Phase      | Tasks      | Time Estimate | Details                                                  |
| ---------- | ---------- | ------------- | -------------------------------------------------------- |
| Setup      | T001-T004  | 30 min        | npm installs (5 min), create directories/files (25 min)  |
| Foundation | T005-T012  | 6-8 hours     | YAML loader (2h), validation (1.5h), sync service (2h),  |
|            |            |               | middleware (1.5h), cache/audit (1-2h)                    |
| US4 (MVP)  | T013-T029b | 16-22 hours   | E2E tests (8h for 8 tests), Services (4-6h), Controllers |
|            |            |               | (3-4h), Integration (2-3h), Test runs/fixes (1-2h)       |

### Phase 3 (US4) Breakdown

- T013-T020: 8 E2E tests × 1h each = **8 hours**
- T021: EntitlementCheckService = **2-3 hours**
- T022-T022b: Entitlement endpoints + formatter = **1.5 hours**
- T023: GET limit endpoint = **30 min**
- T024: Entitlement middleware = **1 hour**
- T025-T027: Integration into existing controllers = **2-3 hours**
- T028: Routes = **30 min**
- T029: Test validation & fixes = **1-2 hours**

---

## 📦 Post-MVP Increments

| Phase    | Tasks     | Time Estimate | Details                                                    |
| -------- | --------- | ------------- | ---------------------------------------------------------- |
| US1      | T030-T037 | 3-4 hours     | YAML reload (2 E2E tests 2h, reload logic 1-2h)            |
| US2      | T038-T043 | 2-3 hours     | View config API (2 E2E tests 2h, GET endpoint 1h)          |
| US3      | T044-T058 | 6-8 hours     | Validation (5 E2E tests 5h, PUT endpoint 2-3h, locking 1h) |
| Admin UI | T059-T067 | 8-12 hours    | Angular components (6 files 6h), service 1h, routing 1h,   |
|          |           |               | E2E test 2-4h                                              |
| Polish   | T068-T077 | 4-6 hours     | Logging 1h, performance tests 2h, docs 1-2h, security 1h   |

---

## 📊 Total Time Estimates

```
┌─────────────────────────────────────────────────────────┐
│ DELIVERY SCENARIOS                                     │
├─────────────────────────────────────────────────────────┤
│ ✅ MVP Only (US4)              │ 3-4 days (24-32 hours) │
│ 🎯 MVP + US1 (YAML reload)     │ 4-5 days (27-36 hours) │
│ 📈 MVP + US1-3 (All APIs)      │ 5-7 days (35-47 hours) │
│ 🖥️ Full (with Admin UI)         │ 7-10 days (51-71 hours)│
│ 💎 Complete (+ Polish)          │ 8-12 days (59-83 hours)│
└─────────────────────────────────────────────────────────┘
```

---

## 🏃 Team Scenarios

**Solo Developer (40h/week):**

- MVP: 3-4 working days
- Full backend (US1-4): 1-1.5 weeks
- With UI: 2-2.5 weeks
- Complete with polish: 2.5-3 weeks

**Two Developers (parallel work):**

- MVP: 2-3 days (one writes tests, one implements services)
- Full backend: 4-5 days (divide user stories)
- With UI: 5-7 days (backend dev finishes, frontend dev starts UI)
- Complete: 7-10 days

**Three Developers (max parallelization):**

- MVP: 2 days (tester + 2 backend devs)
- Full backend: 3-4 days (each takes a user story)
- With UI: 4-5 days (frontend dev works parallel to backend)
- Complete: 5-7 days

---

## ⚠️ Time Variables & Risks

**Faster if:**

- Existing controllers have clear extension points (-3 to -5h)
- Team familiar with Prisma/joi/Playwright (-2 to -4h)
- E2E test infrastructure already robust (-2 to -3h)
- Skip admin UI entirely (-8 to -12h)

**Slower if:**

- Existing schema incompatible with YAML structure (+4 to +8h)
- Need to refactor existing project/modification controllers (+3 to +6h)
- E2E tests require infrastructure improvements (+3 to +5h)
- Grandfathering logic complex (+2 to +4h)
- Performance tuning needed for <100ms checks (+2 to +4h)

---

## 🎯 Recommended Approach

**Week 1 (MVP Focus):**

- Days 1-2: Phase 1-2 (Setup + Foundation)
- Days 3-5: Phase 3 (US4 - Runtime enforcement)
- **Deliverable:** Working feature limits with E2E tests

**Week 2 (Admin APIs):**

- Days 1-2: Phase 4 (US1 - YAML reload)
- Day 3: Phase 5 (US2 - View config)
- Days 4-5: Phase 6 (US3 - Validation)
- **Deliverable:** Full backend API for admin config

**Week 3 (Optional):**

- Days 1-3: Phase 7 (Admin UI)
- Days 4-5: Phase 8 (Polish)
- **Deliverable:** Production-ready with web UI

---

## 💡 Quick Win Strategy

**Day 1 Mini-MVP (8 hours):**

- T001-T012: Setup + Foundation (6-8h)
- T013-T015: 3 project limit E2E tests (3h)
- T021-T025: Core entitlement service + middleware (4-5h)
- **Result:** Project limits working for 3 tiers

This proves the concept and unblocks further work.

---

Would you like a detailed sprint plan or Gantt chart for any scenario above?
