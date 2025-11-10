#!/usr/bin/env node

/**
 * Generate E2E Test Configuration from Backend Seeds
 *
 * This script reads backend/database/seeds/seed-data.json and generates
 * e2e/config/test-config.ts with test user credentials.
 *
 * This ensures a SINGLE SOURCE OF TRUTH for test users:
 * Only backend/database/seeds/seed-data.json needs to be maintained.
 * E2E config is auto-generated from it.
 *
 * Usage: npm run generate:e2e-config
 */

const fs = require("fs");
const path = require("path");

// Paths
const SEED_FILE = path.join(
  __dirname,
  "../backend/database/seeds/seed-data.json"
);
const CONFIG_FILE = path.join(__dirname, "../e2e/config/test-config.ts");

// Read seed data
console.log("📖 Reading backend seed data...");
const seedContent = fs.readFileSync(SEED_FILE, "utf-8");
const seedData = JSON.parse(seedContent);

// Create map of user_id -> plan_slug
const userPlanMap = new Map();
seedData.subscriptions.forEach((sub) => {
  const plan = seedData.plans.find((p) => p.plan_id === sub.plan_id);
  if (plan) {
    userPlanMap.set(sub.user_id, plan.slug);
  }
});

// Generate E2E test users
const testUsers = {};
seedData.users.forEach((user) => {
  const plan = userPlanMap.get(user.user_id) || "unknown";
  // Convert user_id to camelCase constant name (e.g., FREE_USER, PRO_USER)
  const planSlug = plan.toUpperCase();
  let constantName = planSlug;

  // Use email-based naming for special users
  if (user.email === "default@solopx.com") {
    constantName = "DEFAULT";
  } else if (user.email === "subscription@solopx.com") {
    constantName = "SUBSCRIPTION";
  } else if (user.email === "admin@solopx.com") {
    constantName = "ADMIN";
  } else if (plan === "free") {
    constantName = "FREE_USER";
  } else if (plan === "basic") {
    constantName = "BASIC_USER";
  } else if (plan === "pro") {
    constantName = "PRO_USER";
  }

  testUsers[constantName] = {
    email: user.email,
    password: "password123", // Plaintext for E2E testing only
    name: user.name,
    plan: plan,
    userId: user.user_id,
  };
});

// Generate TypeScript code
const generatedCode = `// AUTO-GENERATED FILE
// 🔄 DO NOT EDIT MANUALLY - This file is auto-generated from backend/database/seeds/seed-data.json
// 
// To update test users, edit: backend/database/seeds/seed-data.json
// Then run: npm run generate:e2e-config
// This regenerates this file with new users automatically.
//
// SOURCE OF TRUTH: backend/database/seeds/seed-data.json
// Generated: ${new Date().toISOString()}

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
${Object.entries(testUsers)
  .map(
    ([key, user]) => `  ${key}: {
    email: '${user.email}',
    password: '${user.password}',
    name: '${user.name}',
    plan: '${user.plan}',
    userId: '${user.userId}',
  },`
  )
  .join("\n")}
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
`;

// Write config file
console.log("✍️  Generating E2E configuration...");
fs.writeFileSync(CONFIG_FILE, generatedCode);

console.log("✅ E2E configuration generated successfully!");
console.log(`   📝 File: ${CONFIG_FILE}`);
console.log(`   👥 Users: ${Object.keys(testUsers).length}`);
Object.entries(testUsers).forEach(([key, user]) => {
  console.log(`      • ${key}: ${user.email} (${user.plan})`);
});
console.log(
  "\n💡 Remember: Edit backend/database/seeds/seed-data.json, not this file!"
);
