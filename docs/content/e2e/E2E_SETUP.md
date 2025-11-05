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

The E2E tests automatically seed the database before each test run to ensure consistent starting state:

- **Automatic**: The `globalSetup` in `playwright.config.ts` runs `npm run db:seed:e2e` before tests
- **Manual seeding**: You can manually seed the database with:
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

### Run tests with UI (interactive mode)

```powershell
npm run test:ui
```

### Run tests in headed mode (see browser)

```powershell
npm run test:headed
```

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

**Solution:** Tests run sequentially, but if you run multiple test sessions in parallel, they may conflict

### Issue: colorCount not appearing

**Solution:** Run the API response test to see if backend is returning the field

## Next Steps

After tests pass:

1. Remove debug console.log statements from application code
2. Add more edge case tests
3. Test with different browsers (Firefox, Safari)
4. Add performance tests
5. Add accessibility tests
