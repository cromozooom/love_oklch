// Jest setup file for Love OKLCH Backend tests
// This file runs before each test suite

import { config } from 'dotenv';
import path from 'path';

// Load test environment variables
config({ path: path.resolve(__dirname, '../.env.test') });

// Set default test environment variables if not provided
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:test_password_123@localhost:5433/love_oklch_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key';
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'error';

// Global test timeouts
jest.setTimeout(10000);

// Mock console methods in test environment to reduce noise
const originalError = console.error;
const originalWarn = console.warn;
const originalLog = console.log;

beforeAll(() => {
  // Only suppress console output if explicitly requested
  if (process.env.SUPPRESS_CONSOLE === 'true') {
    console.error = jest.fn();
    console.warn = jest.fn();
    console.log = jest.fn();
  }
});

afterAll(() => {
  // Restore console methods
  console.error = originalError;
  console.warn = originalWarn;
  console.log = originalLog;
});

// Global test utilities
global.testHelpers = {
  // Add common test utilities here
  generateTestUser: () => ({
    email: `test-${Date.now()}@example.com`,
    name: 'Test User',
    passwordHash: 'hashed-password'
  }),
  
  generateTestPlan: () => ({
    name: `Test Plan ${Date.now()}`,
    slug: `test-plan-${Date.now()}`,
    description: 'Test plan description',
    price: 9.99,
    billingInterval: 'monthly'
  })
};

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export {};