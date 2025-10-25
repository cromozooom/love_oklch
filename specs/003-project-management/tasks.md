# Tasks: Project Management with Undo/Redo Functionality

**Input**: Design documents from `/specs/003-project-management/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md structure: `frontend/src/`, `backend/src/`, `e2e/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create project structure per implementation plan in frontend/, backend/, e2e/ directories
- [ ] T002 Initialize Angular project with dependencies in frontend/package.json
- [ ] T003 [P] Initialize backend Node.js/TypeScript project with dependencies in backend/package.json
- [ ] T004 [P] Configure PostgreSQL database schema in backend/src/migrations/001_create_projects_table.sql
- [ ] T005 [P] Create project modifications table migration in backend/src/migrations/002_create_project_modifications_table.sql
- [ ] T006 [P] Setup Playwright E2E testing framework in e2e/playwright.config.ts
- [ ] T007 [P] Configure TypeScript and ESLint for frontend in frontend/tsconfig.json
- [ ] T008 [P] Configure TypeScript and ESLint for backend in backend/tsconfig.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T009 Setup database connection and migration runner in backend/src/database/connection.ts
- [ ] T010 [P] Implement authentication middleware in backend/src/middleware/auth.ts
- [ ] T011 [P] Create base API routing structure in backend/src/routes/index.ts
- [ ] T012 [P] Setup Angular routing configuration in frontend/src/app/app.routes.ts
- [ ] T013 [P] Create base error handling service in frontend/src/app/services/error-handler.service.ts
- [ ] T014 [P] Setup HTTP interceptor for authentication in frontend/src/app/interceptors/auth.interceptor.ts
- [ ] T015 [P] Create User model for subscription support in backend/src/models/user.model.ts
- [ ] T016 [P] Setup Angular Signals store configuration in frontend/src/app/store/app.store.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Create and Configure Projects (Priority: P1) 🎯 MVP

**Goal**: Users can create new projects with name, color gamut, and color space properties

**Independent Test**: Create a project named "Test Project" with "Display P3" gamut and "OKLCH" color space, verify it saves correctly

### Implementation for User Story 1

- [ ] T016 [P] [US1] Create Project model in backend/src/models/project.model.ts
- [ ] T017 [P] [US1] Create Project entity interfaces in frontend/src/app/models/project.interface.ts
- [ ] T018 [P] [US1] Create color enums (ColorGamut, ColorSpace) in frontend/src/app/models/color-enums.ts
- [ ] T019 [US1] Implement ProjectService CRUD operations in backend/src/services/project.service.ts
- [ ] T020 [US1] Create projects API controller in backend/src/controllers/projects.controller.ts
- [ ] T021 [US1] Add projects routes in backend/src/routes/projects.routes.ts
- [ ] T022 [US1] Implement Angular ProjectService in frontend/src/app/services/project.service.ts
- [ ] T023 [US1] Create ProjectFormComponent in frontend/src/app/components/project-form/
- [ ] T024 [US1] Create ProjectListComponent in frontend/src/app/components/project-list/
- [ ] T025 [US1] Add project creation form validation in frontend/src/app/validators/project.validators.ts
- [ ] T026 [US1] Integrate project creation with backend API in ProjectService

**Checkpoint**: User Story 1 complete - users can create and configure projects independently

---

## Phase 4: User Story 5 - Project Dashboard and Navigation (Priority: P1) 🎯 MVP

**Goal**: Users can access a dashboard showing project list and navigate to project editors in SPA

**Independent Test**: Load dashboard, see project list, click project, verify navigation to editor without page reload

### Implementation for User Story 5

- [ ] T027 [P] [US5] Create DashboardComponent in frontend/src/app/components/dashboard/
- [ ] T028 [P] [US5] Setup dashboard routing in frontend/src/app/app.routes.ts
- [ ] T029 [P] [US5] Create project navigation guard in frontend/src/app/guards/project-exists.guard.ts
- [ ] T030 [US5] Implement dashboard project list display in DashboardComponent
- [ ] T031 [US5] Add SPA navigation from dashboard to project editor
- [ ] T032 [US5] Create breadcrumb navigation component in frontend/src/app/components/breadcrumb/
- [ ] T033 [US5] Add project selection state management in ProjectService
- [ ] T034 [US5] Implement dashboard loading states and error handling

**Checkpoint**: User Story 5 complete - dashboard navigation works independently

---

## Phase 5: User Story 2 - Project Modification Tracking (Priority: P2)

**Goal**: Track all project property changes with timestamps and previous values for undo/redo

**Independent Test**: Modify project properties multiple times, verify each change is tracked with metadata

### Implementation for User Story 2

- [ ] T035 [P] [US2] Create ProjectModification interface in frontend/src/app/models/project-modification.interface.ts
- [ ] T036 [P] [US2] Create Command pattern interfaces in frontend/src/app/models/command.interface.ts
- [ ] T037 [P] [US2] Implement UndoRedoService base structure in frontend/src/app/services/undo-redo.service.ts
- [ ] T038 [US2] Create UpdateProjectPropertyCommand in frontend/src/app/commands/update-project-property.command.ts
- [ ] T039 [US2] Add modification tracking to ProjectService
- [ ] T040 [US2] Create project modifications API endpoints in backend/src/controllers/project-modifications.controller.ts
- [ ] T041 [US2] Implement server-side modification persistence in backend/src/services/project-modifications.service.ts
- [ ] T042 [US2] Add modification history display component in frontend/src/app/components/modification-history/

**Checkpoint**: User Story 2 complete - all project changes are tracked independently

---

## Phase 6: User Story 3 - Subscription-Based Undo Operations (Priority: P3)

**Goal**: Users can undo modifications with subscription-based limits (5 vs 50 operations)

**Independent Test**: Make changes, use undo, verify default users get 5 operations and subscription users get 50

### Implementation for User Story 3

- [ ] T043 [P] [US3] Create SubscriptionService in frontend/src/app/services/subscription.service.ts
- [ ] T044 [P] [US3] Add subscription limit checking to UndoRedoService
- [ ] T045 [P] [US3] Create subscription endpoints in backend/src/controllers/subscription.controller.ts
- [ ] T046 [P] [US3] Create UndoRedoControlsComponent in frontend/src/app/components/undo-redo-controls/
- [ ] T047 [US3] Implement undo operation with subscription limits and server-side history retrieval
- [ ] T048 [US3] Add limit-reached UI feedback and upgrade prompts
- [ ] T049 [US3] Create subscription limit guard in frontend/src/app/guards/subscription-limit.guard.ts
- [ ] T050 [US3] Add server-side undo operation history pruning based on subscription limits

**Checkpoint**: User Story 3 complete - subscription-based undo works independently

---

## Phase 7: User Story 4 - Redo Operations (Priority: P4)

**Goal**: Users can redo undone modifications with same subscription limits as undo

**Independent Test**: Make changes, undo them, redo them, verify redo follows same subscription limits

### Implementation for User Story 4

- [ ] T051 [P] [US4] Add redo functionality to UndoRedoService
- [ ] T052 [P] [US4] Implement redo command execution in command pattern
- [ ] T053 [US4] Add redo controls to UndoRedoControlsComponent
- [ ] T054 [US4] Implement redo history management and limits
- [ ] T055 [US4] Add redo UI state management (enabled/disabled)
- [ ] T056 [US4] Handle redo history clearing on new modifications

**Checkpoint**: User Story 4 complete - full undo/redo cycle works independently

---

## Phase 8: Integration & E2E Testing

**Purpose**: Verify all user stories work together and handle edge cases

- [ ] T057 [P] Create E2E test for project creation workflow in e2e/tests/project-creation.spec.ts
- [ ] T058 [P] Create E2E test for dashboard navigation in e2e/tests/dashboard-navigation.spec.ts
- [ ] T059 [P] Create E2E test for modification tracking in e2e/tests/modification-tracking.spec.ts
- [ ] T060 [P] Create E2E test for undo/redo operations in e2e/tests/undo-redo-operations.spec.ts
- [ ] T061 [P] Create E2E test for subscription limits in e2e/tests/subscription-limits.spec.ts
- [ ] T062 Add error handling for edge cases (invalid names, rapid modifications)
- [ ] T063 Add loading states and user feedback across all components
- [ ] T064 Verify subscription limit enforcement across all features

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements and production readiness

- [ ] T065 [P] Add user guidance tooltips and help text
- [ ] T066 [P] Implement upgrade prompts for subscription limits
- [ ] T067 [P] Add accessibility attributes and keyboard navigation
- [ ] T068 [P] Optimize bundle size and lazy loading
- [ ] T069 Add performance monitoring for key operations
- [ ] T070 Create user documentation in docs/features/project-management.md
- [ ] T071 Final testing and deployment verification

---

## Dependencies & Execution Strategy

### User Story Dependencies

- **US1 (Create Projects)** → Independent (MVP foundation)
- **US5 (Dashboard)** → Depends on US1 (needs projects to display)
- **US2 (Tracking)** → Depends on US1 (needs projects to track)
- **US3 (Undo)** → Depends on US2 (needs modification tracking)
- **US4 (Redo)** → Depends on US3 (needs undo functionality)

### Parallel Execution Opportunities

- **Phase 2**: All foundational tasks can run in parallel
- **Within each story**: Tasks marked [P] can run simultaneously
- **Across stories**: Frontend and backend tasks can be parallelized

### MVP Scope (Minimum Viable Product)

**Recommended MVP**: User Story 1 + User Story 5 only

- Users can create projects with color properties
- Dashboard provides project list and navigation
- Provides immediate value for testing and feedback

**Total Tasks**: 72 tasks

- Setup: 8 tasks (added project modifications table migration)
- Foundation: 8 tasks
- US1 (Create Projects): 11 tasks
- US5 (Dashboard): 8 tasks
- US2 (Tracking): 8 tasks (updated for server-side persistence)
- US3 (Undo): 8 tasks (updated for server-side persistence)
- US4 (Redo): 6 tasks
- E2E Testing: 8 tasks
- Polish: 7 tasks

**Architecture Update**: All modification history now persists on server-side (PostgreSQL) instead of browser sessionStorage, enabling cross-session undo/redo functionality.

**Parallel Opportunities**: 32 tasks marked [P] can run simultaneously within their dependencies

**Independent Test Criteria**: Each user story includes specific verification steps for standalone testing
