import { test, expect } from '@playwright/test';

test.describe('Backend API Debug', () => {
  test('should check backend endpoints', async ({ page }) => {
    // Test individual backend endpoints
    const endpoints = [
      'http://localhost:3001/api/v1/health',
      'http://localhost:3001/api/v1/auth/verify',
      'http://localhost:3001/api/v1/auth/login',
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await page.request.get(endpoint);
        console.log(`${endpoint}: ${response.status()}`);

        if (response.status() === 200) {
          const data = await response.json();
          console.log(`${endpoint} response:`, data);
        }
      } catch (error) {
        console.log(`${endpoint}: ERROR -`, (error as Error).message);
      }
    }

    // Test auth/login endpoint specifically
    try {
      const loginResponse = await page.request.post(
        'http://localhost:3001/api/v1/auth/login',
        {
          data: {
            email: 'admin@example.com',
            password: 'password123',
          },
        }
      );

      console.log('\n=== LOGIN TEST ===');
      console.log('Login status:', loginResponse.status());

      if (loginResponse.status() === 200) {
        const loginData = await loginResponse.json();
        console.log('Login success:', loginData.success);
        console.log('User role:', loginData.data?.user?.role);

        // Test verify endpoint with the token
        if (loginData.data?.token) {
          const verifyResponse = await page.request.get(
            'http://localhost:3001/api/v1/auth/verify',
            {
              headers: {
                Authorization: `Bearer ${loginData.data.token}`,
              },
            }
          );

          console.log('\n=== VERIFY TEST ===');
          console.log('Verify status:', verifyResponse.status());

          if (verifyResponse.status() === 200) {
            const verifyData = await verifyResponse.json();
            console.log('Verify response:', verifyData);
          }
        }
      }
    } catch (error) {
      console.log('Login test error:', (error as Error).message);
    }
  });
});
