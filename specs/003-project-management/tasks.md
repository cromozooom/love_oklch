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

- [x] T001 Create project structure per implementation plan in frontend/, backend/, e2e/ directories
- [x] T002 Initialize Angular project with dependencies in frontend/package.json
- [x] T003 [P] Initialize backend Node.js/TypeScript project with dependencies in backend/package.json
- [x] T004 [P] Configure PostgreSQL database schema with Project and ProjectModification models in backend/src/database/schema.prisma (compliant with freemium entitlements spec)
- [x] T005 [P] Database schema applied successfully with all tables created including projects and project_modifications
- [x] T006 [P] Setup Playwright E2E testing framework in e2e/playwright.config.ts
- [x] T007 [P] Configure TypeScript and ESLint for frontend in frontend/tsconfig.json
- [x] T008 [P] Configure TypeScript and ESLint for backend in backend/tsconfig.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T009 Setup database connection and migration runner in backend/src/database/connection.ts
- [x] T010 [P] Create JWT authentication middleware for project endpoints (user identification, subscription checking, project ownership validation) in backend/src/middleware/auth.ts
- [x] T011 [P] extends existing Express server rather than recreating, base API routing structure in backend/src/routes/index.ts
- [x] T012 [P] Setup Angular routing configuration in frontend/src/app/app.routes.ts
- [x] T013 [P] Create base error handling service in frontend/src/app/services/error-handler.service.ts
- [x] T014 [P] Setup HTTP interceptor for authentication in frontend/src/app/interceptors/auth.interceptor.ts
- [x] T015 [P] Create User model for subscription support in backend/src/models/user.model.ts
- [x] T016 [P] Setup Angular Signals store configuration in frontend/src/app/store/app.store.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Create and Configure Projects (Priority: P1) 🎯 MVP

**Goal**: Users can create new projects with name, color gamut, and color space properties

**Independent Test**: Create a project named "Test Project" with "Display P3" gamut and "OKLCH" color space, verify it saves correctly

### Implementation for User Story 1

- [x] T017 [P] [US1] Create Project model in backend/src/models/project.model.ts
- [x] T018 [P] [US1] Create Project entity interfaces in frontend/src/app/models/project.interface.ts
- [x] T019 [P] [US1] Create color enums (ColorGamut, ColorSpace) in frontend/src/app/models/color-enums.ts
- [x] T020 [US1] Implement ProjectService CRUD operations in backend/src/services/project.service.ts
- [x] T021 [US1] Create projects API controller in backend/src/controllers/projects.controller.ts
- [x] T022 [US1] Add projects routes in backend/src/routes/projects.routes.ts
- [x] T023 [US1] Implement Angular ProjectService in frontend/src/app/services/project.service.ts
- [x] T024 [US1] Create ProjectFormComponent in frontend/src/app/components/project-form/
- [x] T025 [US1] Create ProjectListComponent in frontend/src/app/components/project-list/
- [x] T026 [US1] Add project creation form validation in frontend/src/app/validators/project.validators.ts
- [x] T027 [US1] Integrate project creation with backend API in ProjectService

**Checkpoint**: User Story 1 complete - users can create and configure projects independently

---

## Phase 4: User Story 5 - Projects List Navigation (Priority: P1) 🎯 MVP

**Goal**: Users can access the projects list page showing their projects and navigate to project editors in SPA

**Independent Test**: Load `/projects` page, see project list, click project edit button, verify navigation to editor without page reload

### Implementation for User Story 5

- [x] T028 [P] [US5] Create DashboardComponent (layout wrapper) in frontend/src/app/components/dashboard/
- [x] T029 [P] [US5] Setup projects list routing in frontend/src/app/app.routes.ts
- [x] T030 [P] [US5] Create project navigation guard in frontend/src/app/guards/project-exists.guard.ts
- [x] T031 [US5] Implement project list display in ProjectListComponent
- [x] T032 [US5] Add SPA navigation from projects list to project editor
- [x] T033 [US5] Create breadcrumb navigation component in frontend/src/app/components/breadcrumb/
- [x] T034 [US5] Add project selection state management in ProjectService
- [x] T035 [US5] Implement loading states and error handling for projects list

**Checkpoint**: User Story 5 complete - projects list navigation works independently

---

## Phase 5: User Story 2 - Project Modification Tracking (Priority: P2)

**Goal**: Track all project property changes with timestamps and previous values for undo/redo

**Independent Test**: Modify project properties multiple times, verify each change is tracked with metadata

### Implementation for User Story 2

- [x] T036 [P] [US2] Create ProjectModification interface in frontend/src/app/models/project-modification.interface.ts
- [x] T037 [P] [US2] Create Command pattern interfaces in frontend/src/app/models/command.interface.ts
- [x] T038 [P] [US2] Implement UndoRedoService base structure in frontend/src/app/services/undo-redo.service.ts
- [x] T039 [US2] Create UpdateProjectPropertyCommand in frontend/src/app/commands/update-project-property.command.ts
- [x] T040 [US2] Add modification tracking to ProjectService
- [x] T041 [US2] Create project modifications API endpoints in backend/src/controllers/project-modifications.controller.ts
- [x] T042 [US2] Implement server-side modification persistence in backend/src/services/project-modifications.service.ts
- [x] T043 [US2] Add modification history display component in frontend/src/app/components/modification-history/

**Checkpoint**: User Story 2 complete - all project changes are tracked independently

---

## Phase 6: User Story 3 - Unlimited Undo Operations (Priority: P3) ✅

**Goal**: Users can undo modifications with unlimited history (subscription limits removed for MVP)

**Independent Test**: Make changes, use undo, verify unlimited undo operations work correctly

### Implementation for User Story 3

- [x] T044 [P] [US3] UndoRedoService implemented with unlimited history in frontend/src/app/services/undo-redo.service.ts
- [x] T045 [P] [US3] Command pattern implemented with UpdateProjectPropertyCommand
- [x] T046 [P] [US3] Auto-save functionality with 1s debounce in OptimisticUpdatesService
- [x] T047 [P] [US3] UndoRedoControlsComponent created in frontend/src/app/components/undo-redo-controls/
- [x] T048 [US3] Undo operation implemented with server-side modification creation and property updates
- [x] T049 [US3] UI feedback with undo/redo button states (canUndo/canRedo computed signals)
- [x] T050 [US3] Case-insensitive modification type handling in backend (property_change → PROPERTY_CHANGE)
- [x] T051 [US3] Batch modification endpoint with atomic property updates in backend/src/controllers/project-modifications.controller.ts

**Checkpoint**: User Story 3 complete - unlimited undo works independently with auto-save persistence

---

## Phase 7: User Story 4 - Redo Operations (Priority: P4) ✅

**Goal**: Users can redo undone modifications with unlimited history

**Independent Test**: Make changes, undo them, redo them, verify redo works correctly

### Implementation for User Story 4

- [x] T052 [P] [US4] Redo functionality added to UndoRedoService with separate redo stack per project
- [x] T053 [P] [US4] Command pattern supports redo through execute() method
- [x] T054 [US4] Redo controls integrated in UndoRedoControlsComponent with redo button
- [x] T055 [US4] Redo history management with automatic stack clearing on new modifications
- [x] T056 [US4] Redo UI state management via canRedo computed signal
- [x] T057 [US4] Redo stack cleared when new command is executed to maintain consistency

**Checkpoint**: User Story 4 complete - full undo/redo cycle works independently

---

## Phase 8: Integration & E2E Testing

**Purpose**: Verify all user stories work together and handle edge cases

- [x] T058 [P] Create E2E test for project creation workflow in e2e/project-creation.spec.ts ✅
  - Tests: Complete creation flow, form validation, multiple projects, color combinations, data persistence, cancel functionality
- [x] T059 [P] Create E2E test for projects list navigation and SPA behavior in e2e/projects-navigation.spec.ts ✅
  - Tests: Load projects list, navigate to editor, return to list, verify SPA (no page reloads), breadcrumb navigation, refresh, empty state, scroll preservation, direct URL navigation
- [x] T060 [P] Create E2E test for modification tracking in e2e/modification-tracking.spec.ts ✅
  - Tests: Name changes, color gamut/space changes, multiple sequential changes, persistence across refresh, timestamp tracking, debounced saves, description changes. Also fixed routing bug - projects now navigate to editor after creation
- [x] T061 [P] Create comprehensive E2E test for undo/redo operations in e2e/undo-redo-functionality.spec.ts ✅
  - Tests: Undo single change, undo multiple changes, redo operations, auto-save persistence, navigation state preservation, redo stack clearing, form state synchronization
- [x] T062 [P] Create E2E test for subscription limits (deferred - unlimited history for MVP) ✅
  - **Status**: Documented instead of implemented (limits deferred to post-MVP)
  - **Documentation**: Created comprehensive seed data reference in `docs/SEED_DATA_REFERENCE.md`
  - **Content**: Complete user account matrix, feature access levels, subscription plans, testing strategies
  - **Purpose**: Clear reference for who has what access across all test accounts and subscription tiers
- [x] T063 Error handling for edge cases implemented (form validation, API errors, network failures)
- [x] T064 Loading states and user feedback added (undo/redo button states, form dirty state)
- [ ] T065 Verify subscription limit enforcement (deferred - unlimited history for MVP)

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements and production readiness

- [ ] T066 [P] Add user guidance tooltips and help text
- [ ] T067 [P] Implement upgrade prompts for subscription limits
- [ ] T068 [P] Add accessibility attributes and keyboard navigation
- [ ] T069 [P] Optimize bundle size and lazy loading
- [ ] T070 Add performance monitoring for key operations
- [ ] T071 Create user documentation in docs/features/project-management.md
- [ ] T072 Final testing and deployment verification

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
