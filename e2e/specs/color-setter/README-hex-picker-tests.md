# HEX Color Picker E2E Tests

This directory contains comprehensive end-to-end tests for the HEX color picker component, focusing on the specific issues that were fixed:

## Test Files

### 1. `hex-color-picker.spec.ts`

Main functionality tests covering:

- Component visibility and structure
- Corner color selection (pure white, red, black)
- Color indicator dragging
- HEX input field synchronization
- Hue slider integration
- Input validation
- Diamond indicator visibility

### 2. `hex-color-picker-edge-cases.spec.ts`

Edge case and positioning tests covering:

- White color selection bug fix at canvas borders
- Indicator center reaching exact canvas corners
- Diamond indicator extending outside canvas boundaries
- Precise color selection across entire canvas range
- Rapid mouse movement handling

## Running the Tests

### Prerequisites

1. Ensure the application is running: `npm start` in the frontend directory
2. Have a test user account set up (configured in `e2e/fixtures/auth.ts`)

### Run Individual Test Files

```bash
# Run main functionality tests
npx playwright test e2e/specs/color-setter/hex-color-picker.spec.ts

# Run edge case tests
npx playwright test e2e/specs/color-setter/hex-color-picker-edge-cases.spec.ts

# Run all HEX picker tests
npx playwright test e2e/specs/color-setter/hex-color-picker*.spec.ts
```

### Debug Mode

```bash
# Run with browser visible (headed mode)
npx playwright test e2e/specs/color-setter/hex-color-picker.spec.ts --headed

# Run in debug mode with inspector
npx playwright test e2e/specs/color-setter/hex-color-picker.spec.ts --debug

# Run specific test
npx playwright test e2e/specs/color-setter/hex-color-picker.spec.ts -g "should select pure white color"
```

### Generate Test Report

```bash
npx playwright test e2e/specs/color-setter/hex-color-picker*.spec.ts --reporter=html
npx playwright show-report
```

## Test Scenarios Covered

### Core Functionality

- [x] Component rendering and visibility
- [x] Canvas dimensions (256x256)
- [x] Diamond indicator styling and size (24x24)
- [x] HEX input field validation
- [x] Hue slider integration

### Color Selection Accuracy

- [x] Pure white at top-left corner (0,0) → `#ffffff`
- [x] Pure red at top-right corner (255,0) → `#ff0000`
- [x] Pure black at bottom-left corner (0,255) → `#000000`
- [x] Dark hue at bottom-right corner (255,255) → `#800000`

### Positioning & Edge Cases

- [x] Indicator center can reach all canvas corners
- [x] Diamond extends outside canvas boundaries
- [x] No white color bug at canvas borders
- [x] Proper color calculation at extreme positions
- [x] Rapid mouse movement handling

### User Interactions

- [x] Click-to-select color
- [x] Drag indicator to change color
- [x] Type HEX value directly
- [x] Change hue slider updates color
- [x] Invalid HEX input handling

## Fixed Issues Verified

1. **White Color Bug**: Previously, dragging near canvas borders would incorrectly select white. Tests verify this is fixed.

2. **Indicator Positioning**: The diamond indicator center can now reach exact canvas corners while extending outside boundaries.

3. **Color Accuracy**: All corner positions now return the expected pure colors.

## Test Architecture

The tests use Playwright with the existing authentication system and project creation flow. Each test:

1. Logs in as a PRO user
2. Creates a new test project
3. Navigates to the color setter component
4. Performs specific color picker interactions
5. Verifies expected behavior

## Troubleshooting

### Common Issues

- **Test timeouts**: Increase timeout if the application is slow to load
- **Element not found**: Ensure test IDs are present in the HTML
- **Color mismatch**: Browser rendering differences might cause slight color variations

### Debug Steps

1. Run tests in headed mode to see browser interactions
2. Use `--debug` flag to step through tests
3. Check browser console for JavaScript errors
4. Verify application is running and accessible
