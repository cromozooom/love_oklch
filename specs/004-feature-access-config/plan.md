# Implementation Plan: Admin-Configurable Feature Access Control

**Branch**: `004-feature-access-config` | **Date**: November 6, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-feature-access-config/spec.md`

**User Requirements**:

- Backend-focused implementation
- Configuration via YAML/JSON file for initial feature access management
- Start with E2E tests first (test-driven development)

## Summary

Enable administrators to configure subscription-based feature access limits (undo/redo operations, project count, advertisement visibility) through a backend configuration file and optional admin UI. The system will use a YAML/JSON configuration file as the primary source of truth, which can be edited directly or through an admin interface. Implementation follows test-driven development starting with E2E tests, then backend services, with optional frontend admin UI in later phases.

**Technical Approach**:

1. Create YAML configuration file for feature access rules
2. Build backend service to read and apply configuration
3. Implement feature entitlement checking middleware
4. Add E2E tests to verify limit enforcement
5. (Optional) Create admin UI for configuration management

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js 20.x for backend, Angular 18.x for frontend)
**Primary Dependencies**:

- Backend: Express.js, Prisma ORM, js-yaml (YAML parsing), joi (validation)
- Frontend: Angular 18, Angular CDK, Angular Signals
  **Storage**: PostgreSQL (existing Feature, Plan, PlanFeature tables) + YAML configuration file
  **Testing**: Playwright (E2E), Jest (backend unit tests)
  **Target Platform**: Web application (backend API + optional admin frontend)
  **Project Type**: Web application (backend-focused with existing frontend integration)
  **Performance Goals**:
- Feature limit checks complete in <100ms (per spec SC-010)
- Configuration changes propagate within 60 seconds (per spec SC-002)
- Admin configuration updates in <5 minutes (per spec SC-001)
  **Constraints**:
- Must use existing database schema (Feature, Plan, PlanFeature) without structural changes (per spec)
- Configuration file must support YAML format (user requirement)
- -1 convention for unlimited limits must be consistently applied (per spec FR-006)
- Optimistic locking for concurrent admin edits (per clarifications)
- Grandfathering existing data when limits reduced (per clarifications)
  **Scale/Scope**:
- 3 subscription tiers (Free, Basic, Pro)
- 3 configurable features (undo/redo limits, project limits, ad visibility)
- Small-scale admin access (typically 1-3 administrators)
- Configuration changes infrequent (typically weekly/monthly)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Core Principles Compliance:**

- ✅ Clean Code Excellence: TypeScript with strict typing, meaningful service names, single responsibility pattern
- ✅ Simple User Experience: Configuration file editing is straightforward, optional admin UI will be intuitive
- ✅ Minimal Dependencies: Using js-yaml (essential for YAML parsing), joi (validation), existing Prisma setup
- ✅ Comprehensive E2E Testing: Starting with E2E tests first (per user requirement), Playwright coverage for limit enforcement
- ✅ Centralized State Store: Frontend (if implemented) will use Angular Signals for configuration state
- ✅ PowerShell Command Execution: All commands will specify target directories (cd backend; npm run test)
- ✅ Frontend Component File Structure: Admin UI components (if added) will follow separate .ts/.html/.scss structure
- ✅ Production Code Cleanliness: No debug console statements in production, proper logging through backend services

**Technology Stack Alignment:**

- ✅ Frontend: Angular 18 (if admin UI phase implemented)
- ✅ Database: PostgreSQL with existing Prisma schema (no changes required)
- ✅ Testing: Playwright for E2E tests (starting point per user requirement), Jest for backend unit tests
- ✅ Build Tools: PowerShell 7+ scripts with explicit directory targeting
- ✅ Repository Structure: Follows frontend/, backend/, e2e/, docs/ organization

**Notes**: No constitution violations. Backend-focused approach with YAML configuration aligns with all principles. E2E-first testing strategy supports comprehensive test coverage principle.

## Project Structure

### Documentation (this feature)

```text
specs/004-feature-access-config/
├── plan.md              # This file
├── research.md          # Phase 0 output (dependency patterns, YAML best practices)
├── data-model.md        # Phase 1 output (Feature configuration entities)
├── quickstart.md        # Phase 1 output (How to configure features)
├── contracts/           # Phase 1 output (API contracts for feature checking)
│   ├── feature-config-api.yaml     # OpenAPI spec for configuration endpoints
│   └── entitlement-check-api.yaml  # OpenAPI spec for limit checking
└── tasks.md             # Phase 2 output (NOT created by this command)
```

### Source Code (repository root)

```text
backend/
├── config/
│   └── feature-access.yaml          # Primary configuration file for feature limits
├── src/
│   ├── types/
│   │   └── feature-config.types.ts  # TypeScript interfaces and type definitions
│   ├── services/
│   │   ├── feature-config.service.ts       # Load and manage YAML configuration
│   │   ├── entitlement-check.service.ts    # Check user feature limits
│   │   └── config-sync.service.ts          # Sync YAML to database
│   ├── middleware/
│   │   └── entitlement.middleware.ts       # Express middleware for limit checking
│   ├── controllers/
│   │   └── feature-config.controller.ts    # API endpoints for configuration (optional admin UI support)
│   └── validators/
│       └── feature-config.validator.ts     # Joi schemas for config validation
└── tests/
    └── unit/
        ├── feature-config.service.spec.ts
        └── entitlement-check.service.spec.ts

e2e/
└── tests/
    ├── feature-access-limits.spec.ts        # E2E tests for limit enforcement
    ├── feature-config-updates.spec.ts       # E2E tests for configuration changes
    └── grandfathering.spec.ts               # E2E tests for limit reduction scenarios

frontend/ (Optional Phase 3)
└── src/app/admin/
    ├── components/
    │   ├── feature-config-list/
    │   │   ├── feature-config-list.component.ts
    │   │   ├── feature-config-list.component.html
    │   │   └── feature-config-list.component.scss
    │   └── feature-config-editor/
    │       ├── feature-config-editor.component.ts
    │       ├── feature-config-editor.component.html
    │       └── feature-config-editor.component.scss
    └── services/
        └── feature-config-admin.service.ts
```

**Structure Decision**: Web application structure selected. Backend-focused implementation with YAML configuration file as primary interface. E2E tests created first per user requirement. Optional admin UI components in frontend deferred to later phase. Configuration file location: `backend/config/feature-access.yaml` for easy access and version control.

---

## Phase 1 Planning Deliverables

### ✅ Completed Documentation

1. **plan.md** (this file): Technical implementation plan with constitution compliance
2. **research.md**: 8 technical decisions researched and documented:

   - YAML management with js-yaml library
   - Validation strategy with joi schemas
   - Database-YAML sync pattern (YAML as source of truth)
   - In-memory caching for <100ms performance
   - Optimistic locking for concurrent edits
   - Grandfathering pattern for limit reductions
   - Audit log disaster recovery
   - E2E test strategy with Playwright

3. **data-model.md**: Complete data model documentation:

   - YAML configuration file format with all tiers and features
   - TypeScript interfaces (8 interfaces defined)
   - Existing Prisma schema (no changes required)
   - Validation rules (-1 unlimited, 0 invalid, positive limits)
   - State transition flows (sync, entitlement check, grandfathering)
   - Performance estimates and data volume analysis

4. **contracts/entitlement-check-api.yaml**: OpenAPI 3.0 specification for runtime permission checking:

   - POST /api/entitlements/check (check if action allowed)
   - GET /api/entitlements/{featureKey}/limit (get user's current limit)
   - Examples for unlimited, within-limit, at-limit, and grandfathered scenarios

5. **contracts/feature-config-api.yaml**: OpenAPI 3.0 specification for admin configuration management:

   - GET /api/admin/feature-config (retrieve configuration)
   - PUT /api/admin/feature-config (update with optimistic locking)
   - POST /api/admin/feature-config/reload (hot reload from YAML)
   - GET /api/admin/feature-config/audit-log (change history)

6. **quickstart.md**: Comprehensive configuration guide for developers/admins:
   - YAML file structure explanation
   - Validation rules and common pitfalls
   - Configuration change workflows (restart, API reload)
   - Grandfathering behavior examples
   - Troubleshooting common issues
   - Testing workflows with seeded users
   - Configuration management best practices

### Updated Project Context

- **Copilot instructions updated**: Added TypeScript 5.x (Node.js 20.x, Angular 18.x) to agent context
- **Technologies registered**: js-yaml, joi validation, YAML configuration

---

## Next Steps

### Phase 2: Task Generation (Separate Command)

**Command**: `/speckit.tasks`

This will generate `tasks.md` with granular implementation tasks broken down from the 4 user stories in spec.md:

**Expected Task Breakdown**:

1. **P1 - Admin Configure Feature Limits via YAML**:

   - T001: Create feature-access.yaml configuration file with seed data
   - T002: Implement YAML loader service with joi validation
   - T003: Implement database sync service (YAML → Plan/Feature tables)
   - T004: Add startup hook to load and sync configuration
   - T005: Write unit tests for YAML parsing and validation

2. **P2 - Admin View Current Configuration**:

   - T006: Implement GET /api/admin/feature-config endpoint
   - T007: Add authentication and admin role checking middleware
   - T008: Write E2E test for configuration retrieval

3. **P3 - Validate Configuration on Save**:

   - T009: Implement PUT /api/admin/feature-config endpoint with optimistic locking
   - T010: Implement POST /api/admin/feature-config/reload endpoint
   - T011: Add audit logging for configuration changes
   - T012: Write E2E test for configuration updates and conflict detection

4. **P4 - Apply Configuration Changes in Real-Time**:

   - T013: Implement entitlement checking service with in-memory cache
   - T014: Implement POST /api/entitlements/check endpoint
   - T015: Implement GET /api/entitlements/{featureKey}/limit endpoint
   - T016: Add entitlement middleware for protected endpoints
   - T017: Write E2E tests for undo/redo limit enforcement
   - T018: Write E2E tests for project limit enforcement
   - T019: Write E2E tests for grandfathering behavior
   - T020: Performance testing (<100ms checks, cache hit ratio)

5. **Optional P3 - Admin UI** (deferred to later iteration):
   - T021: Create feature-config-list component
   - T022: Create feature-config-editor component with form validation
   - T023: Implement conflict detection and retry UI flow

### Implementation Order (Test-Driven)

Per user requirement "start everything with a e2e test":

1. **Write E2E test first**: Free user creates 2 projects (expect second to fail)
2. **Implement minimum backend**: YAML loader → entitlement service → check endpoint
3. **Run test**: Should pass
4. **Repeat** for all scenarios (undo limits, ad visibility, grandfathering)

### Ready for Implementation

All planning documentation is complete. The specification provides:

- ✅ Clear user stories with acceptance criteria
- ✅ Technical decisions researched and documented
- ✅ Data model and configuration format defined
- ✅ API contracts specified with examples
- ✅ Developer quickstart guide created
- ✅ Constitution compliance verified
- ✅ Test strategy documented (E2E-first with seeded users)

**Proceed with**: Run `/speckit.tasks` to generate granular implementation tasks.

## Complexity Tracking

> **No violations to justify - all constitution checks pass**

This feature introduces no architectural complexity violations. The YAML configuration file approach is simpler than building a full admin UI initially, aligning with the "Simple User Experience" principle. Backend services follow clean code patterns with single responsibility. E2E-first testing approach supports comprehensive test coverage.
