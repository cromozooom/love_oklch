import { test, expect } from '@playwright/test';

/**
 * Test undo/redo functionality with proper command tracking
 */

test.describe('Undo/Redo Functionality', () => {
  test('should properly undo and redo changes to colorCount field', async ({
    page,
  }) => {
    // CRITICAL: Clear ALL browser caches before test
    await page.goto('http://localhost:4200');
    await page.evaluate(() => {
      // Clear service workers
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => registration.unregister());
        });
      }
      // Clear caches
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        });
      }
      // Clear storage
      localStorage.clear();
      sessionStorage.clear();
    });

    // Enable verbose console logging - LOG EVERYTHING
    page.on('console', (msg) => {
      const text = msg.text();
      // Log ALL console messages to debug
      console.log(`[Browser] ${text}`);
    });

    // Login as default user (Pro plan with unlimited projects)
    console.log('🔐 Logging in as default user...');
    await page.goto('http://localhost:4200/login');
    await page.fill('input[type="email"]', 'default@solopx.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for either projects or login page (in case admin doesn't exist)
    try {
      await page.waitForURL('**/projects', { timeout: 5000 });
    } catch {
      console.log('⚠️ Admin login failed, trying default user...');
      await page.goto('http://localhost:4200/login');
      await page.fill('input[type="email"]', 'default@solopx.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/projects', { timeout: 10000 });
    }

    console.log('\n🎯 TEST: Undo/Redo Functionality');
    console.log('==================================\n');

    // Create a test project
    console.log('📝 Creating new project...');
    await page.click(
      'button:has-text("New Project"), button:has-text("Create")'
    );
    await page.waitForSelector('form');
    await page.waitForLoadState('networkidle');

    const uniqueName = `Undo Test ${Date.now()}`;
    console.log(`  Project name: ${uniqueName}`);

    // Fill name field using id selector
    await page.fill('#name', uniqueName);
    console.log('  ✓ Filled name field');

    // Fill description (optional but let's add it)
    await page.fill('#description', 'Test project for undo/redo');
    console.log('  ✓ Filled description field');

    // Select color gamut
    await page.selectOption('select#colorGamut', 'sRGB');
    console.log('  ✓ Selected color gamut');

    // Select color space
    await page.selectOption('select#colorSpace', 'OKLCH');
    console.log('  ✓ Selected color space');

    // Fill color count
    await page.fill('input#colorCount', '5');
    console.log('  ✓ Filled color count');

    // Debug: Check form validity
    console.log('🔍 Checking form status...');
    await page.waitForTimeout(500); // Small wait for validation to complete

    const isDisabled = await page
      .locator('button[type="submit"]:has-text("Create")')
      .getAttribute('disabled');
    console.log(`  Create button disabled: ${isDisabled !== null}`);

    if (isDisabled !== null) {
      // Check for validation errors in the form
      const errors = await page.evaluate(() => {
        const form = document.querySelector('form');
        if (!form) return 'Form not found';
        const inputs = Array.from(form.querySelectorAll('input, select'));
        return inputs
          .map((input: any) => {
            const name = input.getAttribute('formcontrolname') || input.name;
            const classes = input.className;
            return `${name}: ${
              classes.includes('ng-invalid') ? 'INVALID' : 'valid'
            }`;
          })
          .join(', ');
      });
      console.log(`  Form validation status: ${errors}`);
    }

    // Wait for button to become enabled (with longer timeout)
    console.log('⏳ Waiting for Create button to be enabled...');
    await page.waitForSelector(
      'button[type="submit"]:has-text("Create"):not([disabled])',
      {
        timeout: 15000,
      }
    );

    await page.click('button[type="submit"]:has-text("Create")');
    await page.waitForTimeout(2000);

    // Go to edit mode
    console.log('✏️ Opening project in edit mode...');
    await page.goto('http://localhost:4200/projects');
    await page.waitForLoadState('networkidle');
    const editButton = page
      .locator('button:has-text("✏️"), button[title="Edit project"]')
      .first();
    await editButton.click();
    await page.waitForURL('**/projects/**');

    const colorCountInput = page.locator(
      'input[type="number"][formControlName="colorCount"]'
    );
    await colorCountInput.waitFor();

    const initialValue = await colorCountInput.inputValue();
    console.log(`\n📊 Initial colorCount value: ${initialValue}`);
    expect(initialValue).toBe('5');

    // TEST 1: Make first change (5 → 10)
    console.log('\n📝 TEST 1: Changing 5 → 10');
    await colorCountInput.click();
    await colorCountInput.fill('10');
    await page.waitForTimeout(400); // Wait for debounce (300ms)

    let value = await colorCountInput.inputValue();
    console.log(`✓ Value is now: ${value}`);
    expect(value).toBe('10');

    // TEST 2: Make second change (10 → 15)
    console.log('\n📝 TEST 2: Changing 10 → 15');
    await colorCountInput.click();
    await colorCountInput.fill('15');
    await page.waitForTimeout(400); // Wait for debounce

    value = await colorCountInput.inputValue();
    console.log(`✓ Value is now: ${value}`);
    expect(value).toBe('15');

    // TEST 2.5: Wait for auto-save, navigate away, and verify persistence
    console.log('\n💾 TEST 2.5: Testing auto-save persistence');
    console.log('⏱️  Waiting 2 seconds for auto-save to complete...');
    await page.waitForTimeout(2000); // Wait for auto-save (1s debounce + save time)

    console.log('🔙 Navigating back to projects list...');
    await page.goto('http://localhost:4200/projects');
    await page.waitForLoadState('networkidle');

    console.log('🔜 Navigating back to project editor...');
    const editButtonAgain = page
      .locator('button:has-text("✏️"), button[title="Edit project"]')
      .first();
    await editButtonAgain.click();
    await page.waitForURL('**/projects/**');
    await page.waitForLoadState('networkidle');

    // Verify the value persisted
    const colorCountAfterNav = page.locator(
      'input[type="number"][formControlName="colorCount"]'
    );
    await colorCountAfterNav.waitFor();
    const persistedValue = await colorCountAfterNav.inputValue();
    console.log(`✓ Value after navigation: ${persistedValue}`);
    console.log(`   Expected: 15 (auto-saved)`);
    expect(persistedValue).toBe('15');
    console.log('✅ Auto-save persisted correctly!\n');

    // Note: After navigation, the in-memory command history is cleared
    // This is expected behavior - undo/redo history is session-based
    console.log(
      'ℹ️  Command history cleared after navigation (expected behavior)'
    );
    console.log('ℹ️  Starting fresh undo/redo session from persisted state\n');

    // Make new changes to test undo/redo from the persisted state
    const undoButton = page.locator('button:has-text("Undo")').first();
    const redoButton = page.locator('button:has-text("Redo")').first();

    // TEST 3: Make a new change from persisted value (15 → 20)
    console.log('📝 TEST 3: Making new change from persisted value (15 → 20)');
    await colorCountInput.fill('20');
    await page.waitForTimeout(300);

    value = await colorCountInput.inputValue();
    console.log(`✓ Value is now: ${value}`);
    console.log(`   Expected: 20`);
    expect(value).toBe('20');

    // TEST 4: Undo the new change (20 → 15)
    console.log('\n⏪ TEST 4: Undo (should go 20 → 15)');
    await undoButton.click();
    await page.waitForTimeout(300);

    value = await colorCountInput.inputValue();
    console.log(`✓ After undo, value is: ${value}`);
    console.log(`   Expected: 15 (persisted value)`);
    expect(value).toBe('15');

    // Check undo is now disabled (only had 1 command)
    const isUndoStillEnabled =
      (await undoButton.getAttribute('disabled')) === null;
    console.log(`\n⏪ Undo button still enabled: ${isUndoStillEnabled}`);
    expect(isUndoStillEnabled).toBe(false);

    // TEST 5: Redo the change (15 → 20)
    console.log('\n⏩ TEST 5: Redo (should go 15 → 20)');
    const isRedoEnabled = (await redoButton.getAttribute('disabled')) === null;
    console.log(`   Redo button enabled: ${isRedoEnabled}`);
    expect(isRedoEnabled).toBe(true);

    await redoButton.click();
    await page.waitForTimeout(300);

    value = await colorCountInput.inputValue();
    console.log(`✓ After redo, value is: ${value}`);
    console.log(`   Expected: 20`);
    expect(value).toBe('20');

    // Check redo is now disabled
    const isRedoStillEnabled =
      (await redoButton.getAttribute('disabled')) === null;
    console.log(`\n⏩ Redo button still enabled: ${isRedoStillEnabled}`);
    expect(isRedoStillEnabled).toBe(false);

    // TEST 7: Make new change after redo (should clear redo stack)
    console.log('\n📝 TEST 7: Make new change (20 → 25) after redo');
    await colorCountInput.click();
    await colorCountInput.fill('25');
    await page.waitForTimeout(400);

    value = await colorCountInput.inputValue();
    console.log(`✓ Value is now: ${value}`);
    expect(value).toBe('25');

    // Redo should be disabled after new change
    await page.waitForTimeout(300);
    const isRedoDisabledNow =
      (await redoButton.getAttribute('disabled')) !== null;
    console.log(
      `\n⏩ Redo button disabled after new change: ${isRedoDisabledNow}`
    );
    expect(isRedoDisabledNow).toBe(true);

    // But undo should work
    const isUndoEnabledNow =
      (await undoButton.getAttribute('disabled')) === null;
    console.log(`⏪ Undo button enabled: ${isUndoEnabledNow}`);
    expect(isUndoEnabledNow).toBe(true);

    console.log('\n✅ ALL TESTS PASSED!');
    console.log('==================================\n');
  });
});
