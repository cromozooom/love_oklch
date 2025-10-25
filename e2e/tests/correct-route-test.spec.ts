import { test, expect } from '@playwright/test';

test.describe('Correct Admin Route Test', () => {
  test('should test correct admin route /admin/plans', async ({ page }) => {
    // Capture console messages
    const logs: string[] = [];
    page.on('console', (msg) => {
      if (
        msg.text().includes('AdminAuthGuard') ||
        msg.text().includes('AuthService') ||
        msg.text().includes('🔍')
      ) {
        logs.push(`[${msg.type()}] ${msg.text()}`);
      }
    });

    // Login first
    console.log('=== LOGIN ===');
    await page.goto('http://localhost:4200/login');
    await page.fill(
      'input[type="email"], input[name="email"], #email',
      'admin@example.com'
    );
    await page.fill(
      'input[type="password"], input[name="password"], #password',
      'password123'
    );
    await page.click(
      'button[type="submit"], button:has-text("Login"), button:has-text("Sign In")'
    );
    await page.waitForLoadState('networkidle');

    console.log('After login URL:', page.url());

    // Wait for auth to stabilize
    await page.waitForTimeout(2000);

    // Test different admin routes
    const routesToTest = ['/admin', '/admin/plans', '/admin/plan-management'];

    for (const route of routesToTest) {
      console.log(`\n=== TESTING ROUTE: ${route} ===`);

      await page.goto(`http://localhost:4200${route}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const finalUrl = page.url();
      console.log(`Route ${route} → Final URL: ${finalUrl}`);

      // Check if we see Plan Management content
      const pageContent = await page.content();
      const hasPlanManagement = pageContent.includes('Plan Management');
      console.log(`Has "Plan Management" content: ${hasPlanManagement}`);
    }

    console.log('\n=== CONSOLE LOGS ===');
    logs.forEach((log) => console.log(log));
  });
});
