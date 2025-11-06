# Seed Data Reference - User Accounts & Feature Access

**Last Updated**: November 6, 2025  
**Purpose**: Complete reference for all seeded users, their subscriptions, and feature access levels  
**Data Source**: `backend/database/seeds/seed-data.json`

---

## Quick Reference: Test Accounts

All test accounts use the **same password**: `password123`

| Email                     | Plan    | Purpose              | Projects    | Undo Ops          | Primary Use Case                    |
| ------------------------- | ------- | -------------------- | ----------- | ----------------- | ----------------------------------- |
| `free.user@example.com`   | Free    | Test free tier       | 5 palettes  | 10/month exports  | Testing free tier limitations       |
| `basic.user@example.com`  | Basic   | Test basic tier      | 50 palettes | 100/month exports | Testing basic tier features         |
| `pro.user@example.com`    | Pro     | Test pro tier        | Unlimited   | Unlimited exports | Testing premium features            |
| `default@solopx.com`      | **Pro** | **E2E Testing**      | Unlimited   | Unlimited         | **Primary test user for E2E tests** |
| `subscription@solopx.com` | Pro     | Subscription testing | Unlimited   | Unlimited         | Testing subscription flows          |
| `admin@solopx.com`        | N/A     | System admin         | N/A         | N/A               | Admin operations, user management   |

---

## Subscription Plans

### 1. Free Plan

- **Plan ID**: `00000000-0000-0000-0000-000000000001`
- **Price**: $0.00 USD
- **Billing**: One-time (no recurring charge)
- **Trial**: None (0 days)

**Features**:

- ✅ 5 color palettes storage
- ✅ CSS export only
- ✅ 10 exports per month
- ❌ No advanced color tools
- ❌ No API access
- ❌ No priority support
- ❌ No team collaboration

**Intended For**: Testing free tier limitations and upgrade prompts

---

### 2. Basic Plan

- **Plan ID**: `00000000-0000-0000-0000-000000000002`
- **Price**: $9.99 USD/month
- **Billing**: Monthly recurring
- **Trial**: 14 days
- **Badge**: 🔥 Popular

**Features**:

- ✅ 50 color palettes storage
- ✅ Multiple export formats (CSS, JSON, SVG, etc.)
- ✅ Advanced color tools enabled
- ✅ 100 exports per month
- ✅ Priority support
- ✅ Team collaboration
- ❌ No API access

**Intended For**: Testing mid-tier features and upgrade paths

---

### 3. Pro Plan

- **Plan ID**: `00000000-0000-0000-0000-000000000003`
- **Price**: $19.99 USD/month
- **Billing**: Monthly recurring
- **Trial**: 14 days

**Features**:

- ✅ **Unlimited** color palettes (-1 = unlimited)
- ✅ All export formats
- ✅ Advanced color tools enabled
- ✅ **Full API access**
- ✅ **Unlimited exports** per month
- ✅ Priority support
- ✅ Team collaboration

**Intended For**: Testing all premium features and E2E workflows

---

## Detailed User Accounts

### Free Tier User

```json
{
  "email": "free.user@example.com",
  "password": "password123",
  "user_id": "20000000-0000-0000-0000-000000000001",
  "plan": "Free",
  "subscription_status": "active",
  "payment_type": "one_time"
}
```

**Access**:

- Color Palette Storage: **5 palettes max**
- Export Formats: **CSS only**
- Monthly Exports: **10 per month**
- Advanced Tools: **Disabled**
- API Access: **Disabled**
- Priority Support: **Disabled**
- Collaboration: **Disabled**

**Testing Scenarios**:

- ✅ Test palette creation limits (max 5)
- ✅ Test export format restrictions
- ✅ Test monthly export quotas
- ✅ Test upgrade prompts when hitting limits

---

### Basic Tier User

```json
{
  "email": "basic.user@example.com",
  "password": "password123",
  "user_id": "20000000-0000-0000-0000-000000000002",
  "plan": "Basic",
  "subscription_status": "active",
  "payment_type": "recurring"
}
```

**Access**:

- Color Palette Storage: **50 palettes max**
- Export Formats: **All formats** (CSS, JSON, SVG, SCSS, etc.)
- Monthly Exports: **100 per month**
- Advanced Tools: **Enabled**
- API Access: **Disabled**
- Priority Support: **Enabled**
- Collaboration: **Enabled**

**Testing Scenarios**:

- ✅ Test increased palette limits
- ✅ Test multiple export formats
- ✅ Test advanced color manipulation tools
- ✅ Test collaboration features
- ✅ Test upgrade prompts for API access

---

### Pro Tier User

```json
{
  "email": "pro.user@example.com",
  "password": "password123",
  "user_id": "20000000-0000-0000-0000-000000000003",
  "plan": "Pro",
  "subscription_status": "active",
  "payment_type": "recurring"
}
```

**Access**:

- Color Palette Storage: **Unlimited** (-1)
- Export Formats: **All formats**
- Monthly Exports: **Unlimited** (-1)
- Advanced Tools: **Enabled**
- API Access: **Enabled**
- Priority Support: **Enabled**
- Collaboration: **Enabled**

**Testing Scenarios**:

- ✅ Test unlimited palette creation
- ✅ Test API integration
- ✅ Test all premium features
- ✅ No upgrade prompts should appear

---

### Default Test User (E2E Primary)

```json
{
  "email": "default@solopx.com",
  "password": "password123",
  "user_id": "20000000-0000-0000-0000-000000000005",
  "plan": "Pro",
  "subscription_status": "active",
  "payment_type": "recurring"
}
```

**⭐ Primary E2E Test User** - Used in all Playwright tests

**Access**: Same as Pro tier (unlimited everything)

**Why This User**:

- Consistently seeded before each E2E test run
- Pro plan ensures no subscription limits interfere with tests
- Well-known credentials for automated testing
- Used in all 23 E2E test scenarios

**E2E Test Coverage**:

- ✅ Project creation workflows (6 tests)
- ✅ Projects list navigation (8 tests)
- ✅ Modification tracking (8 tests)
- ✅ Undo/redo functionality (1 test)

---

### Subscription Test User

```json
{
  "email": "subscription@solopx.com",
  "password": "password123",
  "user_id": "20000000-0000-0000-0000-000000000006",
  "plan": "Pro",
  "subscription_status": "active",
  "payment_type": "recurring"
}
```

**Access**: Same as Pro tier

**Intended For**:

- Testing subscription lifecycle (upgrade/downgrade)
- Testing payment processing flows
- Testing subscription status changes

---

### System Administrator

```json
{
  "email": "admin@solopx.com",
  "password": "password123",
  "user_id": "20000000-0000-0000-0000-000000000004",
  "plan": "N/A (Admin)",
  "role": "super_admin"
}
```

**Admin Permissions**:

- ✅ `can_edit_plans`: Create/modify subscription plans
- ✅ `can_view_billing`: Access billing data
- ✅ `can_manage_users`: Create/delete/modify users
- ✅ `can_edit_features`: Add/remove features
- ✅ `can_assign_roles`: Grant admin roles

**Intended For**:

- Testing admin interfaces
- Testing plan management
- Testing user management
- Testing billing operations

---

## Feature Access Matrix

| Feature          | Free | Basic | Pro | Default | Subscription | Admin |
| ---------------- | ---- | ----- | --- | ------- | ------------ | ----- |
| Color Palettes   | 5    | 50    | ∞   | ∞       | ∞            | N/A   |
| Export Formats   | CSS  | All   | All | All     | All          | N/A   |
| Monthly Exports  | 10   | 100   | ∞   | ∞       | ∞            | N/A   |
| Advanced Tools   | ❌   | ✅    | ✅  | ✅      | ✅           | N/A   |
| API Access       | ❌   | ❌    | ✅  | ✅      | ✅           | N/A   |
| Priority Support | ❌   | ✅    | ✅  | ✅      | ✅           | N/A   |
| Collaboration    | ❌   | ✅    | ✅  | ✅      | ✅           | N/A   |
| Admin Panel      | ❌   | ❌    | ❌  | ❌      | ❌           | ✅    |

**Legend**:

- ∞ = Unlimited (stored as -1 in database)
- ✅ = Enabled
- ❌ = Disabled
- N/A = Not applicable

---

## Database Seeding Commands

### Normal Seeding (Preserves Existing Data)

```bash
cd backend
npm run db:seed
```

### E2E Testing (Reset + Seed)

```bash
cd backend
npm run db:seed:e2e
```

**What it does**:

1. Clears all tables in dependency order
2. Seeds fresh data from `seed-data.json`
3. Creates all 6 test users with proper password hashing
4. Sets up 3 subscription plans with features
5. Creates subscriptions for each test user

**Automatic E2E Seeding**:

- Playwright `globalSetup` runs `npm run db:seed:e2e` before tests
- Ensures consistent test state for all 23 E2E tests
- No manual intervention needed

---

## Single Source of Truth

**All seed data is maintained in ONE place**:

📁 **Location**: `backend/database/seeds/seed-data.json`  
⚙️ **Script**: `backend/src/database/seed.ts`  
🎯 **Command**: `npm run db:seed` or `npm run db:seed:e2e`

**Why Single Source**:

- ✅ Easy to maintain and update
- ✅ No duplicate definitions
- ✅ Consistent across dev, test, and CI environments
- ✅ Version controlled with git
- ✅ Clear audit trail of changes

**Modifying Seed Data**:

1. Edit `backend/database/seeds/seed-data.json`
2. Run `npm run db:seed:e2e` to test changes
3. Commit changes to git
4. E2E tests will automatically use new data

---

## Password Hashing

All test users use the **same bcrypt hash**:

```
$2a$12$Z8FqMrkk.WVW84FIbdfy0eKZdbI/W/9oXGs4t9p/E/wOCuT9zl5SW
```

**Plaintext**: `password123`  
**Algorithm**: bcrypt  
**Rounds**: 12

**Security Note**: These are test accounts only. Never use these credentials in production.

---

## Project Management Features (Spec 003)

### Undo/Redo Limits (MVP: Unlimited for All Users)

**Current Implementation** (as of November 2025):

- ✅ All users have **unlimited undo/redo** history
- ✅ No subscription-based limits enforced
- ✅ History persists server-side in PostgreSQL
- ✅ Modifications tracked with timestamps and metadata

**Original Specification** (Deferred to Post-MVP):

```
Free Plan: 5 undo operations
Basic Plan: 50 undo operations
Pro Plan: Unlimited undo operations
```

**Why Deferred**:

- MVP focus on core functionality
- Subscription limits add complexity
- Better to validate undo/redo works first
- Can add limits in Phase 2

**Future Implementation** (T062 - Deferred):

- Add `max_undo_operations` feature to plans
- Enforce limits in `UndoRedoService`
- Show upgrade prompts when limit reached
- E2E tests for subscription enforcement

---

## E2E Testing Strategy

### Test User: `default@solopx.com`

**Why This User for E2E**:

1. **Pro Plan** = No subscription limits to interfere with tests
2. **Predictable** = Always seeded with same ID and data
3. **Clean State** = Database reset before each test run
4. **Well-Known** = Easy to remember credentials

### Test Execution Flow

```
1. globalSetup (e2e/global-setup.ts)
   └─> npm run db:seed:e2e
       └─> Clear all tables
       └─> Seed fresh data
       └─> Create default@solopx.com (Pro plan)

2. Test Suite Runs
   └─> Login as default@solopx.com
   └─> Execute 23 E2E tests
   └─> All tests use same user (consistent state)

3. Results
   └─> 23/23 tests passing ✅
   └─> Consistent behavior across runs
   └─> No flaky tests due to data inconsistencies
```

---

## Troubleshooting

### "Authentication Failed" in E2E Tests

**Symptoms**:

- Tests fail with 401 Unauthorized
- Login page doesn't redirect

**Solution**:

```bash
cd backend
npm run db:seed:e2e
```

**Root Cause**: Password hash mismatch or missing user

---

### "Too Many Projects" Error

**Symptoms**:

- Free user can't create more than 5 palettes
- Error: "Subscription limit reached"

**Solution**: Use Pro tier user for unlimited access

```javascript
await page.fill('input[type="email"]', "pro.user@example.com");
```

---

### Database Out of Sync

**Symptoms**:

- Missing users or plans
- Foreign key errors
- Subscription data inconsistent

**Solution**:

```bash
cd backend
npm run db:seed:e2e  # Force reset
```

---

## API Endpoints for Entitlements

### Check User Feature Access

```http
GET /api/v1/entitlements/user/:userId/features
Authorization: Bearer {jwt_token}
```

**Response**:

```json
{
  "features": {
    "COLOR_PALETTE_STORAGE": { "limit": -1 },
    "EXPORT_FORMATS": { "formats": ["css", "json", "svg"] },
    "ADVANCED_COLOR_TOOLS": { "enabled": true },
    "API_ACCESS": { "enabled": true }
  }
}
```

### Check Specific Feature

```http
GET /api/v1/entitlements/user/:userId/feature/:featureKey
Authorization: Bearer {jwt_token}
```

**Example**:

```http
GET /api/v1/entitlements/user/20000000-0000-0000-0000-000000000005/feature/COLOR_PALETTE_STORAGE
```

**Response**:

```json
{
  "feature": "COLOR_PALETTE_STORAGE",
  "enabled": true,
  "value": { "limit": -1 },
  "plan": "Pro"
}
```

---

## Related Documentation

- **E2E Setup**: `docs/content/e2e/E2E_SETUP.md` - How to run E2E tests
- **Testing Guide**: `docs/content/e2e/TESTING_GUIDE.md` - Test strategies
- **Entitlements Spec**: `specs/001-freemium-entitlements/` - Subscription system design
- **Project Management Spec**: `specs/003-project-management/` - Undo/redo features

---

## Quick Commands Cheat Sheet

```bash
# Reset and seed database for E2E tests
npm run db:seed:e2e

# Normal seeding (keeps existing data)
npm run db:seed

# Run E2E tests (auto-seeds)
cd e2e
npx playwright test

# Run specific test file
npx playwright test project-creation.spec.ts

# Run in UI mode (interactive)
npx playwright test --ui

# Check database connection
cd backend
npm run db:push
```

---

## Summary

**Test Accounts**: 6 users across 3 subscription tiers + 1 admin  
**Password**: `password123` (all accounts)  
**Primary E2E User**: `default@solopx.com` (Pro plan)  
**Seeding**: Automated via `globalSetup` before E2E tests  
**Data Source**: `backend/database/seeds/seed-data.json` (single source of truth)  
**Current Undo/Redo**: Unlimited for all users (MVP)  
**Future Limits**: Deferred to post-MVP (T062)

---

**Last Updated**: November 6, 2025  
**Maintained By**: Development Team  
**Version**: 1.0.0
