# Tasks: Admin-Configurable Feature Access Control

**Input**: Design documents from `/specs/004-feature-access-config/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: This feature follows E2E-first test-driven development (per user requirement). All E2E tests are written before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/`, `backend/config/`
- **Frontend**: `frontend/src/app/` (optional Phase 3)
- **E2E Tests**: `e2e/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and create configuration file structure

- [ ] T001 Install backend dependencies: `cd backend; npm install js-yaml joi --save`
- [ ] T002 Install backend dev dependencies: `cd backend; npm install @types/js-yaml --save-dev`
- [ ] T003 [P] Create configuration directory structure in backend/config/
- [ ] T004 [P] Create TypeScript type definitions file in backend/src/types/feature-config.types.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Create feature-access.yaml configuration file in backend/config/feature-access.yaml with seed data (3 tiers: free, basic, pro)
- [ ] T006 Create FeatureConfigLoader service in backend/src/services/feature-config-loader.service.ts
- [ ] T007 Create joi validation schemas in backend/src/validators/feature-config.validator.ts
- [ ] T008 Create database sync service in backend/src/services/feature-config-sync.service.ts
- [ ] T009 Add application startup hook to load and sync configuration in backend/src/server.ts
- [ ] T009b Verify existing Feature/Plan/PlanFeature schema supports YAML structure without modifications (write unit test validating required fields exist)
- [ ] T010 Create admin authentication middleware in backend/src/middleware/admin-auth.middleware.ts
- [ ] T011 [P] Create audit log model/service in backend/src/services/config-audit.service.ts
- [ ] T012 [P] Create in-memory cache service in backend/src/services/entitlement-cache.service.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

**Note on Task Numbering**: Tasks T009b and T022b were added during analysis to address coverage gaps. Subsequent task numbers remain unchanged to preserve traceability.

---

## Phase 3: User Story 4 - Apply Feature Limits in Real-Time (Priority: P4) 🎯 MVP

**Goal**: Implement runtime entitlement checking so feature limits are enforced when users attempt actions

**Independent Test**: E2E test verifies free user blocked at 1 project limit, basic user blocked at 10 projects, pro user has unlimited projects

**Why US4 is MVP**: Per user requirement "start everything with a e2e test", we implement the runtime checking first so all E2E tests for limits can be written and verified. This provides the core value - enforcing limits. Admin configuration UI can come later.

### E2E Tests for User Story 4 (TDD - Write First, Ensure Fail)

- [ ] T013 [P] [US4] E2E test for project limit enforcement (free tier) in e2e/tests/feature-limits/project-limit-free.spec.ts
- [ ] T014 [P] [US4] E2E test for project limit enforcement (basic tier) in e2e/tests/feature-limits/project-limit-basic.spec.ts
- [ ] T015 [P] [US4] E2E test for project limit enforcement (pro tier unlimited) in e2e/tests/feature-limits/project-limit-pro.spec.ts
- [ ] T016 [P] [US4] E2E test for undo/redo limit enforcement (free tier) in e2e/tests/feature-limits/undo-limit-free.spec.ts
- [ ] T017 [P] [US4] E2E test for undo/redo limit enforcement (basic tier) in e2e/tests/feature-limits/undo-limit-basic.spec.ts
- [ ] T018 [P] [US4] E2E test for undo/redo limit enforcement (pro tier unlimited) in e2e/tests/feature-limits/undo-limit-pro.spec.ts
- [ ] T019 [P] [US4] E2E test for grandfathering behavior when limits reduced in e2e/tests/feature-limits/grandfathering.spec.ts
- [ ] T020 [P] [US4] E2E test for advertisement visibility (free vs paid) in e2e/tests/feature-limits/advertisements.spec.ts

### Implementation for User Story 4

- [ ] T021 Create EntitlementCheckService in backend/src/services/entitlement-check.service.ts
- [ ] T022 Implement POST /api/entitlements/check endpoint in backend/src/controllers/entitlement.controller.ts
- [ ] T022b Create limit value formatter utility in backend/src/utils/format-limit.util.ts (formats -1 as "Unlimited" for display)
- [ ] T023 Implement GET /api/entitlements/:featureKey/limit endpoint in backend/src/controllers/entitlement.controller.ts
- [ ] T024 Create entitlement checking middleware in backend/src/middleware/check-entitlement.middleware.ts
- [ ] T025 Integrate entitlement middleware into project creation endpoint in backend/src/controllers/project.controller.ts
- [ ] T026 Integrate entitlement middleware into undo/redo operations in backend/src/controllers/modification.controller.ts
- [ ] T027 Add advertisement visibility logic to frontend responses in backend/src/controllers/user.controller.ts
- [ ] T028 Add entitlement routes to Express router in backend/src/routes/entitlement.routes.ts
- [ ] T029 [US4] Run E2E tests to verify all limits enforced correctly (all tests should pass now)

**Checkpoint**: At this point, all feature limits are enforced and independently testable via E2E tests

---

## Phase 4: User Story 1 - Admin Configure Feature Limits via YAML (Priority: P1)

**Goal**: Enable admins to edit feature-access.yaml file directly and reload configuration without code deployment

**Independent Test**: Admin edits YAML file to change free tier undo limit from 5 to 10, triggers reload via API, free users now have 10 undos

### E2E Tests for User Story 1 (TDD - Write First, Ensure Fail)

- [ ] T030 [P] [US1] E2E test for YAML configuration reload in e2e/tests/admin-config/yaml-reload.spec.ts
- [ ] T031 [P] [US1] E2E test for configuration change propagation within 60 seconds in e2e/tests/admin-config/config-propagation.spec.ts

### Implementation for User Story 1

- [ ] T032 Implement POST /api/admin/feature-config/reload endpoint in backend/src/controllers/admin-config.controller.ts
- [ ] T033 Add reload trigger to FeatureConfigLoader service in backend/src/services/feature-config-loader.service.ts
- [ ] T034 Implement cache invalidation on reload in backend/src/services/entitlement-cache.service.ts
- [ ] T035 Add audit log entry for manual YAML reload in backend/src/services/config-audit.service.ts
- [ ] T036 Add admin configuration routes to Express router in backend/src/routes/admin-config.routes.ts
- [ ] T037 [US1] Run E2E tests to verify YAML reload works and propagates within 60 seconds

**Checkpoint**: At this point, admins can edit YAML file and reload configuration independently

---

## Phase 5: User Story 2 - View Current Feature Access Configuration (Priority: P2)

**Goal**: Provide API endpoint for admins to view current configuration in structured JSON format

**Independent Test**: Admin calls GET /api/admin/feature-config and receives JSON with all tiers, features, limits, and display names

### E2E Tests for User Story 2 (TDD - Write First, Ensure Fail)

- [ ] T038 [P] [US2] E2E test for retrieving configuration as admin in e2e/tests/admin-config/get-config-admin.spec.ts
- [ ] T039 [P] [US2] E2E test for non-admin user denied access in e2e/tests/admin-config/get-config-denied.spec.ts

### Implementation for User Story 2

- [ ] T040 Implement GET /api/admin/feature-config endpoint in backend/src/controllers/admin-config.controller.ts
- [ ] T041 Add configuration formatting logic to FeatureConfigLoader service in backend/src/services/feature-config-loader.service.ts
- [ ] T042 Add admin authentication check to admin-config routes in backend/src/middleware/admin-auth.middleware.ts
- [ ] T043 [US2] Run E2E tests to verify configuration retrieval works for admins only

**Checkpoint**: At this point, admins can view current configuration via API independently

---

## Phase 6: User Story 3 - Validate Configuration Changes (Priority: P3)

**Goal**: Implement validation rules to prevent invalid configurations (zero limits, wrong types, missing fields)

**Independent Test**: Admin attempts to set project limit to 0 via PUT API, receives 400 error "Invalid limit: use -1 for unlimited or positive numbers only"

### E2E Tests for User Story 3 (TDD - Write First, Ensure Fail)

- [ ] T044 [P] [US3] E2E test for rejecting zero limit values in e2e/tests/admin-config/validation-zero-rejected.spec.ts
- [ ] T045 [P] [US3] E2E test for rejecting invalid negative values (not -1) in e2e/tests/admin-config/validation-negative.spec.ts
- [ ] T046 [P] [US3] E2E test for rejecting invalid boolean values in e2e/tests/admin-config/validation-boolean.spec.ts
- [ ] T047 [P] [US3] E2E test for rejecting missing required fields in e2e/tests/admin-config/validation-required.spec.ts
- [ ] T048 [P] [US3] E2E test for optimistic locking conflict detection in e2e/tests/admin-config/optimistic-locking.spec.ts

### Implementation for User Story 3

- [ ] T049 Implement PUT /api/admin/feature-config endpoint in backend/src/controllers/admin-config.controller.ts
- [ ] T050 Add validation for zero limits in backend/src/validators/feature-config.validator.ts
- [ ] T051 Add validation for invalid negative values in backend/src/validators/feature-config.validator.ts
- [ ] T052 Add validation for boolean types in backend/src/validators/feature-config.validator.ts
- [ ] T053 Add validation for required fields in backend/src/validators/feature-config.validator.ts
- [ ] T054 Implement optimistic locking with lastUpdated timestamp in backend/src/services/feature-config-sync.service.ts
- [ ] T055 Add conflict detection and 409 response in backend/src/controllers/admin-config.controller.ts
- [ ] T056 Log configuration changes to audit log in backend/src/services/config-audit.service.ts
- [ ] T057 Write configuration changes back to YAML file in backend/src/services/feature-config-loader.service.ts
- [ ] T058 [US3] Run E2E tests to verify validation and optimistic locking work correctly

**Checkpoint**: At this point, configuration validation prevents invalid settings and conflicts

---

## Phase 7: Optional Admin UI (Deferred)

**Goal**: Provide web-based admin interface for configuration management (optional, not MVP)

**Note**: This phase is deferred per plan.md. Admin users can manage configuration via YAML file editing or API calls for MVP.

- [ ] T059 [P] [US1-UI] Create feature-config-list component in frontend/src/app/admin/components/feature-config-list/feature-config-list.component.ts
- [ ] T060 [P] [US1-UI] Create feature-config-list template in frontend/src/app/admin/components/feature-config-list/feature-config-list.component.html
- [ ] T061 [P] [US1-UI] Create feature-config-list styles in frontend/src/app/admin/components/feature-config-list/feature-config-list.component.scss
- [ ] T062 [P] [US1-UI] Create feature-config-editor component in frontend/src/app/admin/components/feature-config-editor/feature-config-editor.component.ts
- [ ] T063 [P] [US1-UI] Create feature-config-editor template in frontend/src/app/admin/components/feature-config-editor/feature-config-editor.component.html
- [ ] T064 [P] [US1-UI] Create feature-config-editor styles in frontend/src/app/admin/components/feature-config-editor/feature-config-editor.component.scss
- [ ] T065 [US1-UI] Create feature-config-admin.service in frontend/src/app/admin/services/feature-config-admin.service.ts
- [ ] T066 [US1-UI] Add admin routing and guards in frontend/src/app/admin/admin-routing.module.ts
- [ ] T067 [US1-UI] E2E test for admin UI configuration updates in e2e/tests/admin-ui/config-editor.spec.ts

**Checkpoint**: Admin UI provides web-based configuration management (optional enhancement)

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T068 [P] Add comprehensive error logging across all services in backend/src/services/
- [ ] T069 [P] Performance testing for <100ms entitlement checks in e2e/tests/performance/entitlement-check-speed.spec.ts
- [ ] T070 [P] Cache hit ratio validation (target >95%) in backend/src/services/entitlement-cache.service.ts
- [ ] T071 Add API documentation comments in backend/src/controllers/
- [ ] T072 Verify quickstart.md examples work correctly
- [ ] T073 Add monitoring/metrics for configuration reloads in backend/src/services/feature-config-loader.service.ts
- [ ] T074 Security audit of admin endpoints in backend/src/middleware/admin-auth.middleware.ts
- [ ] T075 Add database indexes for entitlement queries if needed
- [ ] T076 [P] Document YAML configuration format in backend/config/README.md
- [ ] T077 [P] Create migration guide for existing subscriptions in docs/feature-access-migration.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 4 (Phase 3)**: Depends on Foundational - implements runtime entitlement checking (MVP core)
- **User Story 1 (Phase 4)**: Depends on Foundational - enables YAML reload
- **User Story 2 (Phase 5)**: Depends on Foundational - enables viewing configuration
- **User Story 3 (Phase 6)**: Depends on Foundational and US2 (GET endpoint) - adds validation and PUT endpoint
- **Optional Admin UI (Phase 7)**: Depends on US1, US2, US3 being complete - deferred
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 4 (P4 - MVP)**: Can start after Foundational (Phase 2) - No dependencies on other stories. This is the core runtime enforcement.
- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories. Enables YAML reload.
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories. Enables configuration viewing.
- **User Story 3 (P3)**: Depends on US2 (needs GET endpoint) - Adds validation and update capability.

**Priority Explanation**: Although spec.md lists priorities as P1-P4, implementation order prioritizes US4 (runtime enforcement) as MVP because:

1. User requirement: "start everything with a e2e test"
2. US4 provides core value: enforcing limits
3. US1-US3 are admin configuration features that can come after core enforcement works
4. E2E tests for all scenarios can be written once US4 is implemented

### Within Each User Story

- E2E tests MUST be written FIRST and FAIL before implementation
- Services before controllers
- Controllers before routes
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- Phase 1: All tasks can run in parallel (T001, T002 are npm installs; T003, T004 are file creation)
- Phase 2: Tasks T011 and T012 can run in parallel (different services, no dependencies)
- Within each user story: All E2E test tasks marked [P] can run in parallel (different test files)
- Once Foundational phase completes, US4, US1, US2 can start in parallel (if team capacity allows)
- US3 must wait for US2 GET endpoint to exist
- Optional Admin UI (Phase 7) can be worked on in parallel by frontend developer while backend work continues

---

## Parallel Example: User Story 4 (MVP)

```bash
# Write all E2E tests together FIRST (ensure they FAIL):
Task T013: "E2E test for project limit enforcement (free tier) in e2e/tests/feature-limits/project-limit-free.spec.ts"
Task T014: "E2E test for project limit enforcement (basic tier) in e2e/tests/feature-limits/project-limit-basic.spec.ts"
Task T015: "E2E test for project limit enforcement (pro tier unlimited) in e2e/tests/feature-limits/project-limit-pro.spec.ts"
Task T016: "E2E test for undo/redo limit enforcement (free tier) in e2e/tests/feature-limits/undo-limit-free.spec.ts"
Task T017: "E2E test for undo/redo limit enforcement (basic tier) in e2e/tests/feature-limits/undo-limit-basic.spec.ts"
Task T018: "E2E test for undo/redo limit enforcement (pro tier unlimited) in e2e/tests/feature-limits/undo-limit-pro.spec.ts"
Task T019: "E2E test for grandfathering behavior when limits reduced in e2e/tests/feature-limits/grandfathering.spec.ts"
Task T020: "E2E test for advertisement visibility (free vs paid) in e2e/tests/feature-limits/advertisements.spec.ts"

# Then implement services and endpoints sequentially:
Task T021 → T022 → T023 → T024 → T025 → T026 → T027 → T028

# Finally run all E2E tests to verify (should PASS):
Task T029: "Run E2E tests to verify all limits enforced correctly"
```

---

## Implementation Strategy

### MVP First (User Story 4 Only)

1. Complete Phase 1: Setup (install dependencies, create types)
2. Complete Phase 2: Foundational (YAML loader, sync service, middleware, cache)
3. Complete Phase 3: User Story 4 (runtime entitlement checking with E2E tests)
4. **STOP and VALIDATE**: Test that feature limits work with seeded users (free@solopx.com, basic@solopx.com, pro@solopx.com)
5. Deploy/demo if ready - **core value delivered**: limits are enforced

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 4 → Test with E2E tests → Deploy/Demo (MVP! ✅)
3. Add User Story 1 → Test YAML reload → Deploy/Demo (admins can edit YAML)
4. Add User Story 2 → Test config viewing → Deploy/Demo (admins can view via API)
5. Add User Story 3 → Test validation → Deploy/Demo (safe configuration updates)
6. (Optional) Add Admin UI → Test web interface → Deploy/Demo (web-based admin tool)

### Parallel Team Strategy

With multiple developers:

1. **Phase 1-2**: Team completes Setup + Foundational together (blocking work)
2. **Once Foundational is done**:
   - Developer A: User Story 4 (runtime enforcement - MVP)
   - Developer B: User Story 1 (YAML reload)
   - Developer C: User Story 2 (view configuration)
3. **After US2 complete**:
   - Developer D: User Story 3 (validation - depends on US2 GET endpoint)
4. **Optional**:
   - Frontend Developer: Admin UI (Phase 7) - can start once US1-US3 APIs exist

---

## Test Strategy (E2E-First per User Requirement)

### Seeded Test Users (from docs/SEED_DATA_REFERENCE.md)

- **free@solopx.com** / test1234 - Free tier (5 undos, 1 project, ads visible)
- **basic@solopx.com** / test1234 - Basic tier (50 undos, 10 projects, no ads)
- **pro@solopx.com** / test1234 - Pro tier (unlimited undos/projects, no ads)

### Test-Driven Development Workflow

1. **Write E2E test FIRST** for a scenario (e.g., free user blocked at 1 project)
2. **Run test** - should FAIL (feature not implemented yet)
3. **Implement minimum code** to make test pass (service + controller + endpoint)
4. **Run test again** - should PASS
5. **Refactor** if needed while keeping test green
6. **Commit** working code with passing test

### Example: Project Limit Test Workflow

```typescript
// e2e/tests/feature-limits/project-limit-free.spec.ts
test("free user blocked at 1 project limit", async ({ page }) => {
  await loginAsUser(page, "free@solopx.com", "test1234");

  // Create first project - should succeed
  await createProject(page, "Project 1");
  await expect(page.locator(".project-card")).toHaveCount(1);

  // Attempt second project - should be blocked
  await clickCreateProject(page);
  await expect(page.locator(".error-message")).toContainText("Project limit reached (1/1)");
});
```

**Workflow**:

1. Write this test → Run → FAILS (no entitlement check implemented)
2. Implement EntitlementCheckService + endpoint + middleware
3. Run test → PASSES
4. Commit with message: "feat: enforce project limit for free tier"

---

## Performance Targets

- **Entitlement checks**: <100ms per check (measured in T069)
- **Cache hit ratio**: >95% (validated in T070)
- **Configuration sync**: <1 second on startup/reload
- **Configuration propagation**: <60 seconds to all cached values (TTL)

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability (US1, US2, US3, US4)
- Each user story should be independently completable and testable
- **E2E tests written FIRST** (per user requirement) - verify they FAIL before implementation
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- User Story 4 (runtime enforcement) is the MVP despite being labeled P4 in spec - it provides core value
- Admin configuration features (US1-US3) can be added incrementally after MVP
- Optional Admin UI (Phase 7) is deferred - YAML editing is sufficient for MVP

---

## Task Summary

- **Total Tasks**: 79 (77 original + 2 added during analysis: T009b, T022b)
- **Setup**: 4 tasks
- **Foundational**: 8 tasks (BLOCKS all stories)
- **User Story 4 (MVP)**: 17 tasks (8 E2E tests + 9 implementation)
- **User Story 1**: 8 tasks (2 E2E tests + 6 implementation)
- **User Story 2**: 6 tasks (2 E2E tests + 4 implementation)
- **User Story 3**: 12 tasks (5 E2E tests + 7 implementation)
- **Optional Admin UI**: 9 tasks (deferred)
- **Polish**: 10 tasks

**Parallel Opportunities**: 38 tasks marked [P] can run in parallel within their phases

**Suggested MVP Scope**:

- Phase 1 (Setup) - 4 tasks
- Phase 2 (Foundational) - 8 tasks
- Phase 3 (User Story 4) - 17 tasks
- **Total MVP**: 29 tasks

**Post-MVP Enhancements**:

- Add US1 (YAML reload) - 8 tasks
- Add US2 (View config) - 6 tasks
- Add US3 (Validation) - 12 tasks
- Add Admin UI (Optional) - 9 tasks
- Polish - 10 tasks
