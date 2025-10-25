# Implementation Plan: Project Management with Undo/Redo Functionality

**Branch**: `003-project-management` | **Date**: October 25, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-project-management/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Create a comprehensive project management system with subscription-based undo/redo functionality using Angular SPA architecture. Users can create and manage projects with configurable color properties (gamut and space), with default users limited to 1 project and subscription users having unlimited projects. The system tracks all modifications with subscription-aware undo/redo limits (5 vs 50 operations) and provides a dashboard-centered navigation experience.

## Technical Context

**Language/Version**: TypeScript/Angular (latest stable)
**Primary Dependencies**: Angular CDK, RxJS signals, Angular Router
**Storage**: PostgreSQL for both project persistence and complete undo/redo modification history
**Testing**: Playwright for E2E testing, Angular Testing Library for component tests
**Target Platform**: Web application (Angular SPA)
**Project Type**: Web application with frontend and backend components
**Performance Goals**: <500ms SPA navigation, <100ms project property changes, <30s project creation
**Constraints**: SPA architecture, subscription-based limits, dashboard-centered navigation
**Scale/Scope**: Multi-project management with unlimited projects for subscription users

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Core Principles Compliance:**

- ✅ Clean Code Excellence: TypeScript interfaces for project models, meaningful component names, single responsibility
- ✅ Simple User Experience: Dashboard-centered navigation, minimal clicks for project access, clear subscription limits
- ✅ Minimal Dependencies: Angular CDK for UI components, RxJS signals for state management
- ✅ Comprehensive E2E Testing: Playwright coverage for project creation, modification tracking, undo/redo scenarios
- ✅ Centralized State Store: Angular Signals + RxJS for project state and modification history
- ✅ PowerShell Command Execution: Commands target frontend/backend directory structure explicitly
- ✅ Frontend Component File Structure: Separate .ts/.html/.scss files for dashboard and project editor components
- ✅ Production Code Cleanliness: No debug statements, clean deployment ready

**Technology Stack Alignment:**

- ✅ Frontend: Angular (latest stable)
- ✅ Database: PostgreSQL for project and user subscription data
- ✅ Testing: Playwright for E2E, Angular Testing Library for components
- ✅ Build Tools: PowerShell 7+ cross-platform scripts with explicit directory targeting
- ✅ Repository Structure: frontend/, backend/, e2e/, docs/ organization

## Project Structure

### Documentation (this feature)

```text
specs/003-project-management/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── dashboard/
│   │   │   │   ├── dashboard.component.ts
│   │   │   │   ├── dashboard.component.html
│   │   │   │   └── dashboard.component.scss
│   │   │   ├── project-editor/
│   │   │   │   ├── project-editor.component.ts
│   │   │   │   ├── project-editor.component.html
│   │   │   │   └── project-editor.component.scss
│   │   │   ├── project-list/
│   │   │   │   ├── project-list.component.ts
│   │   │   │   ├── project-list.component.html
│   │   │   │   └── project-list.component.scss
│   │   │   └── undo-redo-controls/
│   │   │       ├── undo-redo-controls.component.ts
│   │   │       ├── undo-redo-controls.component.html
│   │   │       └── undo-redo-controls.component.scss
│   │   ├── services/
│   │   │   ├── project-management.service.ts
│   │   │   ├── project-history.service.ts
│   │   │   └── subscription-limit.service.ts
│   │   ├── models/
│   │   │   ├── project.model.ts
│   │   │   ├── project-modification.model.ts
│   │   │   └── subscription-tier.model.ts
│   │   ├── store/
│   │   │   └── project-state.store.ts
│   │   └── guards/
│   │       └── subscription-limit.guard.ts
│   └── tests/
│       ├── components/
│       ├── services/
│       └── integration/

backend/
├── src/
│   ├── models/
│   │   ├── project.model.ts
│   │   └── user-subscription.model.ts
│   ├── services/
│   │   └── project.service.ts
│   ├── api/
│   │   └── projects.controller.ts
│   └── migrations/
│       └── add-projects-table.sql
└── tests/

e2e/
├── tests/
│   ├── project-creation.spec.ts
│   ├── project-modification-tracking.spec.ts
│   ├── undo-redo-operations.spec.ts
│   └── dashboard-navigation.spec.ts
```

**Structure Decision**: Web application structure selected with separate frontend/backend architecture. Frontend uses Angular SPA with component-based architecture, while backend provides REST API for project persistence and user subscription management.

## Complexity Tracking

> **No violations identified - all requirements align with constitution principles**

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| None      | N/A        | N/A                                  |

## Subscription-Based Undo Operations Implementation

_Implementation details for User Story 3 - Subscription-Based Undo Operations (Priority: P3)_

### Core Requirements

- **Default users**: 5 undo/redo operations per project session
- **Subscription users**: 50 undo/redo operations per project session
- **Scope**: Per-project limits (each project has its own undo/redo history)
- **Storage**: PostgreSQL database (history persists across browser sessions)
- **Feedback**: Clear UI indicators when approaching/reaching limits

### Technical Implementation Strategy

**1. Command Pattern with Subscription Awareness**

```typescript
interface UndoRedoLimits {
  default: 5;
  premium: 50;
}

class UndoRedoService {
  private getMaxOperations(subscriptionType: SubscriptionType): number {
    return subscriptionType === "premium" ? 50 : 5;
  }

  executeCommand(command: Command): void {
    if (this.isLimitReached()) {
      this.showUpgradePrompt();
      return;
    }
    // Execute and track command
  }
}
```

**2. Server-Side History Management**

- **Database Storage**: All modifications stored in `project_modifications` table
- **Real-time Persistence**: Every change immediately saved to PostgreSQL
- **Auto-pruning**: Remove oldest operations when subscription limit exceeded
- **Cross-session Persistence**: History maintained across browser sessions
- **API Integration**: Frontend retrieves modification history via REST endpoints

**3. UI Feedback Implementation**

- **Progress Indicator**: Show "X of Y operations remaining"
- **Warning States**: Highlight controls when 1-2 operations remaining
- **Disabled States**: Disable undo/redo buttons when limit reached
- **Upgrade Prompts**: Modal/banner when attempting operation beyond limit

**4. Subscription Integration Points**

- **Service Injection**: UndoRedoService receives SubscriptionService
- **Real-time Updates**: Subscription changes update limits immediately
- **Upgrade Handling**: Clear upgrade path when limits reached

### Key Components & Services

**UndoRedoService**

- Tracks per-project command history in sessionStorage
- Enforces subscription-based operation limits
- Provides reactive signals for UI state updates
- Handles limit-exceeded scenarios with upgrade prompts

**SubscriptionService**

- Provides current subscription type and limits
- Notifies other services of subscription changes
- Handles upgrade flow integration

**UndoRedoControlsComponent**

- Visual undo/redo buttons with limit indicators
- Progress display showing remaining operations
- Upgrade prompt triggers for limit-exceeded scenarios

### Testing Strategy

- **Unit Tests**: Verify limit enforcement for both subscription types
- **E2E Tests**: Complete workflows hitting subscription limits
- **Edge Cases**: Session restoration, subscription upgrades mid-session
- **User Experience**: Upgrade flow from limit-exceeded state

## Implementation Phases

### Phase 0: Research ✅

- [x] Research Angular SPA patterns for project management
- [x] Investigate undo/redo implementation strategies
- [x] Define subscription limit enforcement approach
- [x] Research color gamut/space validation patterns

**Deliverables**: `research.md` - Technical decisions and implementation approach

### Phase 1: Data Model & Contracts ✅

- [x] Define Project entity and validation rules
- [x] Create ProjectModification tracking structure
- [x] Design API endpoints for project CRUD operations
- [x] Specify frontend service contracts

**Deliverables**: `data-model.md`, `contracts/api.md`, `contracts/frontend.md`

### Phase 2: Backend Implementation

- [ ] Implement Project model and validation
- [ ] Create projects API controller
- [ ] Add subscription limit checking
- [ ] Write unit tests for backend services
- [ ] Create database migration scripts

### Phase 3: Frontend Core Services

- [ ] Implement ProjectService with CRUD operations
- [ ] Create UndoRedoService with command pattern
- [ ] Build SubscriptionService for limit enforcement
- [ ] Add route guards for project access
- [ ] Write service unit tests

### Phase 4: Frontend Components

- [ ] Build ProjectListComponent
- [ ] Create ProjectFormComponent with validation
- [ ] Implement UndoRedoControlsComponent
- [ ] Update DashboardComponent with project management
- [ ] Add responsive styling and accessibility

### Phase 5: Integration & Testing

- [ ] Connect frontend to backend APIs
- [ ] Implement error handling and loading states
- [ ] Write E2E tests for complete workflows
- [ ] Test subscription limit enforcement
- [ ] Validate undo/redo persistence across sessions

### Phase 6: Polish & Documentation

- [ ] Add user guidance and tooltips
- [ ] Implement upgrade prompts for subscription limits
- [ ] Create user documentation
- [ ] Performance optimization and bundle analysis
- [ ] Final quality assurance testing

## Next Steps

The implementation plan is now complete with detailed research, data models, and API contracts defined.

**Ready to begin Phase 2: Backend Implementation**

Key implementation files to create:

1. Backend models and API endpoints
2. Frontend services with RxJS signals
3. Angular components with reactive forms
4. E2E test suites for complete workflows

All technical decisions have been documented and validated against the project constitution.
