<!--
Sync Impact Report:
Version change: 1.7.0 → 1.8.0
Modified principles: None
Added sections: VIII. Production Code Cleanliness principle
Removed sections: None
Templates requiring updates:
- ✅ .specify/templates/plan-template.md - updated with new principle compliance check
- ✅ .specify/templates/spec-template.md - no updates needed (principle doesn't affect user scenarios)
- ✅ .specify/templates/tasks-template.md - no updates needed (principle doesn't affect task organization)
- N/A .specify/templates/commands/*.md - directory does not exist yet
Follow-up TODOs: Ratification date needs to be set when formally adopted
-->

# Love OKLCH Project Constitution

## Core Principles

### I. Clean Code Excellence

The codebase MUST maintain exceptional quality through strict adherence to clean
code principles. This includes meaningful variable names, single responsibility
functions, comprehensive type safety with TypeScript, consistent formatting, and
thorough code reviews for all changes.

### II. Simple User Experience

The user interface MUST prioritize simplicity and intuitiveness above feature
complexity. Every UI interaction should be self-explanatory, require minimal
clicks to achieve goals, provide immediate visual feedback, and maintain
consistent design patterns throughout the application.

### III. Minimal Dependencies

The project MUST minimize external dependencies by preferring Angular CDK over
third-party UI libraries, using native browser APIs when feasible, limiting npm
packages to essential functionality only, and regularly auditing dependencies
for security and necessity.

### IV. Comprehensive End-to-End Testing

Every user scenario MUST be covered by automated end-to-end tests using
Playwright. This includes happy paths, error scenarios, edge cases,
cross-browser compatibility, and accessibility compliance testing. Playwright
MUST be configured for multi-browser testing (Chromium, Firefox, WebKit).

### V. Centralized State Store (Signals + RxJS)

The project MUST implement a centralized state store using Angular Signals for
local and global state, with RxJS for asynchronous effects and derived state.
Legacy state libraries (e.g., NgRx, Akita) MUST NOT be used.

### VI. PowerShell Command Execution

All PowerShell commands MUST use proper PowerShell syntax and explicitly specify
the target directory to ensure proper execution context. The repository
structure consists of three main folders: `frontend/`, `backend/`, and `e2e/`.

**Command Chaining Requirements:**

- MUST use semicolon (`;`) as command separator in PowerShell, NOT double ampersand (`&&`)
- Double ampersand (`&&`) is bash syntax and will cause parser errors in PowerShell
- Example CORRECT: `cd frontend; npm run build`
- Example INCORRECT: `cd frontend && npm run build`

**Directory Context Requirements:**

- Commands executed without proper directory specification will fail due to incorrect working directory context
- Always specify target directory before running commands: `cd frontend; npm start` or `Set-Location frontend; npm start`
- Use absolute paths when necessary to avoid navigation issues

This principle ensures reliable script execution, prevents path-related errors
during development and CI/CD operations, and maintains compatibility with the
PowerShell environment used in this project.

### VII. Frontend Component File Structure

Frontend components with more than 60 lines of code MUST be organized into
separate files for maintainability and readability. Each component MUST have at
least three files: TypeScript (.ts), HTML template (.html), and styles
(.scss or .css). This separation enforces the principle of separation of
concerns, improves code organization, and enables better collaboration between
developers working on different aspects of the same component. Inline templates
and styles are prohibited for components exceeding the 60-line threshold.

### VIII. Production Code Cleanliness

All debug console statements (console.log, console.warn, console.error,
console.info) MUST be removed before pushing code to any shared branch.
Production code MUST NOT contain debugging artifacts, temporary logging, or
development-only console output. The only exceptions are: (1) intentional
application logging for production monitoring, (2) critical error handling that
provides user value, and (3) accessibility announcements. This principle ensures
clean production deployments, prevents sensitive data leakage through console
output, maintains professional code quality, and avoids console noise that can
interfere with legitimate debugging efforts.

## Technology Stack and Constraints

- Frontend: Angular (latest stable)
- UI Components: Angular CDK
- State Management: Angular Signals + RxJS
- Color Operations: colorjs.io
- Data Visualization: D3.js for SVG drawings
- Database: PostgreSQL for saving works and user data
- Development Environment: PowerShell commands for build and deployment scripts
- All PowerShell scripts MUST be cross-platform compatible (PowerShell 7+)
- PowerShell commands MUST explicitly specify target directories (`cd frontend && npm start` or `Set-Location frontend; npm start`) due to the three-folder structure: `frontend/`, `backend/`, and `e2e/`
- Commands executed from the root directory without proper path specification WILL fail
- Database schema MUST support user authentication and work persistence
- Color operations MUST leverage OKLCH color space for perceptual uniformity
- SVG visualizations MUST be responsive and accessible
- State management MUST use Angular Signals pattern exclusively
- A container with data seed for 3 user types MUST be provided, and MUST be easy
  to use and refresh for development and testing purposes.
- Tailwind CSS MUST be used as the utility-first CSS framework for rapid,
  consistent, and maintainable UI styling. Tailwind integration MUST follow
  Angular's official support and best practices.
- E2E Testing: Playwright MUST be used for all end-to-end testing scenarios
  with multi-browser support (Chromium, Firefox, WebKit). Tests MUST cover user
  workflows, accessibility compliance, and cross-browser compatibility.
- Repository Structure: The Git repository MUST be organized into distinct
  folders: `frontend/` (Angular application), `backend/` (database operations,
  seed scripts, API services), `e2e/` (Playwright tests), and `docs/`
  (comprehensive project documentation). This structure ensures clear separation
  of concerns and easy navigation.

## Development Workflow

- All code changes MUST undergo code review for principle compliance
- E2E tests MUST be written for every new feature and scenario
- Dependency updates MUST be justified and reviewed
- PowerShell scripts MUST be used for all build, test, and deployment automation
- Documentation MUST be updated with every major change

## Governance

The constitution supersedes all other practices. Amendments require
documentation, approval, and a migration plan. All PRs/reviews must verify
compliance. Complexity must be justified. Use project documentation for runtime
development guidance.

- Amendment Process: Propose via GitHub issue with "constitution" label, 7-day
  review, maintainer consensus, version update, propagate changes
- Versioning: MAJOR for incompatible changes, MINOR for new principles/sections,
  PATCH for clarifications
- Compliance Review: Quarterly and after major releases
- Enforcement: All pull requests MUST be reviewed against these principles. Code
  violating principles will be rejected with guidance.

**Version**: 1.8.0 | **Ratified**: TODO(RATIFICATION_DATE): Set when formally
adopted | **Last Amended**: 2025-10-25
