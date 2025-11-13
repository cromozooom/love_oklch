import { test, expect } from '@playwright/test';
import { login, TEST_USERS } from '../../fixtures/auth';

test.describe('Theme Switching', () => {
  test.beforeEach(async ({ page }) => {
    // Clear browser state before each test
    await page.goto('http://localhost:4200');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Login as PRO user (authenticated user with theme access)
    await login(page, TEST_USERS.PRO_USER.email, TEST_USERS.PRO_USER.password);

    await page.waitForURL('**/projects', { timeout: 10000 });

    // Wait for the dashboard to fully load
    await expect(page.locator('app-dashboard')).toBeVisible({ timeout: 10000 });

    // Wait for theme switcher to be visible (indicates authenticated state)
    await expect(page.locator('app-theme-switcher')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should show theme switcher for authenticated users', async ({
    page,
  }) => {
    // The theme switcher should already be visible from beforeEach
    await expect(page.locator('app-theme-switcher')).toBeVisible();

    // Check for theme label
    await expect(
      page.locator('app-theme-switcher span:has-text("Theme:")')
    ).toBeVisible();

    // Check that all three buttons are present with proper selectors
    const lightButton = page.locator(
      'app-theme-switcher button:has-text("☀️ Light")'
    );
    const darkButton = page.locator(
      'app-theme-switcher button:has-text("🌙 Dark")'
    );
    const systemButton = page.locator(
      'app-theme-switcher button:has-text("🖥️ System")'
    );

    await expect(lightButton).toBeVisible();
    await expect(darkButton).toBeVisible();
    await expect(systemButton).toBeVisible();

    // Check that buttons have proper attributes
    await expect(lightButton).toHaveAttribute('title', 'Switch to light theme');
    await expect(darkButton).toHaveAttribute('title', 'Switch to dark theme');
  });

  test('should switch to dark theme when dark button is clicked', async ({
    page,
  }) => {
    // Click the dark theme button with proper selector
    await page.locator('app-theme-switcher button:has-text("🌙 Dark")').click();

    // Wait a moment for theme to apply
    await page.waitForTimeout(100);

    // Verify the HTML element has the dark class
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Verify the dark button appears selected (has blue background)
    const darkButton = page.locator(
      'app-theme-switcher button:has-text("🌙 Dark")'
    );
    await expect(darkButton).toHaveClass(/bg-blue-500/);
    await expect(darkButton).toHaveClass(/text-white/);

    // Verify localStorage has been updated
    const themeFromStorage = await page.evaluate(() =>
      localStorage.getItem('love-oklch-theme')
    );
    expect(themeFromStorage).toBe('dark');
  });

  test('should switch to light theme when light button is clicked', async ({
    page,
  }) => {
    // First switch to dark to ensure we're testing the transition
    await page.locator('app-theme-switcher button:has-text("🌙 Dark")').click();
    await page.waitForTimeout(100);

    // Then switch back to light
    await page
      .locator('app-theme-switcher button:has-text("☀️ Light")')
      .click();
    await page.waitForTimeout(100);

    // Verify the HTML element has the light class
    await expect(page.locator('html')).toHaveClass(/light/);

    // Verify the light button appears selected
    const lightButton = page.locator(
      'app-theme-switcher button:has-text("☀️ Light")'
    );
    await expect(lightButton).toHaveClass(/bg-blue-500/);
    await expect(lightButton).toHaveClass(/text-white/);

    // Verify localStorage has been updated
    const themeFromStorage = await page.evaluate(() =>
      localStorage.getItem('love-oklch-theme')
    );
    expect(themeFromStorage).toBe('light');
  });

  test('should persist theme preference in localStorage', async ({ page }) => {
    // Switch to dark theme
    await page.locator('app-theme-switcher button:has-text("🌙 Dark")').click();
    await page.waitForTimeout(100);

    // Refresh the page
    await page.reload();

    // Wait for dashboard to reload
    await expect(page.locator('app-dashboard')).toBeVisible();
    await expect(page.locator('app-theme-switcher')).toBeVisible();

    // Verify the theme is still dark after refresh
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Verify the dark button is still selected
    const darkButton = page.locator(
      'app-theme-switcher button:has-text("🌙 Dark")'
    );
    await expect(darkButton).toHaveClass(/bg-blue-500/);

    // Double-check localStorage persistence
    const themeFromStorage = await page.evaluate(() =>
      localStorage.getItem('love-oklch-theme')
    );
    expect(themeFromStorage).toBe('dark');
  });

  test('should handle system theme detection', async ({ page }) => {
    // Click system theme button
    const systemButton = page.locator(
      'app-theme-switcher button:has-text("🖥️ System")'
    );

    // Check if system theme is supported (button should not be disabled)
    const isDisabled = await systemButton.isDisabled();

    if (!isDisabled) {
      await systemButton.click();
      await page.waitForTimeout(100);

      // Verify the system button appears selected
      await expect(systemButton).toHaveClass(/bg-blue-500/);
      await expect(systemButton).toHaveClass(/text-white/);

      // Verify localStorage shows system preference
      const themeFromStorage = await page.evaluate(() =>
        localStorage.getItem('love-oklch-theme')
      );
      expect(themeFromStorage).toBe('system');

      // Verify that the HTML has either light or dark class (depending on system preference)
      const htmlElement = page.locator('html');
      const hasLightClass = await htmlElement.evaluate((el) =>
        el.classList.contains('light')
      );
      const hasDarkClass = await htmlElement.evaluate((el) =>
        el.classList.contains('dark')
      );

      expect(hasLightClass || hasDarkClass).toBeTruthy();
    } else {
      // System theme not supported - verify disabled state
      await expect(systemButton).toBeDisabled();
      await expect(systemButton).toHaveClass(/opacity-50/);
      await expect(systemButton).toHaveClass(/cursor-not-allowed/);
    }
  });

  test('should actually change background colors visually', async ({
    page,
  }) => {
    // Start with light theme to ensure consistent state
    await page
      .locator('app-theme-switcher button:has-text("☀️ Light")')
      .click();
    await page.waitForTimeout(200); // Allow theme to apply

    // Get the computed background color in light mode
    const lightBgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });

    // Switch to dark theme
    await page.locator('app-theme-switcher button:has-text("🌙 Dark")').click();
    await page.waitForTimeout(200); // Allow theme to apply

    // Get the computed background color in dark mode
    const darkBgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });

    // Log the colors for debugging
    console.log('Light theme background:', lightBgColor);
    console.log('Dark theme background:', darkBgColor);

    // The background colors should be different
    expect(lightBgColor).not.toBe(darkBgColor);

    // Additional check: light mode should have lighter background (higher RGB values)
    const lightRgb = parseColor(lightBgColor);
    const darkRgb = parseColor(darkBgColor);

    if (lightRgb && darkRgb) {
      // Light theme should have higher RGB values than dark theme
      expect(lightRgb.r + lightRgb.g + lightRgb.b).toBeGreaterThan(
        darkRgb.r + darkRgb.g + darkRgb.b
      );
    }
  });

  test('should apply correct CSS classes to HTML element', async ({ page }) => {
    // Test light theme classes
    await page
      .locator('app-theme-switcher button:has-text("☀️ Light")')
      .click();
    await page.waitForTimeout(100);

    const htmlClasses = await page.evaluate(
      () => document.documentElement.className
    );
    expect(htmlClasses).toContain('light');
    expect(htmlClasses).not.toContain('dark');

    // Test dark theme classes
    await page.locator('app-theme-switcher button:has-text("🌙 Dark")').click();
    await page.waitForTimeout(100);

    const darkHtmlClasses = await page.evaluate(
      () => document.documentElement.className
    );
    expect(darkHtmlClasses).toContain('dark');
    expect(darkHtmlClasses).not.toContain('light');

    // Log for debugging
    console.log('Light theme HTML classes:', htmlClasses);
    console.log('Dark theme HTML classes:', darkHtmlClasses);
  });

  test('should debug CSS generation and application', async ({ page }) => {
    // Set light theme
    await page
      .locator('app-theme-switcher button:has-text("☀️ Light")')
      .click();
    await page.waitForTimeout(100);

    // Debug CSS rules
    const cssDebugInfo = await page.evaluate(() => {
      const html = document.documentElement;
      const body = document.body;

      // Check what CSS rules exist
      const sheets = Array.from(document.styleSheets);
      const allRules: string[] = [];

      sheets.forEach((sheet) => {
        try {
          const rules = Array.from(sheet.cssRules);
          rules.forEach((rule) => {
            if (rule.type === CSSRule.STYLE_RULE) {
              const styleRule = rule as CSSStyleRule;
              if (
                styleRule.selectorText &&
                (styleRule.selectorText.includes('light') ||
                  styleRule.selectorText.includes('dark') ||
                  styleRule.selectorText.includes('body') ||
                  styleRule.selectorText.includes('bg-'))
              ) {
                allRules.push(
                  `${styleRule.selectorText} { background: ${
                    styleRule.style.backgroundColor || 'none'
                  } }`
                );
              }
            }
          });
        } catch (e) {
          // Skip sheets that can't be accessed
        }
      });

      return {
        htmlClasses: html.className,
        bodyClasses: body.className,
        computedBodyBg: window.getComputedStyle(body).backgroundColor,
        computedHtmlBg: window.getComputedStyle(html).backgroundColor,
        relevantCssRules: allRules.slice(0, 10), // First 10 relevant rules
      };
    });

    console.log('CSS Debug Info:', JSON.stringify(cssDebugInfo, null, 2));

    // The test should pass regardless, this is for debugging
    expect(cssDebugInfo.htmlClasses).toBeTruthy();
  });

  test('should maintain theme state during navigation', async ({ page }) => {
    // Set dark theme
    await page.locator('app-theme-switcher button:has-text("🌙 Dark")').click();
    await page.waitForTimeout(100);
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Navigate to projects page (child route)
    await page.goto('/projects');
    await expect(page.locator('app-dashboard')).toBeVisible(); // Should still be in dashboard layout

    // Theme should persist across navigation
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Navigate back to root
    await page.goto('/');
    await expect(page.locator('app-theme-switcher')).toBeVisible();

    // Theme should still persist
    await expect(page.locator('html')).toHaveClass(/dark/);
    const darkButton = page.locator(
      'app-theme-switcher button:has-text("🌙 Dark")'
    );
    await expect(darkButton).toHaveClass(/bg-blue-500/);
  });

  test('should handle rapid theme switching', async ({ page }) => {
    // Rapidly switch between themes to test for race conditions
    const darkButton = page.locator(
      'app-theme-switcher button:has-text("🌙 Dark")'
    );
    const lightButton = page.locator(
      'app-theme-switcher button:has-text("☀️ Light")'
    );
    const systemButton = page.locator(
      'app-theme-switcher button:has-text("🖥️ System")'
    );

    await darkButton.click();
    await page.waitForTimeout(50);

    await lightButton.click();
    await page.waitForTimeout(50);

    // Only click system if it's supported
    const isSystemDisabled = await systemButton.isDisabled();
    if (!isSystemDisabled) {
      await systemButton.click();
      await page.waitForTimeout(50);
    }

    await darkButton.click();
    await page.waitForTimeout(100);

    // Final state should be dark
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(darkButton).toHaveClass(/bg-blue-500/);

    // Verify localStorage reflects final state
    const themeFromStorage = await page.evaluate(() =>
      localStorage.getItem('love-oklch-theme')
    );
    expect(themeFromStorage).toBe('dark');
  });
});

test.describe('Theme Switching - Unauthenticated Users', () => {
  test('should not show theme switcher for unauthenticated users', async ({
    page,
  }) => {
    // Clear any existing session
    await page.goto('http://localhost:4200');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Navigate to login page (unauthenticated state)
    await page.goto('http://localhost:4200/login');

    // Theme switcher should not exist on login page
    await expect(page.locator('app-theme-switcher')).not.toBeVisible();

    // Try to access dashboard without authentication - should redirect to login
    await page.goto('/');

    // Should be redirected to login or see login form
    // Adjust this expectation based on your auth flow
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/login/);

    // Still no theme switcher
    await expect(page.locator('app-theme-switcher')).not.toBeVisible();
  });
});

// Helper function to parse RGB color strings
function parseColor(color: string): { r: number; g: number; b: number } | null {
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    return {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3]),
    };
  }
  return null;
}
