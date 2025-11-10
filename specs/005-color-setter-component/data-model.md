# Data Model: Color Setter Component

**Feature**: 005-color-setter-component  
**Date**: November 6, 2025  
**Phase**: 1 - Data Model Design

## Overview

This document defines the TypeScript interfaces, types, and data structures for the Color Setter Component. The data model supports multiple color formats, gamut profiles, and accessibility calculations while maintaining type safety.

---

## Core Entities

### 1. ColorState

Central representation of the current color in high-fidelity format.

```typescript
interface ColorState {
  /**
   * Internal high-fidelity representation (OKLCH)
   * Preserves maximum color information across format conversions
   */
  internalValue: Color; // colorjs.io Color object

  /**
   * Currently selected display format
   */
  format: ColorFormat;

  /**
   * Active gamut profile for visualization
   */
  gamut: GamutProfile;

  /**
   * Timestamp of last update (for debouncing)
   */
  lastUpdated: number;
}
```

**Invariants**:

- `internalValue` always valid Color object
- `format` must be one of supported formats
- `gamut` determines slider gradient rendering
- `lastUpdated` used for change detection

**State Transitions**:

```
Initial → [User Input] → Validating → [Clamp if needed] → Updated
Updated → [Format Change] → Converting → Updated
Updated → [Gamut Change] → Recalculating Gradients → Updated
```

---

### 2. ColorFormat

Supported color format specifications.

```typescript
type ColorFormat = "hex" | "rgb" | "hsl" | "lch" | "oklch" | "lab";

interface FormatConfig {
  /**
   * Format identifier
   */
  format: ColorFormat;

  /**
   * Human-readable display name
   */
  displayName: string;

  /**
   * Channel definitions for this format
   */
  channels: ChannelDefinition[];

  /**
   * Input control type (text or range)
   */
  inputType: "text" | "range";

  /**
   * Whether gamut warnings apply to this format
   */
  hasGamutWarnings: boolean;
}

interface ChannelDefinition {
  /**
   * Channel name (e.g., 'L', 'C', 'H', 'R', 'G', 'B')
   */
  name: string;

  /**
   * Full descriptive label
   */
  label: string;

  /**
   * Minimum valid value
   */
  min: number;

  /**
   * Maximum valid value
   */
  max: number;

  /**
   * Step increment for range inputs
   */
  step: number;

  /**
   * Unit suffix (e.g., '%', '°', '')
   */
  unit: string;
}
```

**Format Configurations**:

```typescript
const FORMAT_CONFIGS: Record<ColorFormat, FormatConfig> = {
  hex: {
    format: "hex",
    displayName: "HEX",
    channels: [], // Single text input
    inputType: "text",
    hasGamutWarnings: false,
  },
  rgb: {
    format: "rgb",
    displayName: "RGB",
    channels: [
      { name: "R", label: "Red", min: 0, max: 255, step: 1, unit: "" },
      { name: "G", label: "Green", min: 0, max: 255, step: 1, unit: "" },
      { name: "B", label: "Blue", min: 0, max: 255, step: 1, unit: "" },
    ],
    inputType: "range",
    hasGamutWarnings: false,
  },
  hsl: {
    format: "hsl",
    displayName: "HSL",
    channels: [
      { name: "H", label: "Hue", min: 0, max: 360, step: 1, unit: "°" },
      { name: "S", label: "Saturation", min: 0, max: 100, step: 1, unit: "%" },
      { name: "L", label: "Lightness", min: 0, max: 100, step: 1, unit: "%" },
    ],
    inputType: "range",
    hasGamutWarnings: false,
  },
  lch: {
    format: "lch",
    displayName: "LCH",
    channels: [
      { name: "L", label: "Lightness", min: 0, max: 100, step: 0.5, unit: "%" },
      { name: "C", label: "Chroma", min: 0, max: 150, step: 0.5, unit: "" },
      { name: "H", label: "Hue", min: 0, max: 360, step: 1, unit: "°" },
    ],
    inputType: "range",
    hasGamutWarnings: true,
  },
  oklch: {
    format: "oklch",
    displayName: "OKLCH",
    channels: [
      { name: "L", label: "Lightness", min: 0, max: 100, step: 0.5, unit: "%" },
      { name: "C", label: "Chroma", min: 0, max: 0.4, step: 0.001, unit: "" },
      { name: "H", label: "Hue", min: 0, max: 360, step: 1, unit: "°" },
    ],
    inputType: "range",
    hasGamutWarnings: true,
  },
  lab: {
    format: "lab",
    displayName: "LAB",
    channels: [
      { name: "L", label: "Lightness", min: 0, max: 100, step: 0.5, unit: "%" },
      { name: "A", label: "A (green-red)", min: -128, max: 128, step: 1, unit: "" },
      { name: "B", label: "B (blue-yellow)", min: -128, max: 128, step: 1, unit: "" },
    ],
    inputType: "range",
    hasGamutWarnings: true,
  },
};
```

---

### 3. GamutProfile

Target color gamut for visualization and warnings.

```typescript
type GamutProfile = "srgb" | "display-p3" | "unlimited";

interface GamutDefinition {
  /**
   * Gamut identifier
   */
  profile: GamutProfile;

  /**
   * Human-readable display name
   */
  displayName: string;

  /**
   * colorjs.io gamut identifier (null for unlimited)
   */
  colorjsGamut: string | null;

  /**
   * Description for users
   */
  description: string;
}

const GAMUT_PROFILES: Record<GamutProfile, GamutDefinition> = {
  srgb: {
    profile: "srgb",
    displayName: "sRGB",
    colorjsGamut: "srgb",
    description: "Standard web/monitor gamut, most compatible",
  },
  "display-p3": {
    profile: "display-p3",
    displayName: "Display P3",
    colorjsGamut: "p3",
    description: "Wide gamut for modern displays (Apple, high-end monitors)",
  },
  unlimited: {
    profile: "unlimited",
    displayName: "Unlimited",
    colorjsGamut: null,
    description: "Full theoretical color space, no gamut restrictions",
  },
};
```

**Gamut Checking**:

```typescript
interface GamutCheckResult {
  /**
   * Whether color is within specified gamut
   */
  inGamut: boolean;

  /**
   * Distance from gamut boundary (if out of gamut)
   * Higher = more out of gamut
   */
  distance?: number;

  /**
   * Clipped color (nearest in-gamut equivalent)
   */
  clippedColor?: Color;

  /**
   * Warning message for user
   */
  warning?: string;
}
```

---

### 4. WCAGContrastResult

WCAG accessibility compliance data.

```typescript
interface WCAGContrastResult {
  /**
   * Contrast ratio (e.g., 4.5, 7.2)
   */
  ratio: number;

  /**
   * Passes AA for normal text (≥4.5:1)
   */
  aaSmall: boolean;

  /**
   * Passes AA for large text (≥3:1)
   */
  aaLarge: boolean;

  /**
   * Passes AAA for normal text (≥7:1)
   */
  aaaSmall: boolean;

  /**
   * Passes AAA for large text (≥4.5:1)
   */
  aaaLarge: boolean;

  /**
   * Highest passing level ('fail' | 'AA' | 'AAA')
   */
  level: "fail" | "AA" | "AAA";

  /**
   * Background color tested against
   */
  background: Color;
}

interface WCAGAnalysis {
  /**
   * Contrast against white background (#FFFFFF)
   */
  onWhite: WCAGContrastResult;

  /**
   * Contrast against black background (#000000)
   */
  onBlack: WCAGContrastResult;

  /**
   * Timestamp of calculation
   */
  calculatedAt: number;
}
```

---

### 5. ColorName

Color naming and identification.

```typescript
interface ColorName {
  /**
   * Human-readable color name
   */
  name: string;

  /**
   * Confidence score (0-1, based on Delta-E)
   * 1.0 = exact match, 0.0 = very different
   */
  confidence: number;

  /**
   * Delta-E 2000 distance from reference color
   */
  deltaE: number;
}

interface ColorNameEntry {
  /**
   * Name of the color
   */
  name: string;

  /**
   * Reference color in OKLCH
   */
  reference: Color;

  /**
   * Category for grouping (optional)
   */
  category?: "red" | "blue" | "green" | "yellow" | "gray" | "other";
}
```

**Color Name Dataset Structure** (~150 entries):

```typescript
const COLOR_NAMES: ColorNameEntry[] = [
  { name: "Red", reference: Color.parse("oklch(54.29% 0.227 29.23)"), category: "red" },
  { name: "Fire Engine Red", reference: Color.parse("oklch(55.52% 0.239 27.33)"), category: "red" },
  { name: "Green", reference: Color.parse("oklch(59.81% 0.151 142.53)"), category: "green" },
  // ... ~150 total entries
];
```

---

### 6. SliderGradient

Dynamic gradient for gamut visualization.

```typescript
interface SliderGradient {
  /**
   * CSS linear-gradient string
   */
  cssGradient: string;

  /**
   * Channel being adjusted
   */
  channel: string;

  /**
   * Fixed channel values
   */
  fixedChannels: Record<string, number>;

  /**
   * Gamut profile used
   */
  gamut: GamutProfile;

  /**
   * Number of gradient stops
   */
  steps: number;
}
```

**Gradient Generation Logic**:

```typescript
interface GradientStep {
  /**
   * Position along slider (0-1)
   */
  position: number;

  /**
   * Color at this position (or transparent if out of gamut)
   */
  color: string;

  /**
   * Whether this step is in gamut
   */
  inGamut: boolean;
}
```

---

## Component Input/Output API

### Component Inputs

```typescript
interface ColorSetterInputs {
  /**
   * Initial color value (any valid color string)
   * Default: '#FF0000'
   */
  initialColor?: string;

  /**
   * Initial color format
   * Default: 'hex'
   */
  initialFormat?: ColorFormat;

  /**
   * Supported gamut profiles
   * Default: ['srgb', 'display-p3', 'unlimited']
   */
  supportedGamuts?: GamutProfile[];

  /**
   * Whether to show color name
   * Default: true
   */
  showColorName?: boolean;

  /**
   * Whether to show WCAG panel
   * Default: true
   */
  showWCAG?: boolean;
}
```

### Component Outputs

```typescript
interface ColorSetterOutputs {
  /**
   * Emitted when color changes
   * Includes color in all formats
   */
  colorChange: EventEmitter<ColorChangeEvent>;

  /**
   * Emitted when format changes
   */
  formatChange: EventEmitter<ColorFormat>;

  /**
   * Emitted when gamut changes
   */
  gamutChange: EventEmitter<GamutProfile>;
}

interface ColorChangeEvent {
  /**
   * Color in requested format
   */
  value: string;

  /**
   * Internal OKLCH representation
   */
  oklch: string;

  /**
   * All format representations
   */
  formats: Record<ColorFormat, string>;

  /**
   * Current WCAG analysis
   */
  wcag: WCAGAnalysis;

  /**
   * Color name
   */
  name: ColorName;

  /**
   * Gamut status
   */
  gamutStatus: GamutCheckResult;
}
```

---

## Validation Rules

### Input Validation

```typescript
interface ValidationResult {
  /**
   * Whether input is valid
   */
  valid: boolean;

  /**
   * Validated/clamped color (if valid or clamped)
   */
  color?: Color;

  /**
   * Error message (if invalid)
   */
  error?: string;

  /**
   * Whether value was clamped
   */
  clamped: boolean;
}
```

**Validation Rules by Format**:

- **HEX**: Must match `/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/`, pad short codes
- **RGB**: Each channel 0-255, clamp out-of-range values
- **HSL**: H: 0-360 (wrap), S/L: 0-100 (clamp)
- **LCH**: L: 0-100 (clamp), C: 0-150 (clamp), H: 0-360 (wrap)
- **OKLCH**: L: 0-100 (clamp), C: 0-0.4 (clamp), H: 0-360 (wrap)
- **LAB**: L: 0-100 (clamp), A/B: -128-+128 (clamp)

---

## Performance Considerations

### Caching Strategy

```typescript
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  hits: number;
}

class LRUCache<K, V> {
  private cache: Map<K, CacheEntry<V>>;
  private maxSize: number = 50;

  get(key: K): V | undefined;
  set(key: K, value: V): void;
  clear(): void;
}
```

**What to Cache**:

- Color name lookups (LRU cache, size 50)
- Gradient CSS strings (keyed by channel+gamut+fixed values)
- WCAG calculations (keyed by color pair)

### Debouncing

```typescript
interface DebouncedOperation {
  operation: "slider" | "naming" | "wcag" | "gradient";
  delay: number;
}

const DEBOUNCE_DELAYS: Record<DebouncedOperation["operation"], number> = {
  slider: 16, // 60fps
  naming: 100, // Naming calculation
  wcag: 100, // WCAG calculation
  gradient: 50, // Gradient generation
};
```

---

## Data Flow

```
User Input
    ↓
Validation & Clamping
    ↓
Update Internal ColorState (OKLCH)
    ↓
    ├→ Convert to Display Format
    ├→ Calculate Color Name (debounced)
    ├→ Calculate WCAG Contrast (debounced)
    ├→ Check Gamut Status
    └→ Generate Slider Gradients (throttled)
    ↓
Update UI & Emit Events
```

---

## Type Exports

```typescript
// src/app/components/color-setter/models/index.ts
export * from "./color-state.model";
export * from "./format-config.model";
export * from "./gamut-profile.model";
export * from "./wcag-contrast.model";
export * from "./color-name.model";
export * from "./slider-gradient.model";
export * from "./validation.model";
```

---

## Next Steps

- Phase 1 continues with API contract definitions
- Generate OpenAPI/TypeScript interfaces for any external APIs (N/A for this component)
- Update quickstart.md with usage examples
