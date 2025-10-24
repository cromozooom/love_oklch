<!--
Sync Impact Report:
Version change: 1.1.0 → 1.2.0
Modified principles: None
Added sections: Data seed container constraint
Removed sections: None
Templates requiring updates:
- ⚠ .specify/templates/plan-template.md - pending review for constitution alignment
- ⚠ .specify/templates/spec-template.md - pending review for scope/requirements alignment
- ⚠ .specify/templates/tasks-template.md - pending review for task categorization alignment
- ⚠ .specify/templates/commands/*.md - pending review for outdated references
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

Every user scenario MUST be covered by automated end-to-end tests. This includes
happy paths, error scenarios, edge cases, cross-browser compatibility, and
accessibility compliance testing.

### V. Centralized State Store (Signals + RxJS)

The project MUST implement a centralized state store using Angular Signals for
local and global state, with RxJS for asynchronous effects and derived state.
Legacy state libraries (e.g., NgRx, Akita) MUST NOT be used.

## Technology Stack and Constraints

- Frontend: Angular (latest stable)
- UI Components: Angular CDK
- State Management: Angular Signals + RxJS
- Color Operations: colorjs.io
- Data Visualization: D3.js for SVG drawings
- Database: PostgreSQL for saving works and user data
- Development Environment: PowerShell commands for build and deployment scripts
- All PowerShell scripts MUST be cross-platform compatible (PowerShell 7+)
- Database schema MUST support user authentication and work persistence
- Color operations MUST leverage OKLCH color space for perceptual uniformity
- SVG visualizations MUST be responsive and accessible
- State management MUST use Angular Signals pattern exclusively
- A container with data seed for 3 user types MUST be provided, and MUST be easy
  to use and refresh for development and testing purposes.

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

**Version**: 1.2.0 | **Ratified**: TODO(RATIFICATION_DATE): Set when formally
adopted | **Last Amended**: 2025-10-24
