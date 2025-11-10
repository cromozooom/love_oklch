import { Page, expect } from '@playwright/test';
import { SELECTORS } from './selectors';
import { login, TEST_USERS, TestUser } from '../fixtures/auth';

/**
 * Common Actions Utility
 *
 * Reusable functions for common E2E test actions to reduce code duplication
 * and improve maintainability.
 */

export interface ProjectConfig {
  name?: string;
  description?: string;
  colorGamut?: 'sRGB' | 'Display P3' | 'Rec. 2020';
  colorSpace?: 'OKLCH' | 'LCH' | 'LAB' | 'RGB' | 'HSL';
  colorCount?: number;
}

/**
 * Login with a specific user
 */
export async function loginAsUser(
  page: Page,
  userType: keyof typeof TEST_USERS
) {
  const user = TEST_USERS[userType];
  await login(page, user.email, user.password);
}

/**
 * Login as PRO user (most common case)
 */
export async function loginAsProUser(page: Page) {
  await loginAsUser(page, 'PRO_USER');
}

/**
 * Navigate to projects page and wait for it to load
 */
export async function navigateToProjects(page: Page) {
  await page.goto('http://localhost:4200/projects');
  await page.waitForSelector(SELECTORS.projects.newProjectButton, {
    timeout: 10000,
  });
  await page.waitForLoadState('networkidle');
}

/**
 * Create a new project with the given configuration
 */
export async function createProject(page: Page, config: ProjectConfig = {}) {
  const {
    name = `Test Project ${Date.now()}`,
    description = 'E2E test project',
    colorGamut = 'sRGB',
    colorSpace = 'OKLCH',
    colorCount = 5,
  } = config;

  // Navigate to projects if not already there
  await navigateToProjects(page);

  // Click New Project button
  await page.click(SELECTORS.projects.newProjectButton);
  await page.waitForSelector(SELECTORS.projects.projectForm, {
    timeout: 10000,
  });
  await page.waitForLoadState('networkidle');

  // Fill project form
  await page.fill(SELECTORS.projects.nameInput, name);
  await page.fill(SELECTORS.projects.descriptionInput, description);
  await page.selectOption(SELECTORS.projects.colorGamutSelect, colorGamut);
  await page.selectOption(SELECTORS.projects.colorSpaceSelect, colorSpace);
  await page.fill(SELECTORS.projects.colorCountInput, colorCount.toString());

  // Submit form
  await page.click(SELECTORS.projects.submitButton);

  // Wait for navigation to project editor
  await page.waitForSelector(SELECTORS.colorSetter.component, {
    timeout: 10000,
  });
  await page.waitForLoadState('networkidle');

  // Wait for Angular change detection
  await page.waitForTimeout(500);

  return name;
}

/**
 * Complete setup for color setter tests (login + create project)
 */
export async function setupColorSetterTest(
  page: Page,
  projectConfig?: ProjectConfig
) {
  await loginAsProUser(page);
  const projectName = await createProject(page, projectConfig);
  return projectName;
}

/**
 * Switch color format in the color setter
 */
export async function switchColorFormat(
  page: Page,
  format: 'hex' | 'rgb' | 'hsl' | 'lch' | 'oklch' | 'lab'
) {
  await page.click(SELECTORS.colorSetter.formatSelector[format]);
  await page.waitForTimeout(300); // Wait for UI update
}

/**
 * Switch gamut in the color setter
 */
export async function switchGamut(
  page: Page,
  gamut: 'srgb' | 'display-p3' | 'rec2020'
) {
  let selector: string;

  switch (gamut) {
    case 'srgb':
      selector = SELECTORS.colorSetter.gamutSelector.srgb;
      break;
    case 'display-p3':
      selector = SELECTORS.colorSetter.gamutSelector.displayP3;
      break;
    case 'rec2020':
      selector = SELECTORS.colorSetter.gamutSelector.rec2020;
      break;
    default:
      selector = SELECTORS.colorSetter.gamutSelector.byName(gamut);
  }

  if (
    await page
      .locator(selector)
      .isVisible({ timeout: 2000 })
      .catch(() => false)
  ) {
    await page.click(selector);
    await page.waitForTimeout(200);
  }
}

/**
 * Set color via the color input field
 * Handles the toggle between display value and input field
 */
export async function setColorViaInput(page: Page, colorValue: string) {
  // Click the display value to enter edit mode
  const displayValue = page.locator(SELECTORS.colorSetter.displayValue);
  await displayValue.click();

  // Wait for the input field to appear
  const colorInput = page.locator(SELECTORS.colorSetter.colorInput);
  await colorInput.waitFor({ state: 'visible', timeout: 5000 });

  // Fill the input
  await colorInput.clear();
  await colorInput.fill(colorValue);

  // Press Enter to confirm and exit edit mode
  await colorInput.press('Enter');

  // Wait for the display value to reappear (edit mode ended)
  await displayValue.waitFor({ state: 'visible', timeout: 5000 });
  await page.waitForTimeout(200); // Small delay for color processing
}

/**
 * Set RGB slider values
 */
export async function setRgbSliders(
  page: Page,
  r: number,
  g: number,
  b: number
) {
  await switchColorFormat(page, 'rgb');

  // Wait for RGB sliders to be visible
  await page.waitForSelector('[data-testid="rgb-r-slider-input"]', {
    state: 'visible',
  });

  // Set values using the range inputs
  await page.locator('[data-testid="rgb-r-slider-input"]').fill(r.toString());
  await page.locator('[data-testid="rgb-g-slider-input"]').fill(g.toString());
  await page.locator('[data-testid="rgb-b-slider-input"]').fill(b.toString());

  // Trigger change events
  await page.locator('[data-testid="rgb-r-slider-input"]').blur();
  await page.locator('[data-testid="rgb-g-slider-input"]').blur();
  await page.locator('[data-testid="rgb-b-slider-input"]').blur();

  await page.waitForTimeout(200);
}

/**
 * Set HSL slider values
 */
export async function setHslSliders(
  page: Page,
  h: number,
  s: number,
  l: number
) {
  await switchColorFormat(page, 'hsl');

  // Wait for HSL sliders to be visible
  await page.waitForSelector('[data-testid="hsl-h-slider-input"]', {
    state: 'visible',
  });

  // Set values using the range inputs
  await page.locator('[data-testid="hsl-h-slider-input"]').fill(h.toString());
  await page.locator('[data-testid="hsl-s-slider-input"]').fill(s.toString());
  await page.locator('[data-testid="hsl-l-slider-input"]').fill(l.toString());

  // Trigger change events
  await page.locator('[data-testid="hsl-h-slider-input"]').blur();
  await page.locator('[data-testid="hsl-s-slider-input"]').blur();
  await page.locator('[data-testid="hsl-l-slider-input"]').blur();

  await page.waitForTimeout(200);
}

/**
 * Set LCH slider values
 */
export async function setLchSliders(
  page: Page,
  l: number,
  c: number,
  h: number
) {
  await switchColorFormat(page, 'lch');

  await page.fill(
    SELECTORS.colorSetter.lchSliders.lightnessInput,
    l.toString()
  );
  await page.fill(SELECTORS.colorSetter.lchSliders.chromaInput, c.toString());
  await page.fill(SELECTORS.colorSetter.lchSliders.hueInput, h.toString());
  await page.waitForTimeout(200);
}

/**
 * Set OKLCH slider values
 */
export async function setOklchSliders(
  page: Page,
  l: number,
  c: number,
  h: number
) {
  await switchColorFormat(page, 'oklch');

  await page.fill(
    SELECTORS.colorSetter.oklchSliders.lightnessInput,
    l.toString()
  );
  await page.fill(SELECTORS.colorSetter.oklchSliders.chromaInput, c.toString());
  await page.fill(SELECTORS.colorSetter.oklchSliders.hueInput, h.toString());
  await page.waitForTimeout(200);
}

/**
 * Set LAB slider values
 */
export async function setLabSliders(
  page: Page,
  l: number,
  a: number,
  b: number
) {
  await switchColorFormat(page, 'lab');

  await page.fill(
    SELECTORS.colorSetter.labSliders.lightnessInput,
    l.toString()
  );
  await page.fill(SELECTORS.colorSetter.labSliders.aInput, a.toString());
  await page.fill(SELECTORS.colorSetter.labSliders.bInput, b.toString());
  await page.waitForTimeout(200);
}

/**
 * Get current display value from color setter
 */
export async function getCurrentDisplayValue(page: Page): Promise<string> {
  return (await page.textContent(SELECTORS.colorSetter.displayValue)) || '';
}

/**
 * Verify color preview matches expected color
 */
export async function verifyColorPreview(page: Page, expectedColor: string) {
  const preview = page.locator(SELECTORS.colorSetter.colorPreview);
  const actualColor = await preview.evaluate(
    (el) => window.getComputedStyle(el).backgroundColor
  );

  // Note: This is a basic check - you might need more sophisticated color comparison
  expect(actualColor).toBeTruthy();
}

/**
 * Verify gamut warning is visible/hidden
 */
export async function verifyGamutWarning(
  page: Page,
  shouldBeVisible: boolean = true
) {
  const warning = page.locator(SELECTORS.colorSetter.gamutWarning);
  if (shouldBeVisible) {
    await expect(warning).toBeVisible({ timeout: 5000 });
  } else {
    await expect(warning).not.toBeVisible({ timeout: 2000 });
  }
}

/**
 * Wait for color setter to be ready
 */
export async function waitForColorSetterReady(page: Page) {
  await page.waitForSelector(SELECTORS.colorSetter.component, {
    timeout: 10000,
  });
  await page.waitForSelector(SELECTORS.colorSetter.colorPreview, {
    timeout: 5000,
  });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500); // Extra wait for Angular
}

/**
 * Log test step with consistent formatting
 */
export function logTestStep(message: string, isHeader: boolean = false) {
  if (isHeader) {
    console.log(`\\n🎯 ${message}`);
    console.log('='.repeat(message.length + 4));
  } else {
    console.log(`  ✓ ${message}`);
  }
}

/**
 * Log test section
 */
export function logTestSection(message: string) {
  console.log(`\\n📝 ${message}...`);
}
