# Tasks: Color Setter Component

**Input**: Design documents from `/specs/005-color-setter-component/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: E2E tests included per specification requirements

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description [Est: Xh]`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- **[Est: Xh]**: Estimated time in hours
- Include exact file paths in descriptions

## Time Estimates Summary

- **Total Estimated Time**: 145-180 hours (18-23 developer days)
- **MVP Scope (Phases 1-3)**: 52-65 hours (6.5-8 days)
- **Full Implementation**: 145-180 hours (18-23 days)
- **Estimates assume**: Experienced Angular/TypeScript developer familiar with colorjs.io

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure  
**Phase Total**: 3-4 hours

- [x] T001 Create component directory structure at `frontend/src/app/components/color-setter/` [Est: 0.5h]
- [x] T002 Install colorjs.io dependency via `cd frontend; npm install colorjs.io` [Est: 0.5h]
- [x] T003 [P] Install Angular CDK via `cd frontend; npm install @angular/cdk` [Est: 0.5h]
- [x] T004 [P] Configure TypeScript strict mode in `frontend/tsconfig.json` for color-setter [Est: 1h]
- [x] T005 [P] Setup Tailwind CSS utilities for color display in `frontend/tailwind.config.js` [Est: 1h]

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data models and service contracts that ALL user stories depend on  
**Phase Total**: 12-15 hours

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Create ColorState interface in `frontend/src/app/components/color-setter/models/color-state.model.ts` [Est: 1h]
- [x] T007 [P] Create ColorFormat type and FormatConfig interface in `frontend/src/app/components/color-setter/models/format-config.model.ts` [Est: 1.5h]
- [x] T008 [P] Create GamutProfile type and GamutDefinition interface in `frontend/src/app/components/color-setter/models/gamut-profile.model.ts` [Est: 1h]
- [x] T009 Create format configurations (6 formats: hex, rgb, hsl, lch, oklch, lab) in `frontend/src/app/components/color-setter/models/format-config.model.ts` [Est: 3h]
- [x] T010 Create ColorService interface contract in `frontend/src/app/components/color-setter/services/color.service.ts` [Est: 2h]
- [x] T011 [P] Create validation utilities in `frontend/src/app/components/color-setter/utils/color-validators.ts` [Est: 2h]
- [x] T012 Implement base ColorService with colorjs.io integration for parse() and convert() methods in `frontend/src/app/components/color-setter/services/color.service.ts` [Est: 3h]

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Basic Color Selection (Priority: P1) 🎯 MVP

**Goal**: Users can select and preview colors using HEX, RGB, and HSL formats with real-time visual feedback  
**Phase Total**: 37-46 hours

**Independent Test**: Open component, select format (HEX/RGB/HSL), adjust values via sliders or text input, verify color preview updates immediately

### Tests for User Story 1

- [x] T013 [P] [US1] Create E2E test for HEX color input in `e2e/specs/color-setter/basic-color-selection.spec.ts` - test "#00FF00" input [Est: 1.5h]
- [x] T014 [P] [US1] Create E2E test for RGB slider interaction in `e2e/specs/color-setter/basic-color-selection.spec.ts` - test rgb(128,64,192) [Est: 2h]
- [x] T015 [P] [US1] Create E2E test for HSL format switching in `e2e/specs/color-setter/basic-color-selection.spec.ts` - test color preservation [Est: 2h]
- [x] T016 [P] [US1] Create unit test for ColorService conversion methods in `frontend/src/app/components/color-setter/services/__tests__/color.service.spec.ts` [Est: 2h]

### Implementation for User Story 1

- [x] T017 [P] [US1] Implement ColorService.toAllFormats() method in `frontend/src/app/components/color-setter/services/color.service.ts` [Est: 2h]
- [x] T018 [P] [US1] Implement ColorService.getChannels() for RGB/HSL in `frontend/src/app/components/color-setter/services/color.service.ts` [Est: 1.5h]
- [x] T019 [P] [US1] Implement ColorService.setChannel() for updating individual channels in `frontend/src/app/components/color-setter/services/color.service.ts` [Est: 1.5h]
- [x] T020 [US1] Create main ColorSetterComponent with Angular Signals state in `frontend/src/app/components/color-setter/color-setter.component.ts` [Est: 3h]
- [x] T021 [US1] Implement component inputs (initialColor, initialFormat) in `frontend/src/app/components/color-setter/color-setter.component.ts` [Est: 1h]
- [x] T022 [US1] Implement component output (colorChange event) in `frontend/src/app/components/color-setter/color-setter.component.ts` [Est: 1h]
- [x] T023 [P] [US1] Create format selector subcomponent UI in `frontend/src/app/components/color-setter/subcomponents/format-selector/format-selector.component.ts` [Est: 2h]
- [x] T024 [P] [US1] Create color preview subcomponent in `frontend/src/app/components/color-setter/subcomponents/color-preview/color-preview.component.ts` [Est: 2h]
- [x] T025 [US1] Create HEX text input control with validation in `frontend/src/app/components/color-setter/subcomponents/color-sliders/hex-input.component.ts` [Est: 2h]
- [x] T026 [US1] Create RGB sliders subcomponent using Angular CDK in `frontend/src/app/components/color-setter/subcomponents/color-sliders/rgb-sliders.component.ts` [Est: 3h]
- [x] T027 [US1] Create HSL sliders subcomponent using Angular CDK in `frontend/src/app/components/color-setter/subcomponents/color-sliders/hsl-sliders.component.ts` [Est: 3h]
- [x] T028 [US1] Implement main component template with format switching logic in `frontend/src/app/components/color-setter/color-setter.component.html` [Est: 2h]
- [x] T029 [US1] Add Tailwind CSS styling for component layout in `frontend/src/app/components/color-setter/color-setter.component.scss` [Est: 3h]
- [x] T030 [US1] Implement input validation and clamping in ColorService in `frontend/src/app/components/color-setter/services/color.service.ts` [Est: 2h]
- [x] T031 [US1] Add debouncing (16ms) for slider updates using RxJS in `frontend/src/app/components/color-setter/color-setter.component.ts` [Est: 1.5h]
- [x] T032 [US1] Implement computed signals for displayValue in `frontend/src/app/components/color-setter/color-setter.component.ts` [Est: 1h]

**Checkpoint**: User Story 1 complete - users can select colors in HEX/RGB/HSL with real-time preview

---

## Phase 4: User Story 2 - Accessibility Compliance Checking (Priority: P2)

**Goal**: Display WCAG contrast ratios against white/black backgrounds with AA/AAA compliance indicators  
**Phase Total**: 23-28 hours

**Independent Test**: Select any color, verify contrast ratios are calculated and displayed with correct AA/AAA thresholds (4.5:1, 7:1, 3:1, 4.5:1)

### Tests for User Story 2

- [x] T033 [P] [US2] Create E2E test for WCAG panel display in `e2e/specs/color-setter/accessibility-compliance.spec.ts` - test dark blue contrast [Est: 1.5h]
- [x] T034 [P] [US2] Create E2E test for AA/AAA indicators in `e2e/specs/color-setter/accessibility-compliance.spec.ts` - test all 4 thresholds [Est: 2h]
- [x] T035 [P] [US2] Create E2E test for dynamic contrast updates in `e2e/specs/color-setter/accessibility-compliance.spec.ts` - test brightness changes [Est: 1.5h]
- [x] T036 [P] [US2] Create unit test for WCAGService calculations in `frontend/src/app/components/color-setter/services/__tests__/wcag.service.spec.ts` [Est: 2h]

### Implementation for User Story 2

- [x] T037 [P] [US2] Create WCAGResult interface in `frontend/src/app/components/color-setter/models/wcag-contrast.model.ts` [Est: 1h]
- [x] T038 [P] [US2] Create WCAGAnalysis interface in `frontend/src/app/components/color-setter/models/wcag-contrast.model.ts` [Est: 0.5h]
- [x] T039 [US2] Implement WCAGService with colorjs.io contrast calculations in `frontend/src/app/components/color-setter/services/wcag.service.ts` [Est: 3h]
- [x] T040 [US2] Implement WCAGService.calculateContrast() method in `frontend/src/app/components/color-setter/services/wcag.service.ts` [Est: 1.5h]
- [x] T041 [US2] Implement WCAGService.analyze() with all 4 thresholds in `frontend/src/app/components/color-setter/services/wcag.service.ts` [Est: 2h]
- [x] T042 [US2] Implement WCAGService.passes() for AA/AAA checking in `frontend/src/app/components/color-setter/services/wcag.service.ts` [Est: 1h]
- [x] T043 [US2] Create WCAG panel subcomponent in `frontend/src/app/components/color-setter/subcomponents/wcag-panel/wcag-panel.component.ts` [Est: 2h]
- [x] T044 [US2] Implement WCAG panel template with contrast display in `frontend/src/app/components/color-setter/subcomponents/wcag-panel/wcag-panel.component.html` [Est: 2h]
- [x] T045 [US2] Add Tailwind CSS styling for AA/AAA indicators in `frontend/src/app/components/color-setter/subcomponents/wcag-panel/wcag-panel.component.scss` [Est: 1.5h]
- [x] T046 [US2] Integrate WCAG calculation into main component with debouncing (100ms) in `frontend/src/app/components/color-setter/color-setter.component.ts` [Est: 1.5h]
- [x] T047 [US2] Add WCAG results to colorChange event payload in `frontend/src/app/components/color-setter/color-setter.component.ts` [Est: 0.5h]
- [x] T048 [US2] Add showWCAG input property to main component in `frontend/src/app/components/color-setter/color-setter.component.ts` [Est: 0.5h]

**Checkpoint**: User Stories 1 AND 2 complete - basic color selection + WCAG compliance checking both functional

---

## Phase 5: User Story 3 - Advanced Color Space Support (Priority: P3)

**Goal**: Support LCH, OKLCH, LAB formats with gamut warnings for sRGB and Display P3  
**Phase Total**: 40-50 hours

**Independent Test**: Select LCH/OKLCH format, increase chroma beyond gamut limits, verify gamut warning appears

### Tests for User Story 3

- [x] T049 [P] [US3] Create E2E test for LCH chroma gamut warning in `e2e/specs/color-setter/advanced-color-spaces.spec.ts` - test exceeding sRGB [Est: 2h]
- [x] T050 [P] [US3] Create E2E test for OKLCH Display P3 gamut in `e2e/specs/color-setter/advanced-color-spaces.spec.ts` - test out-of-gamut detection [Est: 2h]
- [x] T051 [P] [US3] Create E2E test for LAB format validation in `e2e/specs/color-setter/advanced-color-spaces.spec.ts` - test extreme values [Est: 2h]
- [x] T052 [P] [US3] Create unit test for GamutService.check() in `frontend/src/app/components/color-setter/services/__tests__/gamut.service.spec.ts` [Est: 2h]
- [x] T053 [P] [US3] Create unit test for GamutService.generateSliderGradient() in `frontend/src/app/components/color-setter/services/__tests__/gamut.service.spec.ts` [Est: 2.5h]

### Implementation for User Story 3

- [x] T054 [P] [US3] Create GamutCheckResult interface in `frontend/src/app/components/color-setter/models/gamut-profile.model.ts` [Est: 1h]
- [x] T055 [P] [US3] Create SliderGradient interface in `frontend/src/app/components/color-setter/models/slider-gradient.model.ts` [Est: 0.5h]
- [x] T056 [US3] Define gamut profile constants (sRGB, Display P3, Unlimited) in `frontend/src/app/components/color-setter/models/gamut-profile.model.ts` [Est: 1h]
- [x] T057 [US3] Implement GamutService with colorjs.io gamut checking in `frontend/src/app/components/color-setter/services/gamut.service.ts` [Est: 3h]
- [x] T058 [US3] Implement GamutService.check() method in `frontend/src/app/components/color-setter/services/gamut.service.ts` [Est: 2h]
- [x] T059 [US3] Implement GamutService.clip() for nearest in-gamut color in `frontend/src/app/components/color-setter/services/gamut.service.ts` [Est: 2h]
- [x] T060 [US3] Implement gradient generator utility in `frontend/src/app/components/color-setter/utils/slider-gradient-generator.ts` [Est: 4h]
- [x] T061 [US3] Implement GamutService.generateSliderGradient() with 50 steps in `frontend/src/app/components/color-setter/services/gamut.service.ts` [Est: 3h]
- [x] T062 [US3] Implement GamutService.getGradientStops() with transparent regions in `frontend/src/app/components/color-setter/services/gamut.service.ts` [Est: 2h]
- [ ] T063 [US3] Create LCH sliders subcomponent with gradients in `frontend/src/app/components/color-setter/subcomponents/color-sliders/lch-sliders.component.ts` [Est: 3h]
- [ ] T064 [US3] Create OKLCH sliders subcomponent with gradients in `frontend/src/app/components/color-setter/subcomponents/color-sliders/oklch-sliders.component.ts` [Est: 3h]
- [ ] T065 [US3] Create LAB sliders subcomponent with gradients in `frontend/src/app/components/color-setter/subcomponents/color-sliders/lab-sliders.component.ts` [Est: 3h]
- [ ] T066 [US3] Create gamut selector subcomponent in `frontend/src/app/components/color-setter/subcomponents/gamut-selector/gamut-selector.component.ts` [Est: 2h]
- [ ] T067 [US3] Integrate gamut checking into main component in `frontend/src/app/components/color-setter/color-setter.component.ts` [Est: 2h]
- [ ] T068 [US3] Add gamut warning display to UI in `frontend/src/app/components/color-setter/color-setter.component.html` [Est: 1.5h]
- [ ] T069 [US3] Implement dynamic gradient updates on color/gamut changes in `frontend/src/app/components/color-setter/color-setter.component.ts` [Est: 2h]
- [ ] T070 [US3] Add gamutStatus to colorChange event payload in `frontend/src/app/components/color-setter/color-setter.component.ts` [Est: 0.5h]
- [ ] T071 [US3] Add supportedGamuts input property in `frontend/src/app/components/color-setter/color-setter.component.ts` [Est: 0.5h]
- [ ] T072 [US3] Optimize gradient generation with throttling (50ms) in `frontend/src/app/components/color-setter/services/gamut.service.ts` [Est: 1.5h]

**Checkpoint**: All 3 user stories complete - full color space support with gamut visualization

---

## Phase 6: Color Naming (Enhancement)

**Purpose**: Add human-readable color names using ~150 curated names  
**Phase Total**: 16-20 hours

- [ ] T073 [P] Create ColorName interface in `frontend/src/app/components/color-setter/models/color-name.model.ts` [Est: 0.5h]
- [ ] T074 [P] Create ColorNameEntry interface in `frontend/src/app/components/color-setter/models/color-name.model.ts` [Est: 0.5h]
- [ ] T075 Create color name dataset (~150 entries) in `frontend/src/app/components/color-setter/data/color-names.data.ts` [Est: 4h]
- [ ] T076 Implement NamingService with Delta-E matching in `frontend/src/app/components/color-setter/services/naming.service.ts` [Est: 3h]
- [ ] T077 Implement NamingService.getName() with confidence calculation in `frontend/src/app/components/color-setter/services/naming.service.ts` [Est: 2h]
- [ ] T078 Implement NamingService.findClosestName() with LRU cache (size 50) in `frontend/src/app/components/color-setter/services/naming.service.ts` [Est: 2.5h]
- [ ] T079 Integrate color naming into main component with debouncing (100ms) in `frontend/src/app/components/color-setter/color-setter.component.ts` [Est: 1h]
- [ ] T080 Add color name display to UI in `frontend/src/app/components/color-setter/color-setter.component.html` [Est: 1h]
- [ ] T081 Add showColorName input property in `frontend/src/app/components/color-setter/color-setter.component.ts` [Est: 0.5h]
- [ ] T082 Add name to colorChange event payload in `frontend/src/app/components/color-setter/color-setter.component.ts` [Est: 0.5h]
- [ ] T083 [P] Create unit test for NamingService in `frontend/src/app/components/color-setter/services/__tests__/naming.service.spec.ts` [Est: 2h]

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories  
**Phase Total**: 14-17 hours

- [ ] T084 [P] Add keyboard navigation support (Tab, Arrow keys) for accessibility [Est: 2h]
- [ ] T085 [P] Add ARIA labels to all interactive elements in templates [Est: 1.5h]
- [ ] T086 [P] Implement focus management for slider interactions [Est: 1.5h]
- [ ] T087 Optimize performance - ensure <100ms color conversion target [Est: 1h]
- [ ] T088 Optimize performance - ensure <200ms WCAG calculation target [Est: 1h]
- [ ] T089 Optimize performance - ensure 60fps slider interactions (16ms debounce) [Est: 1h]
- [ ] T090 Add error boundary for invalid color inputs with fallback to #FF0000 [Est: 1.5h]
- [ ] T091 Add comprehensive JSDoc comments to all public APIs [Est: 2h]
- [ ] T092 Create component usage examples in `frontend/src/app/demos/color-setter-demo.component.ts` [Est: 2h]
- [ ] T093 [P] Add unit tests for validation utilities in `frontend/src/app/components/color-setter/utils/__tests__/color-validators.spec.ts` [Est: 1.5h]
- [ ] T094 [P] Add unit tests for gradient generator in `frontend/src/app/components/color-setter/utils/__tests__/slider-gradient-generator.spec.ts` [Est: 2h]
- [ ] T095 Verify all E2E tests pass in Chromium, Firefox, WebKit [Est: 1h]
- [ ] T096 Run quickstart.md validation - verify setup instructions work [Est: 0.5h]
- [ ] T097 Code cleanup - remove console.log statements [Est: 0.5h]
- [ ] T098 Final code review - verify TypeScript strict mode compliance [Est: 1h]
- [ ] T099 Performance profiling - verify all targets met (<2s init, 99% accuracy) [Est: 1.5h]
- [ ] T100 [P] Update documentation in `specs/005-color-setter-component/README.md` [Est: 1h]

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed) after Phase 2
  - Or sequentially in priority order (P1 → P2 → P3)
- **Color Naming (Phase 6)**: Depends on US1 completion (needs base component)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Integrates with US1 but independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Extends US1 sliders, independently testable

### Within Each User Story

- E2E tests SHOULD be written and FAIL before implementation (TDD approach)
- Models/interfaces before service implementations
- Services before component integration
- Subcomponents can be built in parallel
- Core implementation before optimization
- Story complete before moving to next priority

### Parallel Opportunities Within Phases

**Setup (Phase 1)**:

- T003, T004, T005 can run in parallel

**Foundational (Phase 2)**:

- T007, T008, T011 can run in parallel after T006

**User Story 1 (Phase 3)**:

- Tests T013-T016 can run in parallel
- Implementations T017-T019 can run in parallel
- Subcomponents T023, T024 can run in parallel
- Slider components T025-T027 can run in parallel

**User Story 2 (Phase 4)**:

- Tests T033-T036 can run in parallel
- Model interfaces T037, T038 can run in parallel
- Service methods T040-T042 can be developed in sequence but tested in parallel

**User Story 3 (Phase 5)**:

- Tests T049-T053 can run in parallel
- Model interfaces T054, T055 can run in parallel
- Slider components T063-T065 can run in parallel

**Color Naming (Phase 6)**:

- T073, T074 can run in parallel

**Polish (Phase 7)**:

- T084-T086 (accessibility) can run in parallel
- T093, T094 (utils tests) can run in parallel
- T097-T100 (cleanup tasks) should be sequential

---

## Parallel Example: User Story 1

```bash
# Launch all E2E tests for User Story 1 together:
Task T013: "E2E test for HEX color input"
Task T014: "E2E test for RGB slider interaction"
Task T015: "E2E test for HSL format switching"
Task T016: "Unit test for ColorService conversion"

# Launch ColorService methods together:
Task T017: "Implement toAllFormats()"
Task T018: "Implement getChannels()"
Task T019: "Implement setChannel()"

# Launch subcomponents together:
Task T023: "Create format selector"
Task T024: "Create color preview"

# Launch all sliders together:
Task T025: "Create HEX input"
Task T026: "Create RGB sliders"
Task T027: "Create HSL sliders"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T012) - CRITICAL
3. Complete Phase 3: User Story 1 (T013-T032)
4. **STOP and VALIDATE**: Test HEX/RGB/HSL color selection independently
5. Deploy/demo if ready - basic color picker is functional

**Estimated MVP Scope**: ~32 tasks, provides fully functional basic color picker

### Incremental Delivery

1. **Foundation** (Setup + Foundational) → T001-T012 complete
2. **MVP Release** (+ User Story 1) → T013-T032 complete
   - Users can select colors in HEX/RGB/HSL
   - Real-time preview working
   - Deploy as v0.1.0
3. **Accessibility Release** (+ User Story 2) → T033-T048 complete
   - WCAG compliance checking added
   - Deploy as v0.2.0
4. **Professional Release** (+ User Story 3) → T049-T072 complete
   - Advanced color spaces (LCH/OKLCH/LAB)
   - Gamut visualization
   - Deploy as v0.3.0
5. **Enhanced Release** (+ Color Naming) → T073-T083 complete
   - Human-readable color names
   - Deploy as v0.4.0
6. **Production Release** (+ Polish) → T084-T100 complete
   - Full accessibility, performance optimized
   - Deploy as v1.0.0

### Parallel Team Strategy

With 3 developers after Foundation complete:

1. **Team completes Setup + Foundational together** (T001-T012)
2. **Once Foundational is done**:
   - Developer A: User Story 1 (T013-T032) - Basic color selection
   - Developer B: User Story 2 (T033-T048) - WCAG panel (waits for A's component structure)
   - Developer C: User Story 3 (T049-T072) - Advanced color spaces (waits for A's slider structure)
3. **After US1 complete**: Developer B and C can work in parallel
4. **Integration**: Merge US1, then US2, then US3
5. **All together**: Color Naming (T073-T083) and Polish (T084-T100)

---

## Summary

- **Total Tasks**: 100
- **Total Estimated Time**: 145-180 hours (18-23 developer days @ 8h/day)
- **Task Count by Phase**:

  - Setup: 5 tasks (3-4h)
  - Foundational: 7 tasks (12-15h) - BLOCKS all stories
  - User Story 1 (P1 - MVP): 20 tasks (37-46h)
  - User Story 2 (P2): 16 tasks (23-28h)
  - User Story 3 (P3): 24 tasks (40-50h)
  - Color Naming: 11 tasks (16-20h)
  - Polish: 17 tasks (14-17h)

- **MVP Scope**: Phase 1 + Phase 2 + Phase 3 (User Story 1) = 32 tasks (52-65 hours / 6.5-8 days)
- **Parallel Opportunities**: 35+ tasks marked [P] can run in parallel within their phases
- **Independent Test Criteria**:

  - US1: Select HEX/RGB/HSL colors, verify preview updates
  - US2: Check WCAG ratios display with correct thresholds
  - US3: Set out-of-gamut colors, verify warnings appear

- **Format Validation**: ✅ All tasks follow checklist format with ID, [P]/[Story] labels, file paths, and time estimates

## Time Breakdown by Category

- **Setup & Infrastructure**: 15-19h (10%)
- **Data Models & Interfaces**: 8-10h (6%)
- **Core Services**: 30-38h (21%)
- **UI Components**: 45-55h (32%)
- **Testing (E2E + Unit)**: 26-32h (18%)
- **Polish & Optimization**: 21-26h (15%)

**Note**: Time estimates assume an experienced Angular/TypeScript developer familiar with colorjs.io and modern web development practices. Adjust estimates based on team experience level.

- **Format Validation**: ✅ All tasks follow checklist format with ID, [P]/[Story] labels, and file paths

---

## Notes

- [P] tasks = different files/services, no dependencies within phase
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- E2E tests included per specification requirements
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Performance targets: <100ms conversion, <200ms WCAG, 60fps sliders, <2s init
