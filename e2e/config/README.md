# E2E Configuration

This directory contains shared configuration for E2E tests.

## test-config.ts

**Single Source of Truth for E2E Configuration**

Contains all configuration values needed for E2E tests, especially test user credentials.

### User Credentials

Test users are synchronized from `backend/database/seeds/seed-data.json`:

```typescript
E2E_TEST_USERS = {
  FREE_USER,
  BASIC_USER,
  PRO_USER,
  ADMIN,
  DEFAULT,
  SUBSCRIPTION,
};
```

All users have password: `password123`

### Backend Synchronization

**Source File**: `backend/database/seeds/seed-data.json`

To keep test users in sync with backend seeds:

1. Update `backend/database/seeds/seed-data.json` with new/changed users
2. Update `E2E_TEST_USERS` in `e2e/config/test-config.ts` to match
3. Commit both files together in same commit

Field mapping:

- `email` → from `users[].email`
- `password` → always `password123` (plaintext for E2E testing)
- `name` → from `users[].name`
- `plan` → from `subscriptions[].plan_id` → `plans[].slug`
- `userId` → from `users[].user_id`

### Usage

In E2E tests:

```typescript
import { E2E_TEST_USERS, E2E_CONFIG } from "../config/test-config";

// Access users
const email = E2E_TEST_USERS.PRO_USER.email;
const password = E2E_TEST_USERS.PRO_USER.password;

// Access config
const appUrl = E2E_CONFIG.appUrl;
```

Or via auth fixtures:

```typescript
import { TEST_USERS } from "../fixtures/auth";

await login(page, TEST_USERS.PRO_USER.email, TEST_USERS.PRO_USER.password);
```

## Adding New Configuration

When adding new E2E configuration:

1. Add to `test-config.ts`
2. Export if needed by other modules
3. Document synchronization source if applicable
4. Update this README

## Maintenance

Keep `test-config.ts` synchronized with backend seeds to ensure:

- Tests use correct credentials
- Test database matches expected state
- No unexpected failures due to mismatched credentials
