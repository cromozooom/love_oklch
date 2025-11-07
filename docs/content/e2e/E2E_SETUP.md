# E2E Tests for Love OKLCH Project

Automated end-to-end tests using Playwright to verify project creation, editing, and unlimited history tracking functionality.

## Prerequisites

Before running the tests, make sure:

1. **Backend is running** on `http://localhost:3001`

   ```powershell
   cd backend
   npm run dev
   ```

2. **Frontend is running** on `http://localhost:4200`

   ```powershell
   cd frontend
   npm start
   ```

3. **Database is accessible** and migrations are applied
   ```powershell
   cd backend
   npx prisma db push
   ```

## Database Seeding for Tests

The E2E tests require a clean database state to run reliably. We use automatic database seeding with proper test isolation.

### Quick Commands

```bash
# Run tests with fresh database (RECOMMENDED)
npm run test:ui:seed

# Run specific test suite
npm run test:color-setter:ui

# Manual database reset
npm run seed
```

### How Database Seeding Works

1. **Global Setup**: `playwright.config.ts` runs `npm run db:seed:e2e` once before all tests
2. **Test Isolation**: Tests run sequentially (`--workers=1`) to prevent conflicts
3. **Seed Command**: Clears all tables and reseeds from `backend/database/seeds/seed-data.json`

### Manual Seeding

```powershell
cd backend
npm run db:seed:e2e
```

This command:

- Clears all tables in dependency order
- Seeds fresh data from `backend/database/seeds/seed-data.json`
- Creates the test user (`default@solopx.com` with password `password123`)

**Single Source of Truth**: All seed data is maintained in one place:

- **Location**: `backend/database/seeds/seed-data.json`
- **Script**: `backend/src/database/seed.ts` (with `--reset` flag for E2E)

### Database Pollution Prevention

**Problem**: Tests may fail when run in different orders because database state from one test affects another.

**Solution**: All test commands now include `--workers=1` flag to run tests sequentially:

```json
{
  "test:ui": "playwright test --ui --workers=1",
  "test:ui:seed": "npm run seed && playwright test --ui --workers=1",
  "test:headed": "playwright test --headed --workers=1",
  "test:color-setter": "playwright test specs/color-setter --workers=1"
}
```

### Best Practices

1. **Always use `npm run test:ui:seed`** for UI testing
2. **Run specific test files** to avoid interference between test suites
3. **Reset database manually** if tests fail unexpectedly: `npm run seed`
4. **Use sequential execution** with `--workers=1` flag

### ⚠️ Important: UI Mode (`--ui`) Does NOT Run Global Setup

**Playwright UI mode does not execute `globalSetup` automatically**. This is by design for interactive debugging.

**Solution**: Use the convenient seed+UI script:

```powershell
# From e2e directory - this seeds the database then launches UI mode
npm run test:ui:seed
```

Or seed manually if needed:

```powershell
# From e2e directory
npm run seed

# Then run UI mode
npm run test:ui
```

**Why This Happens**:

- UI mode is designed for interactive debugging
- Global setup runs once per test session (not per test run in UI)
- Manual seeding ensures consistent state before debugging

**When You Need to Re-seed**:

- Before starting a UI mode session
- After tests create/modify data that affects other tests
- When you see authentication failures (401 errors)
- When test data seems inconsistent

## Installation

Install test dependencies:

```powershell
cd e2e
npm install
```

## Running Tests

### Run all tests (headless)

```powershell
npm test
```

**✅ Global setup runs automatically** - Database is seeded before tests start.

### Run tests with UI (interactive mode)

```powershell
# ⚠️ IMPORTANT: Seed database first!
cd backend
npm run db:seed:e2e

# Then run UI mode
cd ../e2e
npm run test:ui
```

**❌ Global setup does NOT run in UI mode** - You must seed manually first.

### Run tests in headed mode (see browser)

```powershell
npm run test:headed
```

**✅ Global setup runs automatically** - Database is seeded before tests start.

### Run specific test file

```powershell
npm run test:project-history
```

### Debug mode (step through tests)

```powershell
npm run test:debug
```

### View test report

```powershell
npm run test:report
```

## Test Files

### `project-history.spec.ts`

Main test suite covering:

1. **Project Creation Test**

   - Verifies project can be created with `colorCount` field
   - Checks that `colorCount` is sent in API request
   - Validates form submission

2. **Project Editing Test**

   - Creates a project
   - Opens it in edit mode
   - Makes multiple changes to `colorCount`
   - Verifies auto-save behavior
   - Checks history badge updates

3. **Undo/Redo Test**

   - Makes changes to a project
   - Verifies undo button becomes enabled
   - Tests undo functionality
   - Verifies redo button becomes enabled after undo

4. **Console Logs Test**

   - Captures browser console messages
   - Helps debug form watcher and command execution
   - Shows debug logs in test output

5. **API Response Test**
   - Intercepts API responses
   - Verifies `colorCount` field is in the response
   - Checks that backend properly returns the field

## What the Tests Verify

### ✅ Project Creation

- Form can be filled with all fields including `colorCount`
- API request includes `colorCount` in payload
- Project is created successfully

### ✅ Project Editing

- Project editor loads correctly
- Form watchers are set up
- Changes to `colorCount` are detected
- Auto-save triggers after changes
- History badge updates with change count

### ✅ Undo/Redo Functionality

- Undo button enables after making changes
- Undo reverts changes correctly
- Redo button enables after undo
- Command pattern works properly

### ✅ API Integration

- Backend accepts `colorCount` field
- Backend returns `colorCount` in responses
- Data persists to database

### ✅ Debug Logging

- Form watchers initialize in edit mode
- Field changes are logged
- Commands are executed
- Auto-save triggers logged

## Debugging Failed Tests

### Test fails at project creation

**Check:**

- Is backend running?
- Is database accessible?
- Are migrations applied?
- Check backend logs for errors

### Test fails at finding elements

**Check:**

- Is frontend running?
- Is the Angular app fully loaded?
- Check element selectors in the test
- Run with `npm run test:ui` to see what's happening

### Undo button not enabling

**Check:**

- Are form watchers set up? (look for console logs)
- Is command being executed? (check debug logs)
- Is undo/redo service working?
- Run console logs test to see browser output

### colorCount not saving

**Check:**

- Is field in the request payload? (API response test)
- Is field in database schema?
- Is backend validation passing?
- Check backend logs for errors

## Continuous Integration

Tests are configured to:

- Run sequentially (no parallel execution)
- Retry failed tests 2 times on CI
- Capture screenshots on failure
- Record video on failure
- Generate HTML report

## Test Data

Tests use unique project names with timestamps to avoid conflicts:

```typescript
const uniqueName = `Test Project ${Date.now()}`;
```

Test user credentials:

- Email: `default@solopx.com`
- Password: `password123`

## Tips

1. **Run backend and frontend first** - tests expect them to be running
2. **Use `npm run test:ui`** - interactive mode is great for debugging
3. **Check console logs** - the console logs test captures browser output
4. **Run tests sequentially** - prevents database conflicts
5. **Use unique project names** - avoid "Unique constraint failed" errors

## Common Issues

### Issue: Tests timeout

**Solution:** Increase timeout in `playwright.config.ts` or ensure servers are running

### Issue: Element not found

**Solution:** Run with `--headed` flag to see what's on screen, update selectors if needed

### Issue: Database conflicts

**Solution:** Use `npm run test:ui:seed` which runs tests sequentially with `--workers=1`. If running multiple terminal sessions, only run one at a time.

### Issue: Tests pass individually but fail when run together

**Solution:** Database pollution issue. Run with: `npm run test:ui:seed` to reset database and use sequential execution.

### Issue: Test order in UI mode causes failures

**Solution:** Already fixed in config with `fullyParallel: false` and `workers: 1`. Always use `npm run test:ui:seed`.

### Issue: colorCount not appearing

**Solution:** Run the API response test to see if backend is returning the field

## Test User Configuration

### Architecture: Single Source of Truth

```
backend/database/seeds/seed-data.json  ← SOURCE OF TRUTH
           ↓ (manual sync)
e2e/config/test-config.ts  ← SYNCED COPY
           ↓ (imports)
e2e/fixtures/auth.ts  ← AUTH UTILITIES
           ↓ (used by)
E2E Test Specs
```

### Available Test Users

All test users are synced from `backend/database/seeds/seed-data.json` to `e2e/config/test-config.ts`:

| Constant       | Email                     | Password      | Plan  | Purpose                 |
| -------------- | ------------------------- | ------------- | ----- | ----------------------- |
| `FREE_USER`    | `free.user@example.com`   | `password123` | free  | Test free tier          |
| `BASIC_USER`   | `basic.user@example.com`  | `password123` | basic | Test basic tier         |
| `PRO_USER`     | `pro.user@example.com`    | `password123` | pro   | Test pro tier (default) |
| `ADMIN`        | `admin@solopx.com`        | `password123` | admin | Test admin functions    |
| `DEFAULT`      | `default@solopx.com`      | `password123` | pro   | General pro user        |
| `SUBSCRIPTION` | `subscription@solopx.com` | `password123` | pro   | Test subscriptions      |

### Using Test Users in Tests

```typescript
// Import from fixtures
import { login, loginAsUser, TEST_USERS } from "../../fixtures/auth";

// Method 1: Direct login
await login(page, TEST_USERS.PRO_USER.email, TEST_USERS.PRO_USER.password);

// Method 2: Using helper
await loginAsUser(page, TEST_USERS.PRO_USER);

// Method 3: In beforeEach hook
test.beforeEach(async ({ page }) => {
  await loginAsUser(page, TEST_USERS.PRO_USER);
});
```

### Updating Test Users

When backend seed data changes:

```bash
# 1. Edit backend seeds
vim backend/database/seeds/seed-data.json
# Update users and subscriptions

# 2. Sync to E2E config
vim e2e/config/test-config.ts
# Update E2E_TEST_USERS to match

# 3. Commit together
git add backend/database/seeds/seed-data.json e2e/config/test-config.ts
git commit -m "refactor: sync test users"
```

### Field Mapping

| Backend                                    | E2E Config | Example                                |
| ------------------------------------------ | ---------- | -------------------------------------- |
| `users[].email`                            | `email`    | `pro.user@example.com`                 |
| `users[].name`                             | `name`     | `Pro User`                             |
| `users[].user_id`                          | `userId`   | `20000000-0000-0000-0000-000000000003` |
| `subscriptions[].plan_id` → `plans[].slug` | `plan`     | `pro`                                  |
| (hardcoded for E2E)                        | `password` | `password123`                          |

## Next Steps

After tests pass:

1. Remove debug console.log statements from application code
2. Add more edge case tests
3. Test with different browsers (Firefox, Safari)
4. Add performance tests
5. Add accessibility tests
