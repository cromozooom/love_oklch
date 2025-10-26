import { test, expect } from '@playwright/test';

/**
 * E2E Test: Phase 3 Backend API Integration
 *
 * Purpose: Debug and verify our project management API endpoints
 * Tests the complete backend integration without requiring frontend
 */

const BASE_URL = 'http://localhost:3001';
const API_BASE = `${BASE_URL}/api/v1`;

test.describe('Phase 3: Backend API Integration', () => {
  test.beforeAll(async () => {
    console.log('🔧 Testing Phase 3 Backend API Integration');
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`API Base: ${API_BASE}`);
  });

  test('Health Check - Server is running', async ({ request }) => {
    console.log('🏥 Testing health endpoint...');

    const response = await request.get(`${BASE_URL}/health`);

    expect(response.status()).toBe(200);

    const body = await response.json();
    console.log('Health response:', body);

    expect(body).toHaveProperty('status', 'healthy');
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('version');
    expect(body).toHaveProperty('environment');
  });

  test('Test Endpoint - Router is working', async ({ request }) => {
    console.log('🧪 Testing our debug test endpoint...');

    const response = await request.get(`${API_BASE}/test`);

    console.log('Test endpoint status:', response.status());

    if (response.status() === 404) {
      const errorBody = await response.text();
      console.log('❌ 404 Error body:', errorBody);

      // This helps us debug the routing issue
      expect(response.status()).toBe(200); // This will fail and show us the issue
    }

    expect(response.status()).toBe(200);

    const body = await response.json();
    console.log('✅ Test response:', body);

    expect(body).toHaveProperty(
      'message',
      'Project management router is working!'
    );
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('routes');
    expect(body.routes).toContain('auth');
    expect(body.routes).toContain('projects');
  });

  test('API Root - Main router info', async ({ request }) => {
    console.log('📋 Testing API root endpoint...');

    const response = await request.get(`${API_BASE}/`);

    console.log('API root status:', response.status());

    if (response.status() === 404) {
      const errorBody = await response.text();
      console.log('❌ API Root 404 Error:', errorBody);
    } else {
      const body = await response.json();
      console.log('✅ API root response:', body);

      expect(response.status()).toBe(200);
      expect(body).toHaveProperty('name');
      expect(body).toHaveProperty('endpoints');
    }
  });

  test('Projects Endpoint - Authentication Required', async ({ request }) => {
    console.log('🔐 Testing projects endpoint (should require auth)...');

    const response = await request.get(`${API_BASE}/projects`);

    console.log('Projects endpoint status:', response.status());

    // Should return 401 (Unauthorized) or 403 (Forbidden) for no auth
    // OR 404 if route isn't found (which indicates our routing issue)
    if (response.status() === 404) {
      const errorBody = await response.text();
      console.log('❌ Projects 404 Error:', errorBody);

      // This tells us the projects routes aren't being registered
      console.log(
        '🚨 DEBUGGING: Projects routes not found - routing issue confirmed'
      );
    } else if (response.status() === 401 || response.status() === 403) {
      console.log(
        '✅ Projects endpoint found but requires authentication (expected)'
      );
    } else {
      const body = await response.text();
      console.log('Unexpected response:', response.status(), body);
    }
  });

  test('Projects with Mock Auth - Test CRUD endpoints', async ({ request }) => {
    console.log('🚀 Testing projects with mock authentication...');

    // Try with a test authorization header
    const headers = {
      Authorization: 'Bearer test-token',
      'Content-Type': 'application/json',
    };

    const response = await request.get(`${API_BASE}/projects`, { headers });

    console.log('Projects with auth status:', response.status());

    if (response.status() === 404) {
      console.log('❌ Projects endpoint still not found - router setup issue');
      const errorBody = await response.text();
      console.log('Error details:', errorBody);
    } else if (response.status() === 401 || response.status() === 403) {
      console.log('🔐 Authentication rejected (expected if auth is working)');
    } else if (response.status() === 200) {
      const body = await response.json();
      console.log('✅ Projects response:', body);
    } else {
      const body = await response.text();
      console.log(`Unexpected status ${response.status()}:`, body);
    }
  });

  test('Network Connectivity - Basic server check', async ({ request }) => {
    console.log('🌐 Testing basic network connectivity...');

    try {
      const response = await request.get(BASE_URL);
      console.log('Root server status:', response.status());

      // Any response means server is reachable
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(600);
    } catch (error) {
      console.log('❌ Network error:', error);
      throw error;
    }
  });

  test('Database Connection Test - Via API', async ({ request }) => {
    console.log('🗄️ Testing database connectivity through API...');

    // Try to hit an endpoint that would require database
    const response = await request.get(`${API_BASE}/projects/limits`, {
      headers: { Authorization: 'Bearer test-token' },
    });

    console.log('Database-dependent endpoint status:', response.status());

    if (response.status() === 404) {
      console.log('❌ Database endpoint not found - routing issue');
    } else if (response.status() === 500) {
      const body = await response.text();
      console.log('❌ Database connection error:', body);
    } else {
      console.log('✅ Database-dependent endpoint reachable');
    }
  });

  test('Complete API Structure Debugging', async ({ request }) => {
    console.log('🔍 Complete API structure analysis...');

    const endpoints = [
      '/health',
      '/api/v1/',
      '/api/v1/test',
      '/api/v1/projects',
      '/api/v1/auth',
      '/api/v1/projects/options',
      '/api/v1/projects/limits',
    ];

    console.log('\n📊 API Endpoint Status Report:');
    console.log('================================');

    for (const endpoint of endpoints) {
      try {
        const response = await request.get(`${BASE_URL}${endpoint}`);
        const status = response.status();

        console.log(
          `${endpoint.padEnd(25)} | ${status} ${getStatusEmoji(status)}`
        );

        if (status === 404) {
          // Route not found - this is our main debugging info
          console.log(`  └─ ❌ Route not registered in Express`);
        } else if (status >= 400 && status < 500) {
          console.log(`  └─ 🔐 Route exists but auth/validation failed`);
        } else if (status >= 200 && status < 300) {
          console.log(`  └─ ✅ Route working correctly`);
        } else if (status >= 500) {
          console.log(`  └─ 💥 Server error`);
        }
      } catch (error) {
        console.log(`${endpoint.padEnd(25)} | ERROR ❌`);
        console.log(
          `  └─ Network error: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    console.log('================================\n');
  });
});

function getStatusEmoji(status: number): string {
  if (status >= 200 && status < 300) return '✅';
  if (status >= 300 && status < 400) return '🔀';
  if (status >= 400 && status < 500) return '🔐';
  if (status >= 500) return '💥';
  return '❓';
}

/**
 * Helper test to understand current server state
 */
test.describe('Server State Analysis', () => {
  test('Analyze server configuration', async ({ request }) => {
    console.log('\n🔧 SERVER CONFIGURATION ANALYSIS');
    console.log('=================================');

    // Check if server is responding at all
    try {
      const healthResponse = await request.get(`${BASE_URL}/health`);
      console.log(`✅ Server responding: ${healthResponse.status()}`);

      if (healthResponse.ok()) {
        const healthData = await healthResponse.json();
        console.log(`   Environment: ${healthData.environment}`);
        console.log(`   Version: ${healthData.version}`);
      }
    } catch (error) {
      console.log(
        `❌ Server not responding: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return; // Can't continue if server is down
    }

    // Check API prefix handling
    const testUrls = [
      { url: '/api/v1/', desc: 'API Root' },
      { url: '/api/v1/test', desc: 'Test Endpoint' },
      { url: '/api/v1/projects', desc: 'Projects Base' },
    ];

    console.log('\n📍 Route Registration Check:');
    for (const { url, desc } of testUrls) {
      const response = await request.get(`${BASE_URL}${url}`);
      const found = response.status() !== 404;
      console.log(
        `   ${desc.padEnd(15)}: ${
          found ? '✅ Found' : '❌ Not Found'
        } (${response.status()})`
      );
    }

    console.log('\n💡 DEBUGGING RECOMMENDATIONS:');
    console.log('   1. Check if createMainRouter is being called');
    console.log("   2. Verify database connection doesn't prevent route setup");
    console.log('   3. Ensure no middleware is blocking route registration');
    console.log('   4. Check for Express router conflicts');
    console.log('=================================\n');
  });
});
