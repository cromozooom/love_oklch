import { test, expect } from '@playwright/test';

test.describe('Color Input - Click Outside to Cancel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="color-setter-component"]');
  });

  test('should cancel editing mode when clicking outside with empty input', async ({ page }) => {
    // Click on display value to enter edit mode
    await page.click('[data-testid="display-value"]');
    
    // Wait for input field to appear
    await page.waitForSelector('[data-testid="color-input"]');
    const colorInput = page.locator('[data-testid="color-input"]');
    await expect(colorInput).toBeVisible();
    
    // Click outside the input (on the component container)
    await page.click('[data-testid="color-setter-component"]');
    
    // Should return to display value
    await expect(colorInput).not.toBeVisible();
    await expect(page.locator('[data-testid="display-value"]')).toBeVisible();
    
    // No error should be shown
    await expect(page.locator('[data-testid="color-input-error"]')).not.toBeVisible();
  });

  test('should cancel editing mode when clicking outside with invalid input', async ({ page }) => {
    // Click on display value to enter edit mode
    await page.click('[data-testid="display-value"]');
    
    const colorInput = page.locator('[data-testid="color-input"]');
    await expect(colorInput).toBeVisible();
    
    // Enter invalid color but don't press Enter
    await colorInput.fill('invalidcolor123');
    
    // Click outside the input
    await page.click('[data-testid="color-setter-component"]');
    
    // Should return to display value (canceling invalid input)
    await expect(colorInput).not.toBeVisible();
    await expect(page.locator('[data-testid="display-value"]')).toBeVisible();
    
    // No error should be shown since we canceled
    await expect(page.locator('[data-testid="color-input-error"]')).not.toBeVisible();
  });

  test('should parse and update color when clicking outside with valid input', async ({ page }) => {
    // Store initial color value
    const initialDisplayValue = await page.locator('[data-testid="display-value"]').textContent();
    
    // Click on display value to enter edit mode
    await page.click('[data-testid="display-value"]');
    
    const colorInput = page.locator('[data-testid="color-input"]');
    await expect(colorInput).toBeVisible();
    
    // Enter valid color
    await colorInput.fill('red');
    
    // Click outside the input
    await page.click('[data-testid="color-setter-component"]');
    
    // Should return to display value with updated color
    await expect(colorInput).not.toBeVisible();
    await expect(page.locator('[data-testid="display-value"]')).toBeVisible();
    
    // Display value should be different (updated)
    const newDisplayValue = await page.locator('[data-testid="display-value"]').textContent();
    expect(newDisplayValue).not.toBe(initialDisplayValue);
    
    // Should switch to HEX format
    const activeFormatButton = page.locator('[data-active="true"]');
    await expect(activeFormatButton).toContainText('HEX');
  });

  test('should work with Escape key as alternative to clicking outside', async ({ page }) => {
    // Click on display value to enter edit mode
    await page.click('[data-testid="display-value"]');
    
    const colorInput = page.locator('[data-testid="color-input"]');
    await expect(colorInput).toBeVisible();
    
    // Enter some text
    await colorInput.fill('some invalid input');
    
    // Press Escape key
    await colorInput.press('Escape');
    
    // Should return to display value
    await expect(colorInput).not.toBeVisible();
    await expect(page.locator('[data-testid="display-value"]')).toBeVisible();
    
    // No error should be shown
    await expect(page.locator('[data-testid="color-input-error"]')).not.toBeVisible();
  });

  test('should maintain Enter key functionality for immediate parsing', async ({ page }) => {
    // Click on display value to enter edit mode
    await page.click('[data-testid="display-value"]');
    
    const colorInput = page.locator('[data-testid="color-input"]');
    
    // Enter invalid color and press Enter (should show error and stay in edit mode)
    await colorInput.fill('invalidcolor123');
    await colorInput.press('Enter');
    
    // Should still be in edit mode with error
    await expect(colorInput).toBeVisible();
    await expect(page.locator('[data-testid="color-input-error"]')).toBeVisible();
    
    // Error should contain helpful message
    const errorMessage = page.locator('[data-testid="color-input-error"]');
    await expect(errorMessage).toContainText('Cannot parse color');
    
    // Input border should be red
    await expect(colorInput).toHaveClass(/border-red-500/);
  });

  test('should clear input and errors when starting fresh edit session', async ({ page }) => {
    // Click on display value to enter edit mode
    await page.click('[data-testid="display-value"]');
    
    const colorInput = page.locator('[data-testid="color-input"]');
    
    // Enter invalid color and press Enter to trigger error
    await colorInput.fill('invalidcolor');
    await colorInput.press('Enter');
    
    // Verify error is shown
    await expect(page.locator('[data-testid="color-input-error"]')).toBeVisible();
    
    // Cancel by clicking outside
    await page.click('[data-testid="color-setter-component"]');
    
    // Click display value again to start fresh
    await page.click('[data-testid="display-value"]');
    
    // Input should be empty and no error should be shown
    await expect(colorInput).toHaveValue('');
    await expect(page.locator('[data-testid="color-input-error"]')).not.toBeVisible();
    await expect(colorInput).not.toHaveClass(/border-red-500/);
  });
});