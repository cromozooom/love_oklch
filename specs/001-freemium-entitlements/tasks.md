# Tasks: Database Schema for Freemium Entitlement System

**Input**: Design documents from `/specs/001-freemium-entitlements/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure) ✅ COMPLETE

**Purpose**: Project initialization and Docker containerization per constitutional requirements

- [x] T001 Create Docker environment with PostgreSQL 15 container in backend/docker/docker-compose.yml
- [x] T002 Create database initialization scripts in backend/database/init/
- [x] T003 [P] Setup Prisma configuration in backend/src/database/schema.prisma
- [x] T004 [P] Configure TypeScript build setup in backend/tsconfig.json
- [x] T005 [P] Setup Jest testing framework in backend/jest.config.js

---

## Phase 2: Foundational (Blocking Prerequisites) ✅ COMPLETE

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Create base database schema migration in backend/database/migrations/001_initial_schema.sql
- [x] T007 Setup Prisma models for core entities in backend/src/database/schema.prisma
- [x] T008 [P] Create base repository pattern in backend/src/repositories/base.repository.ts
- [x] T009 [P] Setup Express.js server configuration in backend/src/server.ts
- [x] T010 [P] Configure environment variables in backend/src/config/environment.ts
- [x] T011 [P] Setup error handling middleware in backend/src/middleware/error.middleware.ts
- [x] T012 [P] Create database connection manager in backend/src/database/connection.ts
- [x] T013 [P] Setup logging infrastructure in backend/src/utils/logger.ts
- [x] T014 Setup data seeding scripts for 3 user types in backend/database/seeds/

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Admin Configures Plan Features (Priority: P1) 🎯 MVP

**Goal**: Enable administrators to create, modify, and configure subscription plans with features without code changes

**Independent Test**: Admin can create a plan, assign features with limits, modify configurations, and verify persistence in database

### Implementation for User Story 1

- [x] T015 [P] [US1] Create Plan model in backend/src/models/plan.model.ts
- [x] T016 [P] [US1] Create Feature model in backend/src/models/feature.model.ts
- [x] T017 [P] [US1] Create PlanFeature model in backend/src/models/plan-feature.model.ts
- [x] T018 [P] [US1] Create AdminRole model in backend/src/models/admin-role.model.ts
- [x] T019 [US1] Implement PlanRepository in backend/src/repositories/plan.repository.ts
- [x] T020 [US1] Implement FeatureRepository in backend/src/repositories/feature.repository.ts
- [x] T021 [US1] Implement PlanFeatureRepository in backend/src/repositories/plan-feature.repository.ts
- [x] T022 [US1] Create PlanService with CRUD operations in backend/src/services/plan.service.ts
- [x] T023 [US1] Create FeatureService with catalog management in backend/src/services/feature.service.ts
- [x] T024 [US1] Create PlanFeatureService for entitlement matrix in backend/src/services/plan-feature.service.ts
- [x] T025 [US1] Implement admin role middleware in backend/src/middleware/admin.middleware.ts
- [x] T026 [US1] Create admin plan management endpoints in backend/src/controllers/admin/plan.controller.ts
- [x] T027 [US1] Create admin feature management endpoints in backend/src/controllers/admin/feature.controller.ts
- [x] T028 [US1] Add JSON schema validation for feature configurations in backend/src/validators/feature-config.validator.ts

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

### Frontend for User Story 1

- [x] T029 [P] [US1] Create login page component in frontend/src/app/auth/login/login.component.ts
- [x] T030 [P] [US1] Create authentication service in frontend/src/app/auth/services/auth.service.ts
- [x] T031 [P] [US1] Create admin authentication guard in frontend/src/app/admin/guards/admin.guard.ts
- [x] T032 [P] [US1] Create admin plan management component in frontend/src/app/admin/plan-management/plan-management.component.ts
- [ ] T033 [P] [US1] Create feature configuration component in frontend/src/app/admin/feature-management/feature-management.component.ts
- [ ] T034 [P] [US1] Create plan-feature matrix component in frontend/src/app/admin/entitlement-matrix/entitlement-matrix.component.ts
- [x] T035 [US1] Implement admin service for API communication in frontend/src/app/admin/services/admin.service.ts
- [x] T036 [US1] Create admin routing module in frontend/src/app/admin/admin-routing.module.ts

### E2E Testing for User Story 1

- [ ] T037 [US1] E2E test: Admin login and dashboard access in e2e/tests/admin-authentication.spec.ts
- [ ] T038 [US1] E2E test: Admin creates and configures plans in e2e/tests/admin-plan-management.spec.ts
- [ ] T039 [US1] E2E test: Admin assigns features to plans in e2e/tests/admin-feature-assignment.spec.ts

---

## Phase 4: User Story 2 - Application Checks User Entitlements (Priority: P2)

**Goal**: Enable applications to efficiently query user entitlements based on subscription status and enforce feature access

**Independent Test**: Application can check if a user has access to specific features and receive accurate entitlement information

### Implementation for User Story 2

- [ ] T040 [P] [US2] Create Subscription model in backend/src/models/subscription.model.ts
- [ ] T041 [US2] Implement SubscriptionRepository in backend/src/repositories/subscription.repository.ts
- [ ] T042 [US2] Create EntitlementService for permission checks in backend/src/services/entitlement.service.ts
- [ ] T043 [US2] Implement high-performance entitlement queries in backend/src/repositories/entitlement.repository.ts
- [ ] T044 [US2] Create caching layer for entitlements in backend/src/services/cache.service.ts
- [ ] T045 [US2] Implement entitlement check endpoints in backend/src/controllers/entitlement.controller.ts
- [ ] T046 [US2] Create bulk entitlement check endpoint in backend/src/controllers/entitlement.controller.ts
- [ ] T047 [US2] Add feature usage tracking in backend/src/services/usage-tracking.service.ts
- [ ] T048 [US2] Create entitlement middleware for API protection in backend/src/middleware/entitlement.middleware.ts

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

### Frontend for User Story 2

- [ ] T049 [P] [US2] Create entitlement check service in frontend/src/app/core/services/entitlement.service.ts
- [ ] T050 [P] [US2] Create entitlement directive for feature gating in frontend/src/app/shared/directives/has-entitlement.directive.ts
- [ ] T051 [US2] Create usage tracking component in frontend/src/app/user/usage-tracking/usage-tracking.component.ts

### E2E Testing for User Story 2

- [ ] T052 [US2] E2E test: User entitlement checks and feature access in e2e/tests/user-entitlement-flow.spec.ts
- [ ] T053 [US2] E2E test: Feature limiting and quota enforcement in e2e/tests/feature-quota-enforcement.spec.ts

---

## Phase 5: User Story 3 - Subscription Lifecycle Management (Priority: P3)

**Goal**: Manage subscription creation, updates, lifecycle states, and grace period handling

**Independent Test**: Users can subscribe to plans, system tracks lifecycle changes, and grace periods are enforced correctly

### Implementation for User Story 3

- [ ] T054 [US3] Implement SubscriptionService for lifecycle management in backend/src/services/subscription.service.ts
- [ ] T055 [US3] Create subscription status management in backend/src/services/subscription-status.service.ts
- [ ] T056 [US3] Implement grace period handling logic in backend/src/services/grace-period.service.ts
- [ ] T057 [US3] Create subscription endpoints in backend/src/controllers/subscription.controller.ts
- [ ] T058 [US3] Implement billing webhook handlers in backend/src/controllers/webhook.controller.ts
- [ ] T059 [US3] Create subscription upgrade/downgrade logic in backend/src/services/subscription-change.service.ts
- [ ] T060 [US3] Add automated grace period cleanup job in backend/src/jobs/grace-period-cleanup.job.ts
- [ ] T061 [US3] Create subscription analytics endpoints in backend/src/controllers/analytics.controller.ts

**Checkpoint**: All user stories should now be independently functional

### Frontend for User Story 3

- [ ] T062 [P] [US3] Create subscription management component in frontend/src/app/user/subscription/subscription-management.component.ts
- [ ] T063 [P] [US3] Create billing status component in frontend/src/app/user/billing/billing-status.component.ts
- [ ] T064 [US3] Create subscription upgrade/downgrade flow in frontend/src/app/user/subscription/subscription-flow.component.ts

### E2E Testing for User Story 3

- [ ] T065 [US3] E2E test: User subscription lifecycle management in e2e/tests/subscription-lifecycle.spec.ts
- [ ] T066 [US3] E2E test: Grace period handling and notifications in e2e/tests/grace-period-flow.spec.ts

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and production readiness

- [ ] T067 [P] Create database indexes for performance in backend/database/migrations/002_performance_indexes.sql
- [ ] T068 [P] Add comprehensive API documentation in docs/backend/api/
- [ ] T069 [P] Setup integration tests in backend/tests/integration/
- [ ] T070 [P] Create admin dashboard layout in frontend/src/app/admin/layout/admin-layout.component.ts
- [ ] T071 [P] Add monitoring and metrics in backend/src/services/monitoring.service.ts
- [ ] T072 [P] Security audit and hardening across all endpoints
- [ ] T073 [P] Performance optimization for entitlement queries
- [ ] T074 [P] Create deployment scripts in backend/deploy/
- [ ] T075 [P] Setup Docker production configuration in backend/docker/production/
- [ ] T076 [P] Create e2e test configuration in e2e/playwright.config.ts
- [ ] T077 [P] Add frontend build optimization in frontend/angular.json

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent but may reference US1 models
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Independent but integrates with US1/US2 data

### Within Each User Story

- Models before repositories
- Repositories before services
- Services before controllers
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all models for User Story 1 together:
Task: "Create Plan model in backend/src/models/plan.model.ts"
Task: "Create Feature model in backend/src/models/feature.model.ts"
Task: "Create PlanFeature model in backend/src/models/plan-feature.model.ts"
Task: "Create AdminRole model in backend/src/models/admin-role.model.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (Docker + Infrastructure)
2. Complete Phase 2: Foundational (Database + Core Services)
3. Complete Phase 3: User Story 1 (Admin Configuration)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo admin feature configuration capability

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - **Backend Developer**: User Story APIs (T015-T028, T038-T046, T052-T059)
   - **Frontend Developer**: Admin Dashboard + User Components (T029-T034, T047-T049, T060-T062)
   - **QA Engineer**: E2E Testing (T035-T037, T050-T051, T063-T064)
3. Stories complete and integrate independently with full-stack implementation

### Full-Stack Architecture

- **Backend**: Pure API layer for database operations and business logic
- **Frontend**: Angular admin dashboard + user interfaces following constitutional requirements
- **E2E Tests**: Playwright testing covering admin workflows and user journeys
- **Integration**: Clean separation with RESTful API boundaries

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Docker containerization follows constitutional requirements
- Focus on performance for entitlement checks (<50ms p95)
- All admin functions require role-based access control
- JSON-based feature configuration provides flexibility
- Grace period handling is specific to 7-day requirement
- **Frontend**: Angular components follow constitutional Angular CDK requirements
- **E2E Testing**: Playwright tests satisfy constitutional testing mandates
- **Architecture**: Backend APIs + Frontend UI maintains clean separation of concerns
