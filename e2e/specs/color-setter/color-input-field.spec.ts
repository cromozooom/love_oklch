import { test, expect } from '@playwright/test';
import { login, TEST_USERS } from '../../fixtures/auth';

/**
 * E2E Tests for Color Input Field - Universal Color Format Detection
 */
test.describe('Color Input Field - Format Detection and Switching', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.PRO_USER.email, TEST_USERS.PRO_USER.password);

    await page.waitForSelector('button:has-text("New Project")', {
      timeout: 10000,
    });
    await page.click('button:has-text("New Project")');
    await page.waitForSelector('form', { timeout: 10000 });

    const projectName = `Color Input Test ${Date.now()}`;
    await page.fill('#name', projectName);
    await page.selectOption('select#colorGamut', 'sRGB');
    await page.selectOption('select#colorSpace', 'OKLCH');
    await page.fill('input#colorCount', '5');

    await page.click('button[type="submit"]:has-text("Create")');
    await page.waitForSelector('app-color-setter', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  });

  test('should accept HEX color and switch to HEX editor', async ({ page }) => {
    const colorInput = page.locator('[data-testid="color-input"]');

    // Type HEX color
    await colorInput.fill('#FF5733');
    await colorInput.press('Enter');

    await page.waitForTimeout(300);

    // Verify it switched to HEX editor (look for hex canvas)
    await expect(page.locator('[data-testid="color-canvas"]')).toBeVisible();

    // Verify the input field is cleared after successful input
    const inputValue = await colorInput.inputValue();
    expect(inputValue).toBe('');

    // Verify the color was applied (check display value)
    const displayValue = page.locator('[data-testid="display-value"]');
    const displayText = await displayValue.textContent();
    expect(displayText?.toLowerCase()).toContain('#ff5733');
  });

  test('should accept RGB color and switch to RGB editor', async ({ page }) => {
    const colorInput = page.locator('[data-testid="color-input"]');

    // Type RGB color
    await colorInput.fill('rgb(255, 87, 51)');
    await colorInput.press('Enter');

    await page.waitForTimeout(300);

    // Verify it switched to RGB editor (look for RGB sliders)
    await expect(page.locator('app-rgb-sliders')).toBeVisible();

    // Verify the input field is cleared
    const inputValue = await colorInput.inputValue();
    expect(inputValue).toBe('');
  });

  test('should accept HSL color and switch to HSL editor', async ({ page }) => {
    const colorInput = page.locator('[data-testid="color-input"]');

    // Type HSL color
    await colorInput.fill('hsl(120, 100%, 50%)');
    await colorInput.press('Enter');

    await page.waitForTimeout(300);

    // Verify it switched to HSL editor
    await expect(page.locator('app-hsl-sliders')).toBeVisible();

    // Verify the input field is cleared
    const inputValue = await colorInput.inputValue();
    expect(inputValue).toBe('');
  });

  test('should accept OKLCH color and switch to OKLCH editor', async ({
    page,
  }) => {
    const colorInput = page.locator('[data-testid="color-input"]');

    // Type OKLCH color
    await colorInput.fill('oklch(0.7 0.15 180)');
    await colorInput.press('Enter');

    await page.waitForTimeout(300);

    // Verify it switched to OKLCH editor
    await expect(page.locator('app-oklch-sliders')).toBeVisible();

    // Verify the input field is cleared
    const inputValue = await colorInput.inputValue();
    expect(inputValue).toBe('');
  });

  test('should accept LCH color and switch to LCH editor', async ({ page }) => {
    const colorInput = page.locator('[data-testid="color-input"]');

    // Type LCH color
    await colorInput.fill('lch(70 50 180)');
    await colorInput.press('Enter');

    await page.waitForTimeout(300);

    // Verify it switched to LCH editor
    await expect(page.locator('app-lch-sliders')).toBeVisible();

    // Verify the input field is cleared
    const inputValue = await colorInput.inputValue();
    expect(inputValue).toBe('');
  });

  test('should accept LAB color and switch to LAB editor', async ({ page }) => {
    const colorInput = page.locator('[data-testid="color-input"]');

    // Type LAB color
    await colorInput.fill('lab(70 20 -30)');
    await colorInput.press('Enter');

    await page.waitForTimeout(300);

    // Verify it switched to LAB editor
    await expect(page.locator('app-lab-sliders')).toBeVisible();

    // Verify the input field is cleared
    const inputValue = await colorInput.inputValue();
    expect(inputValue).toBe('');
  });

  test('should clear invalid color input', async ({ page }) => {
    const colorInput = page.locator('[data-testid="color-input"]');

    // Type invalid color
    await colorInput.fill('invalid-color-123');
    await colorInput.press('Enter');

    await page.waitForTimeout(300);

    // Verify the input field is cleared after invalid input
    const inputValue = await colorInput.inputValue();
    expect(inputValue).toBe('');
  });

  test('should handle blur event same as enter key', async ({ page }) => {
    const colorInput = page.locator('[data-testid="color-input"]');

    // Type HEX color and blur (click away)
    await colorInput.fill('#00FF00');
    await colorInput.blur();

    await page.waitForTimeout(300);

    // Verify it processed the color
    await expect(page.locator('[data-testid="color-canvas"]')).toBeVisible();

    // Verify the input field is cleared
    const inputValue = await colorInput.inputValue();
    expect(inputValue).toBe('');
  });

  test('should preserve existing color when input is empty', async ({
    page,
  }) => {
    const colorInput = page.locator('[data-testid="color-input"]');
    const displayValue = page.locator('[data-testid="display-value"]');

    // Get initial color
    const initialColor = await displayValue.textContent();

    // Enter empty input and press enter
    await colorInput.fill('   '); // whitespace only
    await colorInput.press('Enter');

    await page.waitForTimeout(300);

    // Color should remain the same
    const currentColor = await displayValue.textContent();
    expect(currentColor).toBe(initialColor);

    // Input should be cleared
    const inputValue = await colorInput.inputValue();
    expect(inputValue).toBe('   '); // Should remain as user left it for empty input
  });
});
