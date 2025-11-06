# Data Model: Admin-Configurable Feature Access Control

**Date**: November 6, 2025
**Feature**: Admin-Configurable Feature Access Control

## Overview

This feature leverages the existing Prisma schema (Feature, Plan, PlanFeature, Subscription models) without requiring structural changes. A YAML configuration file serves as the source of truth, synchronized to the database on startup for fast runtime queries.

## Configuration File Format

**Location**: `backend/config/feature-access.yaml`

```yaml
feature_access_control:
  description: "Defines feature limits and access levels based on user subscription status."

  roles:
    # Free Tier (Non-Subscribed)
    non_subscribed_user:
      display_name: "Free Tier"
      priority: 3
      plan_slug: "free"
      features:
        redo_undo_limit:
          display_name: "Undo/Redo Operations Limit"
          type: "number"
          value: 5
          unit: "operations"
        project_limit:
          display_name: "Maximum Projects Allowed"
          type: "number"
          value: 1
          unit: "projects"
        advertisements_visible:
          display_name: "Advertisements Visibility"
          type: "boolean"
          value: true # ads ARE visible

    # Basic Tier (Subscribed)
    basic_user:
      display_name: "Basic Subscription"
      priority: 2
      plan_slug: "basic"
      features:
        redo_undo_limit:
          display_name: "Undo/Redo Operations Limit"
          type: "number"
          value: 50
          unit: "operations"
        project_limit:
          display_name: "Maximum Projects Allowed"
          type: "number"
          value: 10
          unit: "projects"
        advertisements_visible:
          display_name: "Advertisements Visibility"
          type: "boolean"
          value: false # NO ads

    # Pro Tier (Subscribed)
    pro_user:
      display_name: "Pro Subscription"
      priority: 1
      plan_slug: "pro"
      features:
        redo_undo_limit:
          display_name: "Undo/Redo Operations Limit"
          type: "number"
          value: -1 # -1 means unlimited
          unit: "operations"
        project_limit:
          display_name: "Maximum Projects Allowed"
          type: "number"
          value: -1 # -1 means unlimited
          unit: "projects"
        advertisements_visible:
          display_name: "Advertisements Visibility"
          type: "boolean"
          value: false # NO ads
```

## TypeScript Interfaces

### Configuration Models

```typescript
/**
 * Feature configuration value types
 */
type FeatureValueType = "number" | "boolean" | "string";

/**
 * Individual feature definition within a tier
 */
interface FeatureDefinition {
  display_name: string;
  type: FeatureValueType;
  value: number | boolean | string; // -1 for unlimited numeric limits
  unit?: string; // e.g., "operations", "projects"
}

/**
 * Subscription tier configuration
 */
interface TierConfig {
  display_name: string;
  priority: number; // Lower number = higher priority (1 = highest)
  plan_slug: string; // Maps to Plan.slug in database
  features: {
    redo_undo_limit: FeatureDefinition;
    project_limit: FeatureDefinition;
    advertisements_visible: FeatureDefinition;
  };
}

/**
 * Root configuration object
 */
interface FeatureAccessConfig {
  feature_access_control: {
    description: string;
    roles: {
      [tierKey: string]: TierConfig;
    };
  };
}
```

### Runtime Models

```typescript
/**
 * Cached entitlement result
 */
interface CachedEntitlement {
  userId: string;
  featureKey: string;
  limit: number | boolean; // number for limits, boolean for toggles
  timestamp: number; // Cache creation time
  expiresAt: number; // Cache expiry time
}

/**
 * Entitlement check result
 */
interface EntitlementCheckResult {
  allowed: boolean;
  limit: number | boolean; // Current limit value
  currentUsage?: number; // For numeric limits (e.g., current project count)
  reason?: string; // If not allowed, why? (e.g., "Limit reached: 5/5 projects")
}

/**
 * Configuration change audit log entry
 */
interface ConfigChangeAudit {
  auditId: string;
  adminUserId: string;
  timestamp: Date;
  changedFields: Array<{
    tierKey: string;
    featureKey: string;
    previousValue: number | boolean;
    newValue: number | boolean;
  }>;
  fullConfigSnapshot: FeatureAccessConfig; // For disaster recovery
}
```

## Existing Database Schema (No Changes)

The feature uses existing Prisma models:

### Plan Model (Existing)

Represents subscription tiers (Free, Basic, Pro).

```prisma
model Plan {
  planId          String   @id @default(dbgenerated("uuid_generate_v4()"))
  name            String   @unique
  slug            String   @unique // Maps to plan_slug in YAML
  description     String?
  price           Decimal  @default(0.00)
  currency        String   @default("USD")
  billingInterval String?  // 'monthly', 'yearly', 'one_time', null for free
  isActive        Boolean  @default(true)
  sortOrder       Int      @default(0)
  metadata        Json     @default("{}")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @default(now()) @updatedAt

  subscriptions Subscription[]
  planFeatures  PlanFeature[]
}
```

### Feature Model (Existing)

Represents configurable features (undo/redo limits, project limits, ads).

```prisma
model Feature {
  featureId        String   @id @default(dbgenerated("uuid_generate_v4()"))
  keyName          String   @unique // e.g., "redo_undo_limit", "project_limit"
  displayName      String   // e.g., "Undo/Redo Operations Limit"
  description      String?
  category         String?
  isBoolean        Boolean  @default(false) // true for on/off, false for limits
  defaultValue     Json     @default("{}")
  validationSchema Json?    // JSON schema for value validation
  isActive         Boolean  @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @default(now()) @updatedAt

  planFeatures PlanFeature[]
  featureUsage FeatureUsage[]
}
```

### PlanFeature Model (Existing)

Links plans to features with specific values (synchronized from YAML).

```prisma
model PlanFeature {
  planFeatureId String   @id @default(dbgenerated("uuid_generate_v4()"))
  planId        String
  featureId     String
  value         Json     @default("{}") // Stores { "limit": 5 } or { "visible": true }
  isEnabled     Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @default(now()) @updatedAt

  plan    Plan    @relation(fields: [planId], references: [planId])
  feature Feature @relation(fields: [featureId], references: [featureId])
}
```

## Data Relationships

```text
YAML Config File
    ↓ (synchronized on startup/reload)
Plan ←→ PlanFeature ←→ Feature
    ↓
User ←→ Subscription ←→ Plan
    ↓ (entitlement check)
EntitlementCache (60-second TTL)
```

## Validation Rules

### Configuration File Validation

- `value` for numeric features: MUST be -1 (unlimited) or positive integer (per clarifications)
- `value` for boolean features: MUST be `true` or `false`
- `plan_slug`: MUST match existing Plan.slug in database
- `priority`: MUST be unique positive integer
- `type`: MUST be one of `number`, `boolean`, `string`
- Zero (0) is INVALID for numeric limits (per clarifications)

### Entitlement Check Validation

- User MUST have active subscription to a plan
- Feature MUST exist in configuration
- Limit of -1 always returns `allowed: true` (unlimited)
- For numeric limits: `currentUsage < limit` determines allowance
- For boolean features: `value` directly determines allowance

## State Transitions

### Configuration Synchronization Flow

```text
1. Application starts
2. Load YAML configuration file
3. Validate YAML structure (joi schema)
4. Query existing PlanFeature records from database
5. Compare YAML values with database values
6. If differences found:
   a. Begin database transaction
   b. Update changed PlanFeature records
   c. Create audit log entry with full config snapshot
   d. Commit transaction
   e. Invalidate entitlement cache
7. Cache parsed configuration in memory (60-second TTL)
```

### Entitlement Check Flow

```text
1. User attempts feature-limited action (create project, undo operation)
2. Extract userId and featureKey from request
3. Check in-memory cache for userId:featureKey
4. If cache hit and not expired:
   a. Return cached limit value
5. If cache miss or expired:
   a. Query User → Subscription → Plan → PlanFeature → Feature
   b. Extract limit value from PlanFeature.value JSON
   c. Store in cache with 60-second TTL
   d. Return limit value
6. Compare currentUsage vs limit
7. Return EntitlementCheckResult with allowed flag
```

### Limit Reduction with Grandfathering

```text
1. Admin reduces limit (e.g., project_limit from 10 to 3)
2. YAML file updated, database synchronized
3. User with 5 existing projects attempts to create 6th project:
   a. Entitlement check: currentUsage (5) >= limit (3)
   b. Return { allowed: false, reason: "You have 5 projects but limit is 3" }
4. User can still view/edit all 5 existing projects (grandfathered)
5. User must delete 2 projects to create new one (currentUsage < limit)
```

## Data Volume Estimates

- **Configuration File**: < 5 KB (3 tiers × 3 features)
- **PlanFeature Records**: 9 rows (3 plans × 3 features)
- **Feature Records**: 3 rows (redo_undo_limit, project_limit, advertisements_visible)
- **Plan Records**: 3 rows (Free, Basic, Pro)
- **Cache Entries**: ~100 entries per 1000 active users (assuming 10% feature usage per minute)
- **Audit Log**: 1 entry per configuration change (estimate: 10-50 entries per year)

## Performance Considerations

- **Cache Hit Ratio**: Target >95% for entitlement checks (60-second TTL sufficient)
- **Query Performance**: Indexed lookups via userId, planId, featureId (existing indexes)
- **Synchronization Time**: <1 second for 9 PlanFeature updates (startup/reload)
- **Memory Footprint**: <1 MB for cached entitlements (100 entries × 10 KB each)

## Summary

Data model requires **no schema changes** - leverages existing Plan, Feature, PlanFeature, and Subscription tables. YAML configuration file provides version-controllable source of truth. Synchronization on startup ensures database consistency. In-memory caching meets <100ms performance requirement while 60-second TTL ensures configuration changes propagate per spec.
