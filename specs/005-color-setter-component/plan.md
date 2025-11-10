# Implementation Plan: Color Setter Component

**Branch**: `005-color-setter-component` | **Date**: November 6, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-color-setter-component/spec.md`

## Summary

The Color Setter Component provides a unified interface for selecting, viewing, and analyzing colors across multiple color spaces (HEX, RGB, HSL, LCH, OKLCH, LAB) with real-time WCAG accessibility compliance checking and gamut limit visualization. The component maintains color accuracy through internal high-fidelity representation (OKLCH), supports gamut-aware slider visualization, and provides comprehensive contrast ratio analysis for AA/AAA compliance levels.

**Color Library**: This component uses [colorjs.io](https://colorjs.io/) as the core color manipulation library. Color.js provides robust support for modern color spaces (OKLCH, LCH, LAB), accurate color conversions, gamut checking, and Delta-E calculations - all essential for maintaining color fidelity across format conversions and providing gamut-aware visualizations.

## Technical Context

**Language/Version**: TypeScript 5.x with Angular 18.x  
**Primary Dependencies**: [colorjs.io](https://colorjs.io/) (color space conversions, gamut checking, Delta-E), Angular CDK (UI primitives)  
**Storage**: Component state only (no persistence - standalone component)  
**Testing**: Playwright for E2E testing, Jasmine/Karma for unit tests  
**Target Platform**: Web browsers (Chrome, Firefox, Safari via Angular browser support)
**Project Type**: Web application - Angular component library  
**Performance Goals**: <100ms color conversion, <200ms WCAG calculation, 60fps slider interactions  
**Constraints**: <2 seconds component initialization, maintain 99% color accuracy across format conversions  
**Scale/Scope**: Single reusable component, 6 color formats, 3 gamut profiles, ~150 color names

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Core Principles Compliance:**

- ✅ Clean Code Excellence: TypeScript with strict types, meaningful names (ColorState, GamutProfile), single responsibility services
- ✅ Simple User Experience: Intuitive sliders with visual gamut feedback, format switching without data loss, real-time preview
- ✅ Minimal Dependencies: colorjs.io (essential for color operations), Angular CDK for slider primitives only
- ✅ Comprehensive E2E Testing: Playwright tests for all 3 user stories, format conversions, gamut warnings, WCAG calculations
- ✅ Centralized State Store: Angular Signals for component state (color value, format, gamut), RxJS for async color calculations
- ✅ PowerShell Command Execution: Build/test commands target `frontend/` directory explicitly
- ✅ Frontend Component File Structure: Component will exceed 60 lines - separate .ts/.html/.scss files required
- ✅ Production Code Cleanliness: No console.log in production, only error handling for invalid color inputs

**Technology Stack Alignment:**

- ✅ Frontend: Angular 18.x (latest stable) with standalone component architecture
- ✅ Database: N/A (component state only, no persistence)
- ✅ Testing: Playwright for E2E with multi-browser support (Chromium, Firefox, WebKit)
- ✅ Build Tools: PowerShell 7+ scripts with explicit `cd frontend;` directory targeting
- ✅ Repository Structure: Component in `frontend/src/app/components/color-setter/`, tests in `e2e/specs/color-setter.spec.ts`

**Additional Stack Requirements:**

- ✅ Color Operations: colorjs.io for OKLCH/LCH/LAB conversions and gamut checking
- ✅ State Management: Angular Signals for reactive state, no NgRx/Akita
- ✅ Styling: Tailwind CSS for utility-first styling, responsive design
- ✅ Accessibility: WCAG AA/AAA contrast calculation, keyboard navigation support

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
frontend/src/app/components/color-setter/
├── color-setter.component.ts       # Main component logic, state management
├── color-setter.component.html     # Template with format-specific UIs
├── color-setter.component.scss     # Tailwind + custom styles
├── services/
│   ├── color-conversion.service.ts # colorjs.io integration, format conversions
│   ├── color-naming.service.ts     # ~150 color names, nearest-match algorithm
│   ├── gamut-check.service.ts      # Gamut boundary detection, warnings
│   └── wcag-contrast.service.ts    # AA/AAA contrast calculations
├── models/
│   ├── color-state.model.ts        # ColorState interface (OKLCH internal representation)
│   ├── format-config.model.ts      # Format definitions, validation rules
│   └── gamut-profile.model.ts      # sRGB, Display P3, Unlimited definitions
└── utils/
    ├── color-validators.ts          # Input validation, clamping logic
    └── slider-gradient-generator.ts # Dynamic gradient generation for gamut visualization

e2e/specs/color-setter/
├── basic-color-selection.spec.ts    # US1: HEX/RGB/HSL formats
├── accessibility-compliance.spec.ts # US2: WCAG contrast checks
└── advanced-color-spaces.spec.ts    # US3: LCH/OKLCH/LAB + gamut warnings

frontend/src/app/components/color-setter/__tests__/
├── color-conversion.service.spec.ts
├── color-naming.service.spec.ts
├── gamut-check.service.spec.ts
└── wcag-contrast.service.spec.ts
```

│ └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)

api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]

```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |
```
