import { test, expect } from '@playwright/test';
import { login, TEST_USERS } from '../../fixtures/auth';

/**
 * E2E Test: Project Creation Workflow
 * Tests the complete user flow for creating a new project
 * Covers: form validation, field interactions, successful creation, navigation
 */

test.describe('Project Creation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear browser state before each test
    await page.goto('http://localhost:4200');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        });
      }
    });

    // Login as PRO user (has unlimited projects)
    await login(page, TEST_USERS.PRO_USER.email, TEST_USERS.PRO_USER.password);

    // Wait for successful login
    await page.waitForURL('**/projects', { timeout: 10000 });
  });

  test('should successfully create a project with all required fields', async ({
    page,
  }) => {
    console.log('\n🎯 TEST: Complete Project Creation');
    console.log('===================================\n');

    // Navigate to project creation form
    console.log('📝 Opening project creation form...');
    await page.click(
      'button:has-text("New Project"), button:has-text("Create")'
    );
    await page.waitForSelector('form');
    await page.waitForLoadState('networkidle');

    // Generate unique project name
    const uniqueName = `Test Project ${Date.now()}`;
    console.log(`  Project name: ${uniqueName}`);

    // Fill required fields
    await page.fill('#name', uniqueName);
    console.log('  ✓ Name field filled');

    await page.fill('#description', 'E2E test project for creation workflow');
    console.log('  ✓ Description field filled');

    await page.selectOption('select#colorGamut', 'sRGB');
    console.log('  ✓ Color gamut selected: sRGB');

    await page.selectOption('select#colorSpace', 'OKLCH');
    console.log('  ✓ Color space selected: OKLCH');

    await page.fill('input#colorCount', '10');
    console.log('  ✓ Color count set: 10');

    // Verify submit button is enabled
    await page.waitForTimeout(500); // Wait for validation
    const submitButton = page.locator(
      'button[type="submit"]:has-text("Create")'
    );
    await expect(submitButton).toBeEnabled();
    console.log('  ✓ Submit button is enabled');

    // Submit the form
    console.log('\n💾 Submitting project...');
    await submitButton.click();

    // Wait for navigation to project list or editor
    await page.waitForURL(/\/(projects|project\/[^\/]+)/, { timeout: 10000 });
    console.log('  ✓ Navigation successful');

    // Verify project was created by checking if it appears in the list
    console.log('\n🔍 Verifying project creation...');
    await page.goto('http://localhost:4200/projects');
    await page.waitForLoadState('networkidle');

    const projectCard = page.locator(`text="${uniqueName}"`);
    await expect(projectCard).toBeVisible({ timeout: 5000 });
    console.log('  ✓ Project appears in project list');

    console.log('\n✅ TEST PASSED: Project created successfully\n');
  });

  test('should validate required fields before submission', async ({
    page,
  }) => {
    console.log('\n🎯 TEST: Form Validation');
    console.log('=======================\n');

    // Navigate to project creation form
    await page.click(
      'button:has-text("New Project"), button:has-text("Create")'
    );
    await page.waitForSelector('form');

    // Fill required fields one by one and verify form state
    console.log('📝 Testing form validation step by step...');
    const submitButton = page.locator(
      'button[type="submit"]:has-text("Create")'
    );

    // Fill name field
    await page.fill('#name', 'Validation Test');
    console.log('  ✓ Name field filled');

    // Fill color gamut
    await page.selectOption('select#colorGamut', 'sRGB');
    console.log('  ✓ Color gamut selected');

    // Fill color space
    await page.selectOption('select#colorSpace', 'OKLCH');
    console.log('  ✓ Color space selected');

    // All required fields filled, button should be enabled
    await page.waitForTimeout(500);
    await expect(submitButton).toBeEnabled();
    console.log('  ✓ Submit button enabled with all required fields');

    // Clear name to test validation
    await page.fill('#name', '');
    await page.waitForTimeout(300);

    // Form should show validation error for empty name
    const nameError = page.locator(
      '.field-error:has-text("Project name is required")'
    );
    await expect(nameError).toBeVisible();
    console.log('  ✓ Validation error shown for empty required field');

    console.log('\n✅ TEST PASSED: Form validation working correctly\n');
  });

  test('should create multiple projects with different names', async ({
    page,
  }) => {
    console.log('\n🎯 TEST: Multiple Project Creation');
    console.log('=================================\n');

    const projectNames = [
      `Project One ${Date.now()}`,
      `Project Two ${Date.now() + 1}`,
    ];

    // Create first project
    console.log('📝 Creating first project...');
    await page.click(
      'button:has-text("New Project"), button:has-text("Create")'
    );
    await page.waitForSelector('form');

    await page.fill('#name', projectNames[0]);
    await page.fill('#description', 'First project');
    await page.selectOption('select#colorGamut', 'sRGB');
    await page.selectOption('select#colorSpace', 'OKLCH');
    await page.fill('input#colorCount', '5');

    await page.click('button[type="submit"]:has-text("Create")');
    await page.waitForURL(/\/(projects|project\/[^\/]+)/, { timeout: 10000 });
    console.log('  ✓ First project created');

    // Create second project
    console.log('\n📝 Creating second project...');
    await page.goto('http://localhost:4200/projects');
    await page.click(
      'button:has-text("New Project"), button:has-text("Create")'
    );
    await page.waitForSelector('form');

    await page.fill('#name', projectNames[1]);
    await page.fill('#description', 'Second project');
    await page.selectOption('select#colorGamut', 'Display P3');
    await page.selectOption('select#colorSpace', 'LCH');
    await page.fill('input#colorCount', '8');

    await page.click('button[type="submit"]:has-text("Create")');
    await page.waitForURL(/\/(projects|project\/[^\/]+)/, { timeout: 10000 });
    console.log('  ✓ Second project created');

    // Verify both projects exist
    console.log('\n🔍 Verifying both projects...');
    await page.goto('http://localhost:4200/projects');
    await page.waitForLoadState('networkidle');

    for (const name of projectNames) {
      const projectCard = page.locator(`text="${name}"`);
      await expect(projectCard).toBeVisible({ timeout: 5000 });
      console.log(`  ✓ ${name} exists`);
    }

    console.log('\n✅ TEST PASSED: Multiple projects created successfully\n');
  });

  test('should support all color gamut and space combinations', async ({
    page,
  }) => {
    console.log('\n🎯 TEST: Color Options Validation');
    console.log('=================================\n');

    await page.click(
      'button:has-text("New Project"), button:has-text("Create")'
    );
    await page.waitForSelector('form');

    const colorGamuts = ['sRGB', 'Display P3', 'Unlimited gamut'];
    const colorSpaces = ['OKLCH', 'LCH'];

    console.log('📝 Testing color combinations...');
    for (const gamut of colorGamuts) {
      for (const space of colorSpaces) {
        console.log(`  Testing: ${gamut} + ${space}`);

        await page.selectOption('select#colorGamut', gamut);
        await page.selectOption('select#colorSpace', space);

        // Verify selections are applied
        const selectedGamut = await page
          .locator('select#colorGamut')
          .inputValue();
        const selectedSpace = await page
          .locator('select#colorSpace')
          .inputValue();

        expect(selectedGamut).toBe(gamut);
        expect(selectedSpace).toBe(space);
        console.log(`    ✓ ${gamut} + ${space} combination valid`);
      }
    }

    console.log('\n✅ TEST PASSED: All color combinations supported\n');
  });

  test('should persist project data correctly', async ({ page }) => {
    console.log('\n🎯 TEST: Project Data Persistence');
    console.log('=================================\n');

    const testProject = {
      name: `Persistence Test ${Date.now()}`,
      description: 'Testing data persistence',
      colorGamut: 'Display P3',
      colorSpace: 'LCH',
      colorCount: '15',
    };

    // Create project
    console.log('📝 Creating project with specific data...');
    await page.click(
      'button:has-text("New Project"), button:has-text("Create")'
    );
    await page.waitForSelector('form');

    await page.fill('#name', testProject.name);
    await page.fill('#description', testProject.description);
    await page.selectOption('select#colorGamut', testProject.colorGamut);
    await page.selectOption('select#colorSpace', testProject.colorSpace);
    await page.fill('input#colorCount', testProject.colorCount);

    console.log(`  Name: ${testProject.name}`);
    console.log(`  Description: ${testProject.description}`);
    console.log(`  Color Gamut: ${testProject.colorGamut}`);
    console.log(`  Color Space: ${testProject.colorSpace}`);
    console.log(`  Color Count: ${testProject.colorCount}`);

    await page.click('button[type="submit"]:has-text("Create")');
    await page.waitForURL(/\/(projects|project\/[^\/]+)/, { timeout: 10000 });
    console.log('  ✓ Project created');

    // Verify project appears in list with correct data
    console.log('\n🔍 Verifying persisted data...');

    await page.goto('http://localhost:4200/projects');
    await page.waitForLoadState('networkidle');

    // Verify project exists in list
    const projectCard = page.locator(`text="${testProject.name}"`);
    await expect(projectCard).toBeVisible({ timeout: 5000 });
    console.log('  ✓ Project exists in projects list');

    // Find the project by name and click its edit button
    const projectHeading = page.locator(`h3:has-text("${testProject.name}")`);
    const editButton = projectHeading
      .locator('..')
      .locator('..')
      .locator('button[title="Edit project"]');
    await editButton.first().click();
    await page.waitForURL(/\/projects?\/[^\/]+/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    console.log('  ✓ Opened project editor'); // Verify form fields contain correct data
    const nameValue = await page.locator('#name').inputValue();
    const descValue = await page.locator('#description').inputValue();
    const gamutValue = await page.locator('select#colorGamut').inputValue();
    const spaceValue = await page.locator('select#colorSpace').inputValue();
    const countValue = await page.locator('input#colorCount').inputValue();

    expect(nameValue).toBe(testProject.name);
    expect(descValue).toBe(testProject.description);
    expect(gamutValue).toBe(testProject.colorGamut);
    expect(spaceValue).toBe(testProject.colorSpace);
    expect(countValue).toBe(testProject.colorCount);

    console.log('  ✓ Name persisted correctly');
    console.log('  ✓ Description persisted correctly');
    console.log('  ✓ Color gamut persisted correctly');
    console.log('  ✓ Color space persisted correctly');
    console.log('  ✓ Color count persisted correctly');

    console.log('\n✅ TEST PASSED: All data persisted correctly\n');
  });
  test('should allow canceling project creation', async ({ page }) => {
    console.log('\n🎯 TEST: Cancel Project Creation');
    console.log('================================\n');

    // Open creation form
    console.log('📝 Opening project creation form...');
    await page.click(
      'button:has-text("New Project"), button:has-text("Create")'
    );
    await page.waitForSelector('form');

    // Partially fill form
    await page.fill('#name', 'Cancelled Project');
    await page.selectOption('select#colorGamut', 'sRGB');
    console.log('  ✓ Form partially filled');

    // Click cancel button
    console.log('\n❌ Clicking cancel...');
    const cancelButton = page.locator(
      'button:has-text("Cancel"), a:has-text("Cancel")'
    );
    await cancelButton.click();

    // Should return to projects list
    await page.waitForURL('**/projects', { timeout: 5000 });
    console.log('  ✓ Navigated back to projects list');

    // Verify project was not created
    const cancelledProject = page.locator('text="Cancelled Project"');
    await expect(cancelledProject).not.toBeVisible();
    console.log('  ✓ Project was not created');

    console.log('\n✅ TEST PASSED: Cancel functionality working\n');
  });
});
