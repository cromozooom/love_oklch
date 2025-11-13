# Implementation Plan: Theme Switching

**Branch**: `001-theme-switching` | **Date**: November 10, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-theme-switching/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement a theme switching service for authenticated users (Admin and subscribers) with three modes: Light, Dark, and System. The service uses Angular Signals for state management, CSS `prefers-color-scheme` media query with JavaScript `matchMedia()` API for OS theme detection, and localStorage for persistence. Theme switching is restricted to authenticated users and provides immediate visual feedback without animations.

## Technical Context

**Language/Version**: TypeScript 5.x with Angular 18.x  
**Primary Dependencies**: Angular CDK, Angular Signals, RxJS, CSS `prefers-color-scheme` media query  
**Storage**: Browser localStorage for theme preference persistence  
**Testing**: Playwright for E2E testing, Angular testing utilities for unit tests  
**Target Platform**: Web browsers supporting CSS `prefers-color-scheme` and JavaScript `matchMedia()` API  
**Project Type**: Web application (Angular frontend)  
**Performance Goals**: <1 second theme switching response, <2 seconds OS theme detection response  
**Constraints**: Authenticated users only, graceful degradation for unsupported browsers, no complex animations  
**Scale/Scope**: Frontend service affecting all authenticated user sessions, cross-component functionality

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Core Principles Compliance:**

- ✅ Clean Code Excellence: Strong TypeScript types for theme enums, meaningful service/component names, single responsibility theme service
- ✅ Simple User Experience: Three clear theme buttons, immediate visual feedback, consistent UI patterns
- ✅ Minimal Dependencies: Uses native CSS `prefers-color-scheme` and JavaScript `matchMedia()`, no third-party theme libraries
- ✅ Comprehensive E2E Testing: Playwright tests for all theme scenarios, authenticated/unauthenticated states, browser compatibility
- ✅ Centralized State Store: Angular Signals for theme state management, RxJS for OS theme change listeners
- ✅ PowerShell Command Execution: Development commands will target frontend/ directory explicitly
- ✅ Frontend Component File Structure: Theme service and components will use separate .ts/.html/.scss files
- ✅ Production Code Cleanliness: No debug console statements, clean theme switching implementation

**Technology Stack Alignment:**

- ✅ Frontend: Angular 18.x (latest stable)
- N/A Database: Feature uses localStorage only, no database operations required
- ✅ Testing: Playwright for E2E theme switching scenarios, multi-browser support
- ✅ Build Tools: PowerShell commands will specify frontend/ directory context
- ✅ Repository Structure: Implementation in frontend/ with tests in e2e/

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

<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
frontend/
├── src/
│   ├── app/
│   │   ├── services/
│   │   │   └── theme.service.ts
│   │   ├── components/
│   │   │   ├── dashboard/
│   │   │   │   ├── dashboard.component.ts
│   │   │   │   ├── dashboard.component.html
│   │   │   │   └── dashboard.component.scss
│   │   │   └── theme-switcher/
│   │   │       ├── theme-switcher.component.ts
│   │   │       ├── theme-switcher.component.html
│   │   │       └── theme-switcher.component.scss
│   │   ├── models/
│   │   │   └── theme.models.ts
│   │   └── guards/
│   │       └── auth.guard.ts (existing)
│   └── styles/
│       ├── themes/
│       │   ├── light-theme.scss
│       │   ├── dark-theme.scss
│       │   └── theme-variables.scss
│       └── globals.scss

e2e/
├── tests/
│   └── theme-switching/
│       ├── theme-switching-auth.spec.ts
│       ├── theme-switching-unauth.spec.ts
│       ├── system-theme-detection.spec.ts
│       └── browser-compatibility.spec.ts
└── fixtures/
    └── theme-test-data.ts
```

**Structure Decision**: Web application structure with frontend-focused implementation. Theme service and components in frontend/src/app/, with comprehensive E2E tests in e2e/tests/. No backend changes required as feature uses localStorage for persistence.

## Phase 0: Research Complete ✅

**Research Findings**: All technical decisions documented in [research.md](./research.md)

- Angular Signals for reactive theme state management
- CSS custom properties with data attributes for theme implementation
- localStorage with graceful degradation for persistence
- `matchMedia()` API for system theme detection
- Existing AuthService integration for user access control
- Separate ThemeSwitcherComponent for cross-component reusability

## Phase 1: Design Complete ✅

**Artifacts Generated**:

- ✅ [data-model.md](./data-model.md) - Theme entities, storage schema, integration points
- ✅ [contracts/theme-service.md](./contracts/theme-service.md) - Service API, component interfaces, storage contracts
- ✅ [quickstart.md](./quickstart.md) - Developer implementation guide and testing strategy
- ✅ Updated agent context with theme switching technology stack

**Constitution Re-Check (Post-Design)**:

- ✅ Clean Code Excellence: Strong TypeScript interfaces and enums defined
- ✅ Simple User Experience: Three-button design with clear visual indicators
- ✅ Minimal Dependencies: Uses native browser APIs, no additional packages
- ✅ Comprehensive E2E Testing: Complete Playwright test strategy defined
- ✅ Centralized State Store: Angular Signals architecture documented
- ✅ PowerShell Command Execution: Frontend-focused commands specified
- ✅ Frontend Component File Structure: Component separation strategy defined
- ✅ Production Code Cleanliness: Error handling and logging strategy documented

## Complexity Tracking

> No constitution violations identified. Implementation follows all established principles.
