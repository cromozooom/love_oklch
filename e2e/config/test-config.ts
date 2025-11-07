// AUTO-GENERATED FILE
// 🔄 DO NOT EDIT MANUALLY - This file is auto-generated from backend/database/seeds/seed-data.json
//
// To update test users, edit: backend/database/seeds/seed-data.json
// Then run: npm run generate:e2e-config
// This regenerates this file with new users automatically.
//
// SOURCE OF TRUTH: backend/database/seeds/seed-data.json
// Generated: 2025-11-07T10:56:35.913Z

/**
 * Shared E2E Test Configuration
 *
 * Test users are automatically generated from backend/database/seeds/seed-data.json
 *
 * SINGLE SOURCE OF TRUTH:
 * • Backend seeds are the only place to maintain user data
 * • This file is auto-generated - changes here will be overwritten
 * • Update backend seeds, then run: npm run generate:e2e-config
 */

/**
 * Test user credentials (auto-generated from backend seeds)
 *
 * All passwords are: password123
 * These credentials are seeded into the database before E2E tests run
 */
export const E2E_TEST_USERS = {
  FREE_USER: {
    email: 'free.user@example.com',
    password: 'password123',
    name: 'Free User',
    plan: 'free',
    userId: '20000000-0000-0000-0000-000000000001',
  },
  BASIC_USER: {
    email: 'basic.user@example.com',
    password: 'password123',
    name: 'Basic User',
    plan: 'basic',
    userId: '20000000-0000-0000-0000-000000000002',
  },
  PRO_USER: {
    email: 'pro.user@example.com',
    password: 'password123',
    name: 'Pro User',
    plan: 'pro',
    userId: '20000000-0000-0000-0000-000000000003',
  },
  ADMIN: {
    email: 'admin@solopx.com',
    password: 'password123',
    name: 'System Administrator',
    plan: 'unknown',
    userId: '20000000-0000-0000-0000-000000000004',
  },
  DEFAULT: {
    email: 'default@solopx.com',
    password: 'password123',
    name: 'Default User',
    plan: 'pro',
    userId: '20000000-0000-0000-0000-000000000005',
  },
  SUBSCRIPTION: {
    email: 'subscription@solopx.com',
    password: 'password123',
    name: 'Subscription User',
    plan: 'pro',
    userId: '20000000-0000-0000-0000-000000000006',
  },
} as const;

/**
 * Backend API configuration
 */
export const E2E_CONFIG = {
  apiUrl: 'http://localhost:3000',
  appUrl: 'http://localhost:4200',
  loginPath: '/login',
  projectsPath: '/projects',
} as const;

/**
 * Source Synchronization Info
 *
 * This file is AUTO-GENERATED from: backend/database/seeds/seed-data.json
 *
 * Update process:
 * 1. Edit backend/database/seeds/seed-data.json
 * 2. Run: npm run generate:e2e-config
 * 3. This file is automatically regenerated
 * 4. Commit both files: seed-data.json and test-config.ts
 *
 * Field Mapping:
 * - email: from users[].email
 * - password: always 'password123' (hardcoded plaintext for E2E tests only)
 * - name: from users[].name
 * - plan: from subscriptions[].plan_id -> plans[].slug
 * - userId: from users[].user_id
 */
