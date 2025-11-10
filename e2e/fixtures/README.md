# E2E Test Fixtures

This directory contains test fixtures and utilities for E2E testing.

## Test Users

### Source of Truth

Test users are defined in `e2e/config/test-config.ts` which is synchronized with `backend/database/seeds/seed-data.json`.

**Why this approach?**

- ✅ **Single Source of Truth**: Backend seeds = source, E2E config = reference
- ✅ **No Duplication**: Test users defined once in backend, synced to E2E config
- ✅ **Easy Updates**: Update backend seed → update E2E config → all tests use new credentials
- ✅ **Consistency**: Backend database and E2E tests always aligned

**Synchronization Workflow:**

1. Update `backend/database/seeds/seed-data.json` with new users/credentials
2. Update `e2e/config/test-config.ts` `E2E_TEST_USERS` to match exactly
3. Commit both files together
4. E2E tests automatically use synced credentials

### `auth.ts`

Provides utility functions and test user constants for authentication in E2E tests.

**Available Test Users**

All users have password: `password123`

| Name           | Email                     | Plan  | Use Case                            |
| -------------- | ------------------------- | ----- | ----------------------------------- |
| `FREE_USER`    | `free.user@example.com`   | free  | Testing free tier limitations       |
| `BASIC_USER`   | `basic.user@example.com`  | basic | Testing basic tier features         |
| `PRO_USER`     | `pro.user@example.com`    | pro   | Testing pro tier features (default) |
| `ADMIN`        | `admin@solopx.com`        | admin | Testing admin functionality         |
| `DEFAULT`      | `default@solopx.com`      | pro   | General purpose pro user            |
| `SUBSCRIPTION` | `subscription@solopx.com` | pro   | Testing subscription flows          |

**Functions:**

- `login(page, email, password)` - Login with credentials
- `loginAsUser(page, user)` - Login as a specific test user
- `logout(page)` - Logout from application
- `clearAuthState(page)` - Clear all auth data from browser
- `getUserByEmail(email)` - Get user by email address
- `getUserByPlan(plan)` - Get first user with specific plan

**Convenience Exports:**

```typescript
TEST_USERS.FREE_USER;
TEST_USERS.BASIC_USER;
TEST_USERS.PRO_USER;
TEST_USERS.ADMIN;
TEST_USERS.DEFAULT;
TEST_USERS.SUBSCRIPTION;
```

## Usage Examples

### Basic Login

```typescript
import { login, TEST_USERS } from "../../fixtures/auth";

test.beforeEach(async ({ page }) => {
  // Login as pro user
  await login(page, TEST_USERS.PRO_USER.email, TEST_USERS.PRO_USER.password);
});
```

### Login as Specific User

```typescript
import { loginAsUser, TEST_USERS } from "../../fixtures/auth";

test.beforeEach(async ({ page }) => {
  // Use convenience export
  await loginAsUser(page, TEST_USERS.PRO_USER);
});
```

### Dynamic User Selection

```typescript
import { getUserByPlan } from "../../fixtures/auth";

const freeUser = getUserByPlan("free");
await login(page, freeUser.email, freeUser.password);
```

### Access User Data

```typescript
import { TEST_USERS } from "../../fixtures/auth";

console.log(TEST_USERS.PRO_USER.email); // 'pro.user@example.com'
console.log(TEST_USERS.PRO_USER.name); // 'Pro User'
console.log(TEST_USERS.PRO_USER.plan); // 'pro'
```

## Integration with Backend Seeds

**Backend Source**: `backend/database/seeds/seed-data.json`

### Synchronization Checklist

When modifying test users:

- [ ] Update `backend/database/seeds/seed-data.json` with new user data
- [ ] Update `e2e/fixtures/auth.ts` with corresponding `TEST_USERS` entries
- [ ] Ensure email addresses match exactly
- [ ] Verify password is `password123` for all test users
- [ ] Update plan mapping if adding new plans
- [ ] Commit both files together in same commit

### Field Mapping

| Backend Field       | Fixture Field | Sync Required        |
| ------------------- | ------------- | -------------------- |
| `email`             | `email`       | ✅ YES               |
| `name`              | `name`        | ✅ YES               |
| `password_hash`     | `password`    | ⚠️ Plaintext for E2E |
| (via subscriptions) | `plan`        | ✅ YES               |
| `description`       | `description` | ✅ YES               |

## Database Seeding

Before E2E tests run:

1. `global-setup.ts` executes database seeds via `npm run db:seed:e2e`
2. Seeds populate database using `backend/database/seeds/seed-data.json`
3. E2E tests login using credentials from `auth.ts` TEST_USERS
4. Both sources must match for successful login

This ensures perfect alignment between:

- Backend user database (seed data)
- Frontend E2E test fixtures (auth.ts)
- Test execution (login/authentication)

## Maintaining Test Users

**Adding a New Test User:**

1. Add to `backend/database/seeds/seed-data.json` under `"users"` and `"subscriptions"`
2. Add corresponding entry to `TEST_USERS` in `e2e/fixtures/auth.ts`
3. Export convenience variable if commonly used in tests
4. Update this README with usage
5. Commit all changes together

**Updating Credentials:**

1. Update `backend/database/seeds/seed-data.json`
2. Sync changes to `e2e/fixtures/auth.ts`
3. Commit together
4. Run tests to verify

**Removing a User:**

1. Remove from both seed file and auth.ts
2. Search for any hardcoded email references in test files
3. Update this README if previously documented
4. Commit removal
