# Research: Admin-Configurable Feature Access Control

**Date**: November 6, 2025
**Feature**: Admin-Configurable Feature Access Control

## Research Tasks

### 1. YAML Configuration Management in Node.js

**Decision**: Use `js-yaml` library for YAML parsing and validation

**Rationale**:

- Industry-standard library with 8M+ weekly downloads
- Type-safe parsing with TypeScript support
- Supports schema validation
- Allows comments in YAML files (useful for configuration documentation)
- Can serialize back to YAML for programmatic updates

**Alternatives Considered**:

- `yaml` (newer library): Less mature, smaller ecosystem
- JSON-only approach: Less human-readable, no comments support
- TOML format: Less familiar to developers, weaker TypeScript support

**Implementation Pattern**:

```typescript
import yaml from "js-yaml";
import { readFileSync } from "fs";

interface FeatureConfig {
  subscribed_user: TierConfig;
  non_subscribed_user: TierConfig;
}

const config = yaml.load(readFileSync("config/feature-access.yaml", "utf8")) as FeatureConfig;
```

### 2. Configuration Validation Strategy

**Decision**: Use `joi` for runtime validation with TypeScript interfaces

**Rationale**:

- Robust validation library with excellent TypeScript support
- Provides clear error messages for invalid configurations
- Supports complex validation rules (e.g., -1 or positive integers only)
- Can validate at startup and on configuration reload
- Integrates well with Express.js error handling

**Alternatives Considered**:

- `zod`: TypeScript-first but heavier runtime cost
- Manual validation: Error-prone, harder to maintain
- JSON Schema: Less ergonomic in TypeScript context

**Implementation Pattern**:

```typescript
import Joi from "joi";

const featureLimitSchema = Joi.number()
  .integer()
  .custom((value, helpers) => {
    if (value === -1 || value > 0) return value;
    return helpers.error("any.invalid");
  }, "unlimited or positive check");

const tierConfigSchema = Joi.object({
  redo_undo_limit: featureLimitSchema.required(),
  project_limit: featureLimitSchema.required(),
  advertisements_visible: Joi.boolean().required(),
});
```

### 3. Database-YAML Synchronization Pattern

**Decision**: YAML as source of truth, sync to database on startup and reload

**Rationale**:

- YAML file version-controlled, easy to review changes in Git
- Database provides fast runtime queries for entitlement checks
- Sync on application startup ensures consistency
- Admin can edit YAML directly or trigger reload via API endpoint
- Audit log in database tracks when YAML changes were applied

**Alternatives Considered**:

- Database as source of truth: Harder to version control, requires migration scripts
- Dual source: Risk of inconsistency, complex synchronization logic
- YAML-only: Too slow for runtime queries (100ms requirement)

**Implementation Strategy**:

1. Load YAML on application startup
2. Validate configuration structure
3. Compare with existing PlanFeature records
4. Update database if changes detected
5. Log synchronization to audit trail
6. Cache parsed config in memory (60-second TTL per spec)

### 4. Entitlement Checking Performance

**Decision**: In-memory cache with database fallback and 60-second TTL

**Rationale**:

- Meets <100ms performance requirement (spec SC-010)
- In-memory lookups are <1ms typically
- 60-second cache TTL ensures changes propagate per spec (SC-002)
- Falls back to database if cache miss
- Simple cache invalidation on configuration updates

**Alternatives Considered**:

- Redis cache: Adds dependency, overkill for small config dataset
- Database-only: May not meet 100ms requirement under load
- No cache: Violates performance constraint

**Implementation Pattern**:

```typescript
class EntitlementCache {
  private cache = new Map<string, CachedLimit>();
  private TTL = 60000; // 60 seconds

  async getLimit(userId: string, feature: string): Promise<number | boolean> {
    const cacheKey = `${userId}:${feature}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.value;
    }

    // Cache miss or expired - query database
    const limit = await this.queryDatabase(userId, feature);
    this.cache.set(cacheKey, { value: limit, timestamp: Date.now() });
    return limit;
  }
}
```

### 5. Optimistic Locking for Concurrent Edits

**Decision**: Use Prisma's version field with transaction handling

**Rationale**:

- Prisma supports optimistic locking via `@@map("version")` or updatedAt checks
- Prevents silent data loss from concurrent admin edits (per clarifications)
- Returns clear error when conflict detected
- Admin UI can show diff and allow re-submission
- Standard pattern in database-backed systems

**Alternatives Considered**:

- Pessimistic locking: Blocks other admins unnecessarily
- Last-write-wins: Risks silent data loss (rejected per clarifications)
- File-based locking: Complex for YAML file updates

**Implementation Pattern**:

```typescript
try {
  await prisma.planFeature.update({
    where: { id: featureId, updatedAt: lastKnownUpdate },
    data: { value: newValue },
  });
} catch (error) {
  if (error.code === "P2025") {
    throw new ConflictError("Configuration changed by another admin");
  }
  throw error;
}
```

### 6. Grandfathering Pattern for Limit Reductions

**Decision**: Check current usage count vs new limit, allow view but block creates

**Rationale**:

- Respects existing user data (per clarifications)
- Clear user experience: "You have 5 projects but limit is now 3. Delete 2 to create new."
- No data loss from admin configuration changes
- Aligns with industry best practices (AWS, Stripe do this)

**Alternatives Considered**:

- Force delete excess data: User-hostile, data loss risk
- Temporary grace period: Adds complexity, unclear UX
- Lock account: Too restrictive, prevents other features

**Implementation Pattern**:

```typescript
async canCreateProject(userId: string): Promise<boolean> {
  const limit = await this.getProjectLimit(userId);
  if (limit === -1) return true; // Unlimited

  const currentCount = await prisma.project.count({
    where: { userId, isActive: true }
  });

  return currentCount < limit; // Block if at or over limit
}
```

### 7. Configuration Corruption Recovery

**Decision**: Store last known good config in audit log with restore function

**Rationale**:

- Per clarifications, restore from backup/audit log on corruption
- Audit log already tracks all config changes (FR-014)
- Can restore to previous version quickly
- No additional backup infrastructure needed

**Implementation Strategy**:

1. Every config update logged with full state snapshot
2. Corruption detected via validation failure
3. Query audit log for last valid configuration
4. Restore database to that state
5. Optionally restore YAML file from audit log entry

### 8. E2E Test Strategy for Limit Enforcement

**Decision**: Playwright tests using seeded test users with different subscription tiers

**Rationale**:

- Existing seed data has Free, Basic, Pro users (per docs/SEED_DATA_REFERENCE.md)
- Can test limit enforcement end-to-end
- Tests actual user experience, not just API contracts
- Covers authentication, database queries, UI feedback

**Test Scenarios**:

1. Free user attempts 6th undo (should block, show "limit reached")
2. Pro user performs 100 undos (should all succeed)
3. Admin changes limit, user sees new limit without re-login
4. User with 5 projects has limit reduced to 3 (can view all 5, cannot create 6th)
5. Configuration file validation error blocks application startup

**Implementation Pattern**:

```typescript
test("free user cannot exceed undo limit", async ({ page }) => {
  await page.goto("/login");
  await login(page, "free.user@example.com", "password123");

  const project = await createTestProject(page);

  // Perform 5 undos (limit for free tier)
  for (let i = 0; i < 5; i++) {
    await page.click('[data-testid="undo-button"]');
  }

  // 6th undo should be disabled
  await expect(page.locator('[data-testid="undo-button"]')).toBeDisabled();
  await expect(page.locator('[data-testid="limit-message"]')).toContainText("Undo limit reached");
});
```

## Summary

All technical decisions support the backend-focused, E2E-first approach:

- YAML configuration is simple and version-controllable
- Joi validation ensures configuration correctness
- Database synchronization provides fast runtime queries
- In-memory caching meets performance requirements
- Optimistic locking prevents concurrent edit conflicts
- Grandfathering preserves user data on limit reductions
- Audit log enables disaster recovery
- E2E tests verify complete user experience

No additional research needed - all unknowns resolved.
