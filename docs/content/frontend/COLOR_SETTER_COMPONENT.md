# Color Setter Component Documentation

## Overview

The Color Setter component is a comprehensive color picker and editor that supports multiple color formats (HEX, RGB, HSL), color gamuts (sRGB, Display P3, Unlimited), and includes WCAG accessibility checking.

## Component Architecture

### File Structure (After Split)

The component was split from a monolithic 736-line file into maintainable separate files:

```
color-setter/
├── color-setter.component.ts (~420 lines) - Component logic
├── color-setter.component.html (145 lines) - Template markup
├── color-setter.component.css (95 lines) - Component styles
└── services/
    └── color.service.ts - Color conversion utilities
```

**Benefits of Split:**

- ✅ Easier to read and maintain
- ✅ Clear separation of concerns
- ✅ Template and styles can be edited independently
- ✅ Better performance (files can be cached separately)

### Component Decorator

```typescript
@Component({
  selector: 'app-color-setter',
  templateUrl: './color-setter.component.html',
  styleUrl: './color-setter.component.css',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, WcagPanelComponent],
  providers: [ColorService],
})
```

## Integration with Project Form

### Smart Integration Features

The color-setter is integrated directly into the project form with:

✅ **Dynamic Gamut Binding**

- Respects the `colorGamut` form field selection
- Maps ColorGamut enum values to GamutProfile types
- Uses `getGamutValue()` helper method

✅ **Dynamic Space Display**

- Shows selected color space in the label
- Shows selected gamut in the label
- Updates in real-time as user changes selections

✅ **WCAG Accessibility**

- Contrast checking enabled (`showWCAG="true"`)
- Helps users pick accessible color combinations

✅ **Proper Styling**

- Blue border and background to match form aesthetic
- Positioned between "Color Space" and "Color Count" fields
- Responsive and integrated with form layout

### Integration Code

**project-form.component.html:**

```html
<!-- Color Setter - Live Preview -->
<div class="form-field color-setter-field">
  <label class="field-label">🎨 Color Picker - Live Preview</label>
  <p class="field-hint">Select colors in the {{ selectedSpaceInfo()?.label || "color space" }} space ({{ selectedGamutInfo()?.label || "gamut" }} gamut)</p>
  <app-color-setter [initialColor]="'#3B82F6'" [initialFormat]="'hex'" [initialGamut]="getGamutValue()" [showWCAG]="true" [showColorName]="false" [supportedGamuts]="['srgb', 'display-p3', 'unlimited']"> </app-color-setter>
</div>
```

**project-form.component.ts:**

```typescript
/**
 * Get the gamut value for the color setter component
 * Maps the form's colorGamut enum to GamutProfile type
 */
getGamutValue(): 'srgb' | 'display-p3' | 'unlimited' {
  const gamut = this.projectForm.get('colorGamut')?.value as ColorGamut;

  switch (gamut) {
    case ColorGamut.SRGB:
      return 'srgb';
    case ColorGamut.DISPLAY_P3:
      return 'display-p3';
    case ColorGamut.UNLIMITED:
      return 'unlimited';
    default:
      return 'srgb';
  }
}
```

**project-form.component.scss:**

```scss
.color-setter-field {
  border: 2px solid #3b82f6;
  padding: 1rem;
  border-radius: 0.5rem;
  background-color: #f0f9ff;

  .field-label {
    color: #1e40af;
    font-weight: 600;
  }

  .field-hint {
    font-size: 0.875rem;
    color: #3b82f6;
    margin: 0 0 1rem 0;
  }

  app-color-setter {
    display: block;
    margin-top: 0.75rem;
  }
}
```

## Component Inputs

| Input             | Type                                           | Default     | Description                       |
| ----------------- | ---------------------------------------------- | ----------- | --------------------------------- |
| `initialColor`    | `string`                                       | `'#FF0000'` | Starting color (any valid format) |
| `initialFormat`   | `'hex' \| 'rgb' \| 'hsl'`                      | `'hex'`     | Starting color format             |
| `initialGamut`    | `'srgb' \| 'display-p3' \| 'unlimited'`        | `'srgb'`    | Starting color gamut              |
| `showWCAG`        | `boolean`                                      | `false`     | Show WCAG accessibility panel     |
| `showColorName`   | `boolean`                                      | `true`      | Show color name display           |
| `supportedGamuts` | `Array<'srgb' \| 'display-p3' \| 'unlimited'>` | All gamuts  | Which gamuts to show in dropdown  |

## Component Outputs

| Output         | Type                             | Description                 |
| -------------- | -------------------------------- | --------------------------- |
| `colorChange`  | `EventEmitter<ColorChangeEvent>` | Emitted when color changes  |
| `formatChange` | `EventEmitter<ColorFormat>`      | Emitted when format changes |
| `gamutChange`  | `EventEmitter<GamutProfile>`     | Emitted when gamut changes  |

## Color Conversion

The component uses colorjs.io for accurate color space conversions:

### HSL Coordinate Handling

**Critical Note**: colorjs.io returns HSL coordinates as **percentages (0-100)**, not fractions (0-1):

```typescript
// colorjs.io behavior
const color = new Color("rgb(255 157 21)");
color.to("hsl").coords; // Returns: [34.87, 100, 54.12]
//                                      H°   S%   L%
```

This was a source of bugs - the component initially assumed S/L were 0-1 fractions and clamped them incorrectly.

**Fixed in ColorService.getChannels():**

```typescript
case 'hsl':
  return [
    coords[0], // Hue (0-360)
    coords[1], // Saturation (already 0-100, not 0-1)
    coords[2], // Lightness (already 0-100, not 0-1)
  ];
```

## WCAG Accessibility Panel

The component includes a WCAG panel (via `WcagPanelComponent`) that shows:

- Contrast ratios against white and black backgrounds
- AA/AAA compliance for normal and large text
- Pass/fail indicators with visual styling
- Dynamic updates when color changes

### Test IDs for E2E Testing

All WCAG panel elements have `data-testid` attributes:

```html
<!-- Main panel -->
<div data-testid="wcag-panel">
  <!-- White background section -->
  <div data-testid="wcag-white-bg">
    <span data-testid="wcag-contrast-value">12.63:1</span>

    <!-- Compliance indicators with data-status -->
    <div data-testid="wcag-normal-aa" [attr.data-status]="pass|fail">
      <span data-testid="wcag-normal-aa-threshold">4.5:1</span>
    </div>
    <!-- Similar for AAA, large text AA/AAA -->
  </div>

  <!-- Black background section -->
  <div data-testid="wcag-black-bg">
    <span data-testid="wcag-contrast-black">1.67:1</span>
    <!-- Similar compliance indicators -->
  </div>
</div>
```

## Bug Fixes Applied

### 1. Default Format Bug (Fixed)

**Issue:** Initial color format sometimes didn't respect `initialFormat` input

**Fix:** Explicitly use `initialFormat` in ngOnInit:

```typescript
this.colorState.set({
  internalValue: parsed,
  format: this.initialFormat, // Use input format explicitly
  gamut: this.initialGamut,
  ...
});
```

### 2. HSL Conversion Bug (Fixed)

**Issue:** RGB(255, 157, 21) showed as HSL(35°, 100%, 100%) instead of HSL(35°, 100%, 54%)

**Root Cause:** getChannels() assumed S/L were 0-1 fractions, but colorjs.io returns 0-100 percentages

**Fix:** Removed incorrect clamping/multiplication:

```typescript
// Before (WRONG)
const s = Math.max(0, Math.min(1, coords[1])) * 100; // Clamps 100 to 1!
const l = Math.max(0, Math.min(1, coords[2])) * 100;

// After (CORRECT)
return [coords[0], coords[1], coords[2]]; // Direct pass-through
```

### 3. Duplicate Component (Fixed)

**Issue:** Two color-setter components appeared in project editor (one RGB, one HEX)

**Fix:** Removed duplicate demo from `project-form.component.html`

## E2E Testing

### Test Suite Coverage

**7 color conversion tests (T020-T026):**

- T020: RGB(255, 157, 21) → HSL conversion
- T021: RGB(0, 128, 255) → HSL conversion
- T022: HSL(85°, 76%, 35%) → RGB conversion
- T023: Round-trip HEX→RGB→HSL→HEX preservation
- T024: Achromatic colors (black, white, gray)
- T025: RGB maximum values (255, 255, 255)
- T026: Single-channel RGB colors

**Test Results:** ✅ All 7 tests passing (20.5s runtime)

### Test Files

```
e2e/specs/color-setter/
├── basic-color-selection.spec.ts    (13 tests)
├── accessibility-compliance.spec.ts (12 tests)
└── color-conversion.spec.ts         (7 tests)
```

**Total:** 32 tests passing

## Files Modified

### Component Split

| File                          | Changes                                 | Lines     |
| ----------------------------- | --------------------------------------- | --------- |
| `color-setter.component.ts`   | Extracted template & styles, kept logic | 736 → 420 |
| `color-setter.component.html` | **NEW** - Extracted template            | 145       |
| `color-setter.component.css`  | **NEW** - Extracted styles              | 95        |

### Integration

| File                            | Change                                | Type    |
| ------------------------------- | ------------------------------------- | ------- |
| `project-form.component.html`   | Added color-setter with gamut binding | Feature |
| `project-form.component.ts`     | Added `getGamutValue()` helper method | Feature |
| `project-form.component.scss`   | Added `.color-setter-field` styling   | Styling |
| `project-editor.component.html` | Removed duplicate demo                | Cleanup |
| `project-editor.component.scss` | Removed demo styling                  | Cleanup |

### Bug Fixes

| File                        | Fix                             | Impact         |
| --------------------------- | ------------------------------- | -------------- |
| `color.service.ts`          | Fixed HSL getChannels()         | Conversion bug |
| `color-setter.component.ts` | Fixed default format handling   | Format bug     |
| `wcag-panel.component.html` | Added test IDs, fixed selectors | E2E testing    |

## Best Practices

### When Using the Component

1. **Always specify initialFormat** to control starting format
2. **Use initialGamut** to match your project's color gamut
3. **Enable showWCAG** for accessibility-critical projects
4. **Listen to colorChange events** to capture user selections
5. **Test color conversions** with E2E tests when modifying

### When Modifying the Component

1. **Keep files separated** (TS, HTML, CSS) for maintainability
2. **Run E2E tests** after any conversion logic changes
3. **Verify colorjs.io behavior** with node REPL before updating
4. **Add test IDs** to any new interactive elements
5. **Document color space quirks** in comments

## Color Space Quirks

### HSL from colorjs.io

- Returns: `[H: 0-360, S: 0-100, L: 0-100]`
- **NOT**: `[H: 0-360, S: 0-1, L: 0-1]`
- Always use direct pass-through, no multiplication needed

### Achromatic Colors (Black/White/Gray)

- Hue may be NaN or 0 when S=0
- Handle gracefully in UI displays
- Tests cover these edge cases

### RGB Maximum Values

- Valid range: 0-255 per channel
- colorjs.io handles clamping automatically
- Tests verify (255, 255, 255) works correctly

## Result

✅ **Single color-setter** in project editor  
✅ **Respects gamut and color space** selected in form  
✅ **Real-time updates** when form selections change  
✅ **Integrated aesthetic** matching form design  
✅ **No duplication** of demo components  
✅ **Accessibility checked** with WCAG panel  
✅ **All E2E tests passing** (32/32 tests)

Now when you open a project in the editor, you'll see the color picker integrated into the form, automatically updating to match your selected gamut and color space! 🎨
