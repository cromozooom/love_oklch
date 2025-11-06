# Feature Specification: Admin-Configurable Feature Access Control

**Feature Branch**: `004-feature-access-config`  
**Created**: November 6, 2025  
**Status**: Draft  
**Input**: User description: "I would like the feature access present in my app to be configurable. In my project I would like to give access to some features to some users. I have already implemented something that can deal with these things, it's just now I would like to be sure that: Admin user has access to a route where they can define these or a configuration that can be later transformed in UI."

## Clarifications

### Session 2025-11-06

- Q: Should setting a feature limit to 0 disable the feature entirely, or should the system reject 0 as invalid? → A: Reject 0 as invalid - require -1 for unlimited or positive integers only
- Q: When an admin reduces a limit and users already exceed the new limit, what should happen? → A: Preserve existing data, block new actions exceeding limit (grandfathering)
- Q: Should the system have hardcoded default fallback values when configuration is missing or corrupted? → A: Use last known good configuration from backup/audit log
- Q: When two admins edit the same feature configuration simultaneously, how should conflicts be resolved? → A: Optimistic locking with conflict notification (second admin warned, must review and resubmit)
- Q: When a new subscription plan is added to the system, what feature limits should it have by default? → A: Inherit from Free tier (most restrictive) as safe default

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Admin Configure Feature Limits (Priority: P1)

An administrator needs to configure and manage feature access limits for different subscription tiers without touching code. The admin can define limits for undo/redo operations, project counts, and advertisement visibility through an admin interface.

**Why this priority**: This is the core requirement - enabling admins to configure feature access without developer intervention. This provides immediate business value by allowing business users to adjust subscription offerings.

**Independent Test**: Admin can log in, navigate to feature configuration page, update the undo/redo limit for free users from 5 to 10, save changes, and verify that free users now have the new limit without any code deployment.

**Acceptance Scenarios**:

1. **Given** an admin user is authenticated, **When** they navigate to the admin feature configuration route, **Then** they see a list of all subscription tiers (subscribed, non-subscribed) with their current feature limits
2. **Given** an admin is viewing feature configurations, **When** they modify the undo/redo limit for non-subscribed users from 5 to 10 and save, **Then** the configuration is persisted to database and YAML file
3. **Given** an admin is editing feature limits, **When** they set a limit value to -1, **Then** the system interprets this as "unlimited" for that feature
4. **Given** an admin changes the project limit for subscribed users, **When** they save the configuration, **Then** existing subscribed users can create projects up to the new limit
5. **Given** an admin modifies advertisement visibility settings, **When** they toggle ads for a subscription tier, **Then** users in that tier immediately see or don't see advertisements accordingly

---

### User Story 2 - View Current Feature Access Configuration (Priority: P2)

Administrators need to view the current feature access configuration in a clear, organized format to understand what limits are applied to each subscription tier. This helps with auditing and decision-making about subscription offerings.

**Why this priority**: Viewing configuration is essential for managing it, but can be built after the core configuration structure exists. It supports informed decision-making.

**Independent Test**: Admin logs in, navigates to feature configuration page, and sees a table showing all subscription tiers with their feature limits (undo/redo operations, project limits, ad visibility) clearly displayed with units and unlimited indicators.

**Acceptance Scenarios**:

1. **Given** an admin accesses the feature configuration page, **When** the page loads, **Then** they see all subscription tiers displayed with their display names (e.g., "Subscribed User", "Non-Subscribed User (Free Tier)")
2. **Given** the configuration page is displayed, **When** viewing feature limits, **Then** numeric limits show their values with units (e.g., "5 operations", "1 projects")
3. **Given** the configuration shows unlimited features, **When** a feature has value -1, **Then** it displays as "Unlimited" or "∞" instead of "-1"
4. **Given** an admin views the configuration, **When** looking at boolean features (like advertisements), **Then** they see clear on/off indicators (e.g., "Visible" / "Hidden" or true/false)
5. **Given** multiple subscription tiers exist, **When** the admin views the configuration, **Then** tiers are ordered by priority (highest priority first)

---

### User Story 3 - Validate Feature Configuration Changes (Priority: P3)

The system must validate feature configuration changes to prevent invalid settings that could break the application or create poor user experiences. This includes preventing negative (non-unlimited) limits and ensuring data type consistency.

**Why this priority**: Validation prevents configuration errors but is less critical than the core configuration functionality. Can be implemented after basic configuration works.

**Independent Test**: Admin attempts to set project limit to -5 (invalid negative), system rejects with error "Invalid limit: use -1 for unlimited or positive numbers only." Admin then sets it to -1 (unlimited) and save succeeds.

**Acceptance Scenarios**:

1. **Given** an admin is editing numeric limits, **When** they enter a negative number other than -1, **Then** the system shows an error "Invalid limit: use -1 for unlimited or positive numbers only"
2. **Given** an admin is editing a boolean feature, **When** they enter a non-boolean value, **Then** the system shows an error "Invalid value: must be true or false"
3. **Given** an admin changes multiple features, **When** they save with invalid values in any field, **Then** the system prevents save and highlights all invalid fields
4. **Given** configuration changes are submitted, **When** the system validates them, **Then** it checks data types match the feature type definition (number, boolean, etc.)
5. **Given** an admin tries to save configuration, **When** required fields are empty, **Then** the system shows an error "All features must have a defined value"

---

### User Story 4 - Apply Feature Limits to Users in Real-Time (Priority: P4)

When administrators update feature access configuration, the changes should apply to users without requiring them to log out and back in. The system checks current limits when users attempt to use features.

**Why this priority**: Real-time application is a quality-of-life improvement but not critical for MVP. Initial version can require re-login or cache refresh.

**Independent Test**: While a non-subscribed user has 3 projects open in their browser, admin changes free tier limit from 1 to 5 projects. User refreshes their project list and can now create 5 total projects without logging out.

**Acceptance Scenarios**:

1. **Given** a user is actively using the application, **When** an admin changes feature limits for their subscription tier, **Then** the changes propagate to user sessions within 60 seconds (cache TTL expiration)
2. **Given** a non-subscribed user has performed 3 undo operations, **When** admin increases free tier undo limit from 5 to 10, **Then** the user can perform 7 more undos (10 total) without re-authenticating
3. **Given** a subscribed user with 2 projects, **When** admin reduces subscribed tier project limit from unlimited to 3, **Then** the user can still access their 2 existing projects but can only create 1 more
4. **Given** feature limits are cached, **When** an admin changes configuration, **Then** the cache is invalidated for all affected users
5. **Given** a user attempts a feature-limited action, **When** checking their entitlement, **Then** the system always queries the latest feature configuration from the database

---

**Implementation Note**: While labeled P4 (Priority 4), User Story 4 is implemented first as the MVP because it delivers the core business value (enforcing feature limits) AND provides the runtime enforcement infrastructure needed for E2E testing per the TDD requirement. Admin configuration features (US1-US3) can be added incrementally after the enforcement mechanism is working and tested.

---

### Edge Cases

- System MUST reject 0 as invalid for numeric feature limits - only -1 (unlimited) or positive integers are allowed
- When limits are reduced and users exceed new limits: existing data is preserved (grandfathered), but users cannot perform new actions that would further exceed the limit
- If configuration is deleted or corrupted, system MUST restore from last known good configuration in audit log/backup to maintain service continuity
- Concurrent admin edits MUST use optimistic locking: if configuration changed since admin started editing, system shows conflict notification requiring admin to review changes and resubmit
- New subscription tiers automatically inherit Free tier limits (5 undo/redo, 1 project, ads visible) as safe defaults until admin explicitly configures them
- If admin configures conflicting limits (e.g., free tier better than paid tier), system allows save but shows warning: "Warning: Free tier appears more generous than Basic tier" to help catch mistakes while allowing legitimate use cases (promotional periods, A/B testing)
- What if feature configuration format changes in a future update? (Migration strategy for YAML/JSON structure?)

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST provide an admin-only route/page for managing feature access configuration accessible only to users with admin role
- **FR-002**: System MUST store feature access configuration persistently in the database using the existing `features`, `plans`, and `plan_features` schema, with new plans automatically inheriting Free tier feature limits as safe defaults
- **FR-003**: System MUST support configuring undo/redo operation limits per subscription tier with numeric values (positive integers or -1 for unlimited)
- **FR-004**: System MUST support configuring maximum project count limits per subscription tier with numeric values (positive integers or -1 for unlimited)
- **FR-005**: System MUST support configuring advertisement visibility per subscription tier as a boolean (true = visible, false = hidden)
- **FR-006**: System MUST use -1 as the standard value to represent "unlimited" or "infinite" for numeric limits
- **FR-007**: System MUST display feature limits in human-readable format showing units (operations, projects) and "Unlimited" for -1 values
- **FR-008**: System MUST validate configuration changes before persisting (only positive integers or -1 for unlimited; zero is invalid; boolean values must be true/false)
- **FR-009**: System MUST organize configuration by subscription tier with clear tier names ("Subscribed User", "Non-Subscribed User (Free Tier)")
- **FR-010**: System MUST apply feature configuration limits when users attempt feature-limited actions (undo/redo, project creation, ad display)
- **FR-011**: System MUST check feature entitlements against current configuration stored in database, not cached values older than 60 seconds
- **FR-012**: Admin interface MUST allow editing feature limits through form inputs with appropriate controls (number inputs with min/max validation for numeric limits, toggle switches for boolean features, clear tier selection mechanism, real-time validation feedback) and implement optimistic locking to prevent concurrent edit conflicts
- **FR-013**: System MUST preserve existing user data (projects, modifications) when feature limits are reduced through grandfathering - users can keep existing data but cannot create new items that would exceed the new limit
- **FR-014**: System MUST log all configuration changes with admin user ID, timestamp, previous value, and new value for audit trail and disaster recovery (enabling restoration from last known good configuration if corruption occurs)
- **FR-015**: System MUST support the proposed YAML configuration format structure with roles, features, types, values, and units

### Key Entities

- **FeatureConfiguration**: Represents the configurable feature access settings per subscription tier (already exists as PlanFeature in schema)
  - Links subscription plans to features with specific limit values
  - Stores numeric limits (undo/redo operations, project count) and boolean flags (advertisement visibility)
  - Includes display metadata (feature names, units, descriptions)
  - Can be modified only by admin users
- **SubscriptionTier**: Represents user subscription levels that determine feature access (already exists as Plan in schema)

  - Defines the tier name and display name
  - Has priority ordering for display purposes
  - Associated with multiple feature configurations
  - Maps to Free (non-subscribed) and Pro/Basic (subscribed) plans

- **FeatureLimit**: Represents an individual feature constraint (already exists as Feature in schema)
  - Defines feature key name (redo_undo_limit, project_limit, advertisements_visible)
  - Specifies data type (number, boolean)
  - Stores default values and validation rules
  - Can be enabled/disabled per plan through PlanFeature

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Admin users can view and modify feature access configuration for all subscription tiers without developer assistance within 5 minutes of learning the interface
- **SC-002**: Configuration changes apply to user feature limits within 60 seconds of admin save action without requiring user re-authentication
- **SC-003**: System correctly enforces undo/redo operation limits based on subscription tier, preventing users from exceeding configured limits 100% of the time
- **SC-004**: System correctly enforces project creation limits based on subscription tier, preventing users from exceeding configured limits 100% of the time
- **SC-005**: Advertisement visibility correctly reflects configuration for each user's subscription tier with no display errors
- **SC-006**: Invalid configuration changes (negative non-unlimited values, wrong data types) are rejected with clear error messages before persistence
- **SC-007**: Admin can distinguish between limited and unlimited features through clear "Unlimited" or "∞" display indicators
- **SC-008**: Configuration changes are auditable with complete change history showing who changed what and when
- **SC-009**: The existing database schema (features, plans, plan_features tables) successfully supports the configuration requirements without schema changes
- **SC-010**: Users can perform actions up to their configured limits without performance degradation (limit checks complete in under 100ms)

## Assumptions _(optional)_

- The existing Prisma schema with `Feature`, `Plan`, `PlanFeature`, and `Subscription` models provides sufficient structure for storing feature configuration
- Admin authentication and authorization are already implemented (AdminRole model exists)
- The current subscription system distinguishes between subscribed and non-subscribed users
- Feature limit checks are performed server-side before allowing feature-limited actions
- The proposed YAML configuration format can be mapped to existing database schema without structural changes
- Advertisement rendering system exists and can be controlled via feature flag
- The application uses the existing three-tier plan structure: Free, Basic, and Pro (based on seed data in docs/SEED_DATA_REFERENCE.md)
- Free tier maps to "non-subscribed user", Basic and Pro map to "subscribed user" in the configuration
- Undo/redo operations are already tracked via ProjectModification model
- Project count limits can be enforced via query counting projects per user with isActive=true

## Dependencies _(optional)_

- **Existing Feature**: Subscription management system (User, Plan, Subscription models)
- **Existing Feature**: Feature entitlement system (Feature, PlanFeature models)
- **Existing Feature**: Admin role system (AdminRole model with role types)
- **Existing Feature**: Project management (Project model with user association)
- **Existing Feature**: Undo/redo tracking (ProjectModification model)
- **Existing Feature**: Authentication and authorization middleware for admin routes
- **Future Feature**: Advertisement display system (if not yet implemented, ads configuration will be dormant until ad system exists)

## Out of Scope _(optional)_

- Automatic notifications to users when their feature limits change
- Bulk configuration import/export functionality beyond the proposed YAML format
- Historical configuration versioning beyond audit log (no rollback UI)
- Per-user custom limits (overriding subscription tier defaults for individual users)
- Scheduled configuration changes (e.g., "increase limits next month")
- Configuration templates or presets for common subscription structures
- Multi-tenancy support (different configurations per organization/workspace)
- Feature usage analytics dashboard showing utilization against limits
- Grace period handling when reducing limits (e.g., 30-day buffer before enforcement)
- API for external systems to query or modify feature configuration

## Technical Constraints _(optional)_

- Configuration must use existing database schema (Feature, Plan, PlanFeature tables) without structural modifications
- The -1 convention for "unlimited" must be consistently applied across all numeric limit features
- Feature limit checks must complete within 100ms to avoid impacting user experience
- Admin interface must be accessible only to users with admin role (existing AdminRole model)
- Configuration changes must be atomic (all features for a tier update together or not at all)
- The system must support the three existing plan types: Free, Basic, Pro (from seed data)
- Advertisement visibility feature may need to wait for ad system implementation if not yet available

## Open Questions _(optional)_

- Should the admin interface be a dedicated page or integrated into existing admin dashboard? (Assume dedicated route for now: `/admin/feature-config`)
- Should configuration support custom feature names beyond the three specified (undo/redo, projects, ads)? (Assume extensible - admin can add features through database)
- What should default configuration values be if an admin clears all settings? (Assume fallback to Free tier defaults: 5 undo/redo, 1 project, ads visible)
- Should there be role-based admin permissions (some admins configure features, others only view)? (Assume single admin role has full access based on existing AdminRoleType)
