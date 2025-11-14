# Tasks: Theme Switching

**Input**: Design documents from `/specs/001-theme-switching/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: E2E tests are included as per project constitution requirement for comprehensive Playwright coverage.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md structure: `frontend/src/` for implementation, `e2e/tests/` for tests

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create theme models and types in frontend/src/app/models/theme.models.ts
- [ ] T002 [P] Create theme CSS variables structure in frontend/src/styles/themes/theme-variables.scss
- [ ] T003 [P] Create light theme styles in frontend/src/styles/themes/light-theme.scss
- [ ] T004 [P] Create dark theme styles in frontend/src/styles/themes/dark-theme.scss
- [ ] T005 Update global styles with theme data attribute selectors in frontend/src/styles/globals.scss

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core theme infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Implement core ThemeService with Angular Signals in frontend/src/app/services/theme.service.ts
- [ ] T007 Add localStorage persistence with graceful degradation to ThemeService
- [ ] T008 Add system theme detection using matchMedia API to ThemeService
- [ ] T009 Add authentication integration to ThemeService for user access control
- [ ] T010 Create reusable ThemeSwitcherComponent structure in frontend/src/app/components/theme-switcher/theme-switcher.component.ts
- [ ] T011 Create ThemeSwitcherComponent template in frontend/src/app/components/theme-switcher/theme-switcher.component.html
- [ ] T012 Create ThemeSwitcherComponent styles in frontend/src/app/components/theme-switcher/theme-switcher.component.scss

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Basic Theme Selection (Priority: P1) 🎯 MVP

**Goal**: Authenticated users can switch between light and dark themes with immediate visual feedback

**Independent Test**: Login as authenticated user, click Light/Dark buttons, verify instant UI theme change and controls hidden for unauthenticated users

### E2E Tests for User Story 1

- [ ] T013 [P] [US1] Create authenticated theme switching test in e2e/tests/theme-switching/theme-switching-auth.spec.ts
- [ ] T014 [P] [US1] Create unauthenticated access control test in e2e/tests/theme-switching/theme-switching-unauth.spec.ts
- [ ] T015 [P] [US1] Create theme test data fixtures in e2e/fixtures/theme-test-data.ts

### Implementation for User Story 1

- [ ] T016 [US1] Implement basic theme switching logic (Light/Dark only) in ThemeService
- [ ] T017 [US1] Add theme control visibility logic based on authentication in ThemeService
- [ ] T018 [US1] Implement Light and Dark button handlers in ThemeSwitcherComponent
- [ ] T019 [US1] Add visual indication of currently selected theme in ThemeSwitcherComponent
- [ ] T020 [US1] Integrate ThemeSwitcherComponent into dashboard component in frontend/src/app/components/dashboard/dashboard.component.html
- [ ] T021 [US1] Add instant theme application without animations using CSS data attributes

**Checkpoint**: At this point, basic Light/Dark theme switching should be fully functional for authenticated users

---

## Phase 4: User Story 2 - System Theme Detection (Priority: P2)

**Goal**: Authenticated users can enable System mode to automatically match OS theme preference

**Independent Test**: Select System mode, change OS theme settings, verify automatic application theme switching

### E2E Tests for User Story 2

- [ ] T022 [P] [US2] Create system theme detection test in e2e/tests/theme-switching/system-theme-detection.spec.ts
- [ ] T023 [P] [US2] Create browser compatibility test in e2e/tests/theme-switching/browser-compatibility.spec.ts

### Implementation for User Story 2

- [ ] T024 [US2] Add System mode support to ThemeService with matchMedia listeners
- [ ] T025 [US2] Implement browser compatibility detection for prefers-color-scheme in ThemeService
- [ ] T026 [US2] Add System button with disabled state for unsupported browsers in ThemeSwitcherComponent
- [ ] T027 [US2] Add explanatory tooltips for disabled System mode in ThemeSwitcherComponent
- [ ] T028 [US2] Implement automatic theme updates when OS theme changes in System mode

**Checkpoint**: At this point, System theme detection should work with graceful degradation for unsupported browsers

---

## Phase 5: User Story 3 - Theme Persistence (Priority: P3)

**Goal**: User theme preferences persist across browser sessions and maintain defaults for new users

**Independent Test**: Set theme preference, close/reopen browser, verify theme maintained; test first-time user gets light theme default

### Implementation for User Story 3

- [ ] T029 [US3] Enhance localStorage persistence to handle session restoration in ThemeService
- [ ] T030 [US3] Add theme preference loading on application startup in ThemeService
- [ ] T031 [US3] Implement default light theme for users with no saved preference in ThemeService
- [ ] T032 [US3] Add error handling for localStorage quota/security errors in ThemeService
- [ ] T033 [US3] Ensure System mode preference persists and continues working after login/logout

**Checkpoint**: At this point, theme preferences should persist reliably across all browser sessions

---

## Phase 6: User Story 4 - Cross-Component Functionality (Priority: P3)

**Goal**: Theme switching remains functional when ThemeSwitcherComponent is moved between different components

**Independent Test**: Move theme switcher component to different locations (header, settings), verify identical functionality across all application pages

### Implementation for User Story 4

- [ ] T034 [US4] Ensure ThemeService independence from component location through dependency injection
- [ ] T035 [US4] Verify ThemeSwitcherComponent works identically in different parent components
- [ ] T036 [US4] Add cross-page theme consistency verification in ThemeService
- [ ] T037 [US4] Test theme switcher integration with multiple potential parent components
- [ ] T038 [US4] Ensure theme state updates propagate to all components simultaneously via Angular Signals

**Checkpoint**: Theme switching functionality should be completely location-independent and work across all application contexts

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final integration, performance optimization, and documentation

- [ ] T039 [P] Add comprehensive unit tests for ThemeService in frontend/src/app/services/theme.service.spec.ts
- [ ] T040 [P] Add comprehensive unit tests for ThemeSwitcherComponent in frontend/src/app/components/theme-switcher/theme-switcher.component.spec.ts
- [ ] T041 [P] Optimize theme switching performance to meet <1 second response requirement
- [ ] T042 [P] Optimize system theme detection to meet <2 second response requirement
- [ ] T043 [P] Validate accessibility compliance for theme switching controls
- [ ] T044 [P] Run quickstart.md validation and update documentation if needed
- [ ] T045 Remove any debug console statements to comply with production code cleanliness principle

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Builds on US1 theme switching but independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Works with any theme mode, independently testable
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - Validates cross-component functionality, independently testable

### Within Each User Story

- E2E tests should be written first to define acceptance criteria
- Core service implementation before component integration
- Component functionality before UI integration
- Story complete and tested before moving to next priority

### Parallel Opportunities

- Setup tasks T002, T003, T004 (theme CSS files) can run in parallel
- Foundational tasks for different files can run in parallel once dependencies are met
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- E2E tests within each story can run in parallel
- Unit tests (T039, T040) can run in parallel during Polish phase
- Performance optimization tasks (T041, T042) can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all E2E tests for User Story 1 together:
Task: "Create authenticated theme switching test in e2e/tests/theme-switching/theme-switching-auth.spec.ts"
Task: "Create unauthenticated access control test in e2e/tests/theme-switching/theme-switching-unauth.spec.ts"
Task: "Create theme test data fixtures in e2e/fixtures/theme-test-data.ts"

# After tests are ready, launch implementation tasks that don't conflict:
Task: "Implement basic theme switching logic (Light/Dark only) in ThemeService"
Task: "Add visual indication of currently selected theme in ThemeSwitcherComponent"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (theme models and CSS structure)
2. Complete Phase 2: Foundational (core ThemeService and ThemeSwitcherComponent)
3. Complete Phase 3: User Story 1 (basic Light/Dark switching for authenticated users)
4. **STOP and VALIDATE**: Test User Story 1 independently with E2E tests
5. Deploy/demo basic theme switching functionality

### Incremental Delivery

1. Complete Setup + Foundational → Theme infrastructure ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP: Basic theme switching!)
3. Add User Story 2 → Test independently → Deploy/Demo (System theme detection!)
4. Add User Story 3 → Test independently → Deploy/Demo (Theme persistence!)
5. Add User Story 4 → Test independently → Deploy/Demo (Cross-component flexibility!)
6. Each story adds value without breaking previous functionality

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Basic theme switching)
   - Developer B: User Story 2 (System theme detection)
   - Developer C: User Story 3 (Theme persistence)
   - Developer D: User Story 4 (Cross-component functionality)
3. Stories complete and integrate independently through shared ThemeService

---

## Summary

- **Total Tasks**: 45 tasks across 7 phases
- **Task Count per User Story**:
  - US1 (P1): 9 tasks (3 tests + 6 implementation)
  - US2 (P2): 7 tasks (2 tests + 5 implementation)
  - US3 (P3): 5 tasks (implementation only)
  - US4 (P3): 5 tasks (implementation only)
- **Parallel Opportunities**: 15 tasks marked [P] for parallel execution
- **Independent Test Criteria**: Each user story has clear acceptance criteria and E2E tests
- **Suggested MVP Scope**: User Story 1 only (basic Light/Dark theme switching for authenticated users)
- **Format Validation**: ✅ All tasks follow required checklist format with checkbox, ID, labels, and file paths
