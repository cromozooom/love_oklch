# E2E Test Utilities

This directory contains utilities to simplify and standardize E2E tests across the project.

## Structure

```
utils/
├── index.ts           # Central export point
├── selectors.ts       # All test selectors in one place
├── actions.ts         # Common test actions
├── project-utils.ts   # Project-specific utilities
└── README.md          # This file
```

## Usage

### Import Utilities

```typescript
import {
  SELECTORS,
  setupColorSetterTest,
  switchColorFormat,
  setRgbSliders,
  logTestStep,
  // ... other utilities
} from "../utils";
```

### Selectors

All selectors are centralized in `SELECTORS` object:

```typescript
// Instead of: '[data-testid="color-preview"]'
await page.click(SELECTORS.colorSetter.colorPreview);

// Format selectors
await page.click(SELECTORS.colorSetter.formatSelector.rgb);
await page.click(SELECTORS.colorSetter.formatSelector.byFormat("lch"));

// Slider selectors
await page.fill(SELECTORS.colorSetter.rgbSliders.redInput, "255");
```

### Common Actions

#### Setup and Login

```typescript
// Complete setup for color setter tests
await setupColorSetterTest(page);

// Login with specific user type
await loginAsUser(page, "PRO_USER");
await loginAsUser(page, "FREE_USER");

// Login as PRO user (most common)
await loginAsProUser(page);
```

#### Project Management

```typescript
// Create project with defaults
const projectName = await createProject(page);

// Create project with custom config
const projectName = await createProject(page, {
  name: "Custom Project",
  colorGamut: "Display P3",
  colorSpace: "LCH",
  colorCount: 10,
});
```

#### Color Manipulation

```typescript
// Switch formats
await switchColorFormat(page, "rgb");
await switchColorFormat(page, "lch");

// Set color via input
await setColorViaInput(page, "#ff0000");
await setColorViaInput(page, "lch(50 75 120)");

// Set slider values
await setRgbSliders(page, 255, 128, 0);
await setLchSliders(page, 50, 75, 120);
await setHslSliders(page, 180, 50, 50);
```

#### Verification

```typescript
// Verify color preview
await verifyColorPreview(page, "#ff0000");

// Verify gamut warnings
await verifyGamutWarning(page, true); // Should be visible
await verifyGamutWarning(page, false); // Should be hidden

// Get current color value
const currentColor = await getCurrentDisplayValue(page);
```

#### Logging

```typescript
// Test section header
logTestStep("RGB Color Selection Test", true);

// Test steps
logTestSection("Setting RGB values");
logTestStep("Red slider set to 255");
logTestStep("Green slider set to 128");
```

## Refactoring Existing Tests

### Before

```typescript
test("should switch formats", async ({ page }) => {
  // Login
  await page.goto("http://localhost:4200/login");
  await page.fill("#email", TEST_USERS.PRO_USER.email);
  await page.fill("#password", TEST_USERS.PRO_USER.password);
  await page.click('button[type="submit"]');

  // Create project
  await page.click('button:has-text("New Project")');
  await page.fill("#name", `Test ${Date.now()}`);
  // ... more form filling

  // Switch to RGB
  await page.click('[data-testid="format-selector-rgb"]');

  // Set RGB values
  await page.locator('[data-testid="rgb-slider-r"]').evaluate((el: any) => {
    el.value = 255;
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
});
```

### After

```typescript
test("should switch formats", async ({ page }) => {
  // One-line setup
  await setupColorSetterTest(page);

  // Clear actions with utilities
  await switchColorFormat(page, "rgb");
  await setRgbSliders(page, 255, 128, 0);

  // Verify result
  await verifyColorPreview(page, "rgb(255, 128, 0)");
});
```

## Benefits

1. **DRY (Don't Repeat Yourself)**: Common patterns extracted to utilities
2. **Maintainability**: Selector changes only need updates in one place
3. **Consistency**: All tests use same patterns and logging
4. **Readability**: Tests focus on what they're testing, not how
5. **Type Safety**: TypeScript types for better development experience

## Adding New Utilities

When adding new utilities:

1. Add selectors to `selectors.ts`
2. Add actions to `actions.ts` or create new utility file
3. Export from `index.ts`
4. Update this README with examples
5. Update existing tests to use new utilities

## Migration Checklist

To migrate existing tests:

- [ ] Replace hardcoded selectors with `SELECTORS` constants
- [ ] Replace login code with `setupColorSetterTest()` or `loginAsProUser()`
- [ ] Replace project creation with `createProject()`
- [ ] Replace format switching with `switchColorFormat()`
- [ ] Replace slider manipulation with `setXxxSliders()` functions
- [ ] Replace verification code with `verifyXxx()` functions
- [ ] Add consistent logging with `logTestStep()` and `logTestSection()`
