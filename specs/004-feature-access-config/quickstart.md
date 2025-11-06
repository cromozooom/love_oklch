# Feature Access Configuration - Quickstart Guide

## Overview

This guide explains how to configure feature access limits for different subscription tiers in the love_oklch application. Configuration is managed via a YAML file that defines limits for undo/redo operations, project counts, and advertisement visibility.

## Configuration File Location

```
backend/config/feature-access.yaml
```

This file is the **source of truth** for all feature access rules. On application startup, the configuration is synchronized to the database for fast runtime queries.

## Configuration Structure

### Complete Example

```yaml
feature_access_control:
  description: "Defines feature limits and access levels based on user subscription status."

  roles:
    # Free tier users (no subscription)
    non_subscribed_user:
      display_name: "Free Tier"
      priority: 3 # Display order (1 = highest)
      plan_slug: "free" # Maps to Plan.slug in database
      features:
        redo_undo_limit:
          display_name: "Undo/Redo Operations Limit"
          type: "number"
          value: 5 # Maximum undo/redo stack size
          unit: "operations"

        project_limit:
          display_name: "Maximum Projects Allowed"
          type: "number"
          value: 1 # Can only have 1 active project
          unit: "projects"

        advertisements_visible:
          display_name: "Advertisements Visibility"
          type: "boolean"
          value: true # Ads shown to free users

    # Basic subscription tier
    basic_user:
      display_name: "Basic Plan"
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
          value: false # No ads for paying users

    # Pro subscription tier
    pro_user:
      display_name: "Pro Plan"
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
          value: -1 # Unlimited projects
          unit: "projects"

        advertisements_visible:
          display_name: "Advertisements Visibility"
          type: "boolean"
          value: false
```

## Validation Rules

### Numeric Limits (`redo_undo_limit`, `project_limit`)

- **-1**: Unlimited (no restriction)
- **Positive integers (1, 2, 3, ...)**: Maximum allowed count
- **0**: ❌ **INVALID** - Will cause validation error

**Why zero is invalid**: We want explicit intent. Use -1 for unlimited or positive numbers for actual limits. Zero would be ambiguous (no access vs. unlimited).

### Boolean Features (`advertisements_visible`)

- **true**: Feature enabled
- **false**: Feature disabled

### Required Fields

Each tier configuration must include:

- `display_name`: Human-readable tier name
- `priority`: Display order (1 = highest priority)
- `plan_slug`: Must match existing Plan.slug in database ("free", "basic", "pro")
- `features`: All three features (redo_undo_limit, project_limit, advertisements_visible)

Each feature must include:

- `display_name`: Human-readable feature name
- `type`: Data type ("number" or "boolean")
- `value`: The limit or setting
- `unit` (optional): Unit label for numeric features

## Common Configuration Tasks

### 1. Change Free Tier Undo Limit

```yaml
non_subscribed_user:
  features:
    redo_undo_limit:
      value: 10 # Changed from 5 to 10
```

### 2. Disable Ads for Basic Tier (Promotion)

```yaml
basic_user:
  features:
    advertisements_visible:
      value: false # Already false by default
```

### 3. Add New Subscription Tier

```yaml
roles:
  # ... existing tiers ...

  premium_user: # New tier
    display_name: "Premium Plan"
    priority: 0 # Higher priority than Pro
    plan_slug: "premium" # Must exist in Plans table
    features:
      redo_undo_limit:
        display_name: "Undo/Redo Operations Limit"
        type: "number"
        value: -1 # Unlimited
        unit: "operations"
      project_limit:
        display_name: "Maximum Projects Allowed"
        type: "number"
        value: -1 # Unlimited
        unit: "projects"
      advertisements_visible:
        display_name: "Advertisements Visibility"
        type: "boolean"
        value: false # No ads
```

**Important**: After adding a new tier, ensure the corresponding `Plan` record exists in the database with matching `slug`.

### 4. Make Pro Tier Have Limited Projects (Edge Case)

```yaml
pro_user:
  features:
    project_limit:
      value: 100 # Cap at 100 instead of unlimited
```

**Note**: If Pro users already have >100 projects, they'll be **grandfathered** (can view existing projects but cannot create new ones until they're below the limit).

## Applying Configuration Changes

### Method 1: Application Restart (Recommended for Initial Setup)

1. Edit `backend/config/feature-access.yaml`
2. Save the file
3. Restart the Node.js backend application

The configuration is loaded and synchronized to the database on startup.

### Method 2: Reload API Endpoint (For Live Changes - Optional UI Feature)

```bash
# Admin user must be authenticated
curl -X POST http://localhost:3000/api/admin/feature-config/reload \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

This triggers a hot reload without restarting the server.

### Method 3: Direct API Update (Optional UI Feature)

Use the admin API to update configuration via PUT request:

```bash
curl -X PUT http://localhost:3000/api/admin/feature-config \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roles": {
      "non_subscribed_user": {
        "features": {
          "redo_undo_limit": {
            "value": 10
          }
        }
      }
    },
    "lastUpdated": "2025-11-06T10:30:00Z"
  }'
```

See `contracts/feature-config-api.yaml` for complete API documentation.

## Propagation Timing

- **Database sync**: <1 second (on startup or reload)
- **Cache refresh**: 60 seconds maximum (TTL for in-memory cache)
- **Effective limit enforcement**: <100ms per check

After changing configuration, new limits take effect within 60 seconds for existing user sessions. New sessions get updated limits immediately.

## Grandfathering Behavior

When you **reduce** a limit (e.g., Pro tier projects from unlimited to 100), users who already exceed the new limit are **grandfathered**:

- ✅ Can view/access existing data (e.g., existing 150 projects)
- ❌ Cannot create new items until below the limit (must delete 51 projects)

**Example Error Message**:

```json
{
  "allowed": false,
  "limit": 100,
  "currentUsage": 150,
  "reason": "You have 150 projects but your plan allows 100. Please archive or delete 50 projects to create new ones."
}
```

This preserves user data while enforcing new limits going forward.

## Troubleshooting

### Configuration Not Loading

**Symptom**: Changes to YAML file don't take effect

**Solutions**:

1. Check file syntax: `yamllint backend/config/feature-access.yaml`
2. Check application logs for validation errors
3. Verify file path is correct (relative to backend/ directory)
4. Restart application to force reload

### Validation Errors

**Symptom**: "Invalid limit: use -1 for unlimited or positive numbers only"

**Solution**: Do not use 0 for limits. Use -1 for unlimited or positive integers.

**Symptom**: "Plan slug 'xyz' not found in database"

**Solution**: Ensure the `plan_slug` matches an existing Plan.slug in the Plans table. Check with:

```sql
SELECT slug FROM "Plans";
```

### Concurrent Edit Conflicts

**Symptom**: "Configuration changed by another admin. Please refresh and try again."

**Solution**: This is optimistic locking protection. Refresh the admin UI to get the latest configuration, then re-apply your changes.

### Performance Issues

**Symptom**: Entitlement checks taking >100ms

**Solutions**:

1. Check cache hit ratio (should be >95%)
2. Verify database indexes on Plans, Features tables
3. Check if cache TTL is too short (default: 60 seconds)

## Configuration File Management

### Version Control

✅ **DO**: Commit `feature-access.yaml` to Git

- Configuration is part of application deployment
- Version history tracks limit changes over time
- Easy rollback to previous configurations

### Environment-Specific Configs

For different environments (dev, staging, production), use environment variable override:

```bash
# .env.production
FEATURE_CONFIG_PATH=./config/feature-access.production.yaml
```

Or maintain separate files:

```
backend/config/
  feature-access.yaml           # Default (development)
  feature-access.staging.yaml   # Staging environment
  feature-access.production.yaml # Production environment
```

### Backup and Recovery

Configuration changes are logged in the audit log with full snapshots. To restore a previous configuration:

1. Query audit log via API:

   ```bash
   curl http://localhost:3000/api/admin/feature-config/audit-log?limit=10 \
     -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
   ```

2. Copy `fullConfigSnapshot` from desired audit entry
3. Restore to YAML file or use PUT API

## Testing Configuration Changes

### Manual Testing with Seeded Users

The application includes three test users (from `docs/SEED_DATA_REFERENCE.md`):

| User       | Email            | Subscription | Password |
| ---------- | ---------------- | ------------ | -------- |
| Free User  | free@solopx.com  | None         | test1234 |
| Basic User | basic@solopx.com | Basic Plan   | test1234 |
| Pro User   | pro@solopx.com   | Pro Plan     | test1234 |

**Test Workflow**:

1. Edit configuration (e.g., change free tier project limit to 2)
2. Restart application or reload config
3. Log in as free@solopx.com
4. Attempt to create projects
5. Verify limit enforced (allowed to create 2, blocked at 3)

### Automated E2E Testing

E2E tests use the same seeded users. See `e2e/tests/feature-limits/` for test suites that verify:

- Undo/redo limit enforcement
- Project limit enforcement
- Grandfathering behavior
- Advertisement visibility

Run tests after configuration changes:

```bash
cd e2e
npm run test:limits
```

## API Reference

For complete API documentation, see:

- `contracts/entitlement-check-api.yaml` - Runtime permission checking
- `contracts/feature-config-api.yaml` - Admin configuration management

## Naming Conventions

This feature follows consistent naming patterns across the codebase:

### TypeScript/JavaScript

- **Classes and Interfaces**: PascalCase
  - `FeatureConfigLoader`, `EntitlementCheckService`, `TierConfig`
- **Functions and Variables**: camelCase
  - `loadConfiguration()`, `checkEntitlement()`, `currentUsage`
- **Constants**: UPPER_SNAKE_CASE
  - `MAX_CACHE_TTL`, `DEFAULT_FREE_TIER_LIMIT`

### File Names

- **Backend Files**: kebab-case
  - `feature-config-loader.service.ts`
  - `entitlement-check.service.ts`
  - `admin-auth.middleware.ts`
- **Frontend Components**: kebab-case with Angular conventions
  - `feature-config-list.component.ts`
  - `feature-config-list.component.html`
  - `feature-config-list.component.scss`

### YAML Configuration

- **Keys**: snake_case
  - `redo_undo_limit`, `project_limit`, `advertisements_visible`
  - `non_subscribed_user`, `basic_user`, `pro_user`
- **Values**: Type-appropriate (numbers, booleans, strings)

### Database/Prisma

- **Models**: PascalCase (Prisma convention)
  - `Feature`, `Plan`, `PlanFeature`
- **Fields**: camelCase (Prisma convention)
  - `planSlug`, `featureKey`, `limitValue`

### API Endpoints

- **Paths**: kebab-case with nouns
  - `/api/entitlements/check`
  - `/api/admin/feature-config`
  - `/api/admin/feature-config/reload`

**Rationale**: These conventions follow TypeScript/Node.js ecosystem standards and ensure consistency across backend, frontend, configuration files, and API endpoints.

---

## Support

For issues or questions:

1. Check application logs: `backend/logs/feature-config.log`
2. Review audit log for recent changes
3. Verify YAML syntax with online validator
4. Consult `specs/004-feature-access-config/spec.md` for feature requirements

## Examples

### Scenario: Black Friday Promotion (Temporary Limit Increase)

```yaml
# Before promotion (normal limits)
non_subscribed_user:
  features:
    project_limit:
      value: 1

# During promotion (November)
non_subscribed_user:
  features:
    project_limit:
      value: 3  # Allow free users to try 3 projects

# After promotion (December)
non_subscribed_user:
  features:
    project_limit:
      value: 1  # Back to 1 project
      # Users with 2-3 projects are grandfathered
```

### Scenario: Gradual Rollout (A/B Testing)

For A/B testing, create separate tier:

```yaml
roles:
  non_subscribed_user:
    plan_slug: "free"
    features:
      project_limit:
        value: 1 # Control group

  non_subscribed_user_variant_b:
    plan_slug: "free-variant-b"
    features:
      project_limit:
        value: 2 # Test group
```

Assign users to "free" or "free-variant-b" plans in database to test impact.

### Scenario: Enterprise Custom Tier

```yaml
enterprise_user:
  display_name: "Enterprise Plan"
  priority: 0
  plan_slug: "enterprise"
  features:
    redo_undo_limit:
      value: -1 # Unlimited
    project_limit:
      value: 1000 # Very high limit (not truly unlimited)
    advertisements_visible:
      value: false
```

This allows tracking enterprise usage while appearing unlimited to users.
