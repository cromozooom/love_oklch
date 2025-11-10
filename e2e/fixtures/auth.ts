import { Page } from '@playwright/test';
import { E2E_TEST_USERS, E2E_CONFIG } from '../config/test-config';

/**
 * Authentication Fixtures for E2E Tests
 * Provides login utilities using seed data credentials
 *
 * User credentials are imported from e2e/config/test-config.ts
 * which is synchronized with backend/database/seeds/seed-data.json
 *
 * Single source of truth: backend/database/seeds/seed-data.json
 * E2E reference: e2e/config/test-config.ts
 */

export interface TestUser {
  email: string;
  password: string;
  name: string;
  plan: string;
  userId: string;
}

/**
 * Re-export test users for convenience
 * Users are sourced from backend/database/seeds/seed-data.json
 */
export const TEST_USERS = {
  FREE_USER: E2E_TEST_USERS.FREE_USER,
  BASIC_USER: E2E_TEST_USERS.BASIC_USER,
  PRO_USER: E2E_TEST_USERS.PRO_USER,
  ADMIN: E2E_TEST_USERS.ADMIN,
  DEFAULT: E2E_TEST_USERS.DEFAULT,
  SUBSCRIPTION: E2E_TEST_USERS.SUBSCRIPTION,
};

/**
 * Get a test user by email
 *
 * @param email - User email to search for
 * @returns TestUser object or undefined if not found
 *
 * @example
 * ```typescript
 * const user = getUserByEmail('pro.user@example.com');
 * ```
 */
export function getUserByEmail(email: string): TestUser | undefined {
  return Object.values(TEST_USERS).find((u) => u.email === email);
}

/**
 * Get a test user by plan
 *
 * @param plan - Plan name (free, basic, pro, admin)
 * @returns First TestUser with that plan or undefined if not found
 *
 * @example
 * ```typescript
 * const proUser = getUserByPlan('pro');
 * ```
 */
export function getUserByPlan(plan: string): TestUser | undefined {
  return Object.values(TEST_USERS).find((u) => u.plan === plan);
}

/**
 * Login to the application using provided credentials
 *
 * @param page - Playwright Page object
 * @param email - User email (use TEST_USERS constants)
 * @param password - User password (use TEST_USERS constants)
 * @returns Promise that resolves when login is complete
 *
 * @example
 * ```typescript
 * await login(page, TEST_USERS.PRO_USER.email, TEST_USERS.PRO_USER.password);
 * ```
 */
export async function login(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  console.log(`🔐 Logging in as ${email}...`);

  // Navigate to login page
  await page.goto('http://localhost:4200/login', { waitUntil: 'networkidle' });

  // Fill email field
  const emailInput = page.locator('input[type="email"]');
  await emailInput.waitFor({ state: 'visible', timeout: 5000 });
  await emailInput.fill(email);
  console.log(`  ✓ Email entered: ${email}`);

  // Fill password field
  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.fill(password);
  console.log('  ✓ Password entered');

  // Click submit button
  const submitButton = page.locator('button[type="submit"]');
  await submitButton.click();
  console.log('  ✓ Login form submitted');

  // Wait for successful login navigation to projects page
  await page.waitForURL('**/projects', { timeout: 10000 });
  console.log('  ✓ Successfully logged in');
}

/**
 * Login using a predefined test user
 *
 * @param page - Playwright Page object
 * @param user - Test user object from TEST_USERS
 * @returns Promise that resolves when login is complete
 *
 * @example
 * ```typescript
 * await loginAsUser(page, TEST_USERS.PRO_USER);
 * ```
 */
export async function loginAsUser(
  page: Page,
  user: (typeof TEST_USERS)[keyof typeof TEST_USERS]
): Promise<void> {
  await login(page, user.email, user.password);
}

/**
 * Logout from the application
 *
 * @param page - Playwright Page object
 * @returns Promise that resolves when logout is complete
 */
export async function logout(page: Page): Promise<void> {
  console.log('🚪 Logging out...');

  // Click user menu or logout button
  // This may vary based on your UI implementation
  const logoutButton = page.locator(
    'button:has-text("Logout"), a:has-text("Logout")'
  );

  if (await logoutButton.isVisible()) {
    await logoutButton.click();
    console.log('  ✓ Logout button clicked');
  }

  // Wait for redirect to login page
  await page.waitForURL('**/login', { timeout: 5000 });
  console.log('  ✓ Successfully logged out');
}

/**
 * Clear authentication state (tokens, session storage)
 *
 * @param page - Playwright Page object
 * @returns Promise that resolves when state is cleared
 */
export async function clearAuthState(page: Page): Promise<void> {
  console.log('🧹 Clearing authentication state...');

  await page.evaluate(() => {
    // Clear localStorage
    localStorage.clear();
    // Clear sessionStorage
    sessionStorage.clear();
    // Clear indexed db
    if ('indexedDB' in window) {
      indexedDB.databases?.().then((databases) => {
        databases.forEach((database) => {
          if (database.name) {
            indexedDB.deleteDatabase(database.name);
          }
        });
      });
    }
  });

  console.log('  ✓ Auth state cleared');
}
