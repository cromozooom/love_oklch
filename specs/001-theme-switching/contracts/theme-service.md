# Theme Service API Contract

## ThemeService Interface

### Public Methods

```typescript
interface ThemeService {
  // State management
  currentTheme: Signal<"light" | "dark">;
  preferenceMode: Signal<ThemeMode>;
  isSystemSupported: Signal<boolean>;
  isAuthenticated: Signal<boolean>;

  // Actions
  setTheme(mode: ThemeMode): void;
  initialize(): void;

  // Computed states
  readonly isThemeControlsVisible: Signal<boolean>;
  readonly availableThemeModes: Signal<ThemeMode[]>;
}

type ThemeMode = "light" | "dark" | "system";
```

### Method Specifications

#### `setTheme(mode: ThemeMode): void`

**Purpose**: Change user's theme preference and apply it immediately
**Preconditions**:

- User must be authenticated (Admin or subscriber)
- Mode must be valid ThemeMode value
  **Postconditions**:
- Theme applied to DOM within 1 second
- Preference saved to localStorage (if available)
- All components reflect new theme immediately
  **Side Effects**:
- Updates CSS custom properties on document element
- Triggers signal updates for reactive components
- May show notification if localStorage unavailable

#### `initialize(): void`

**Purpose**: Setup theme service on application startup
**Preconditions**: Called once during app initialization
**Postconditions**:

- Theme state initialized from localStorage or defaults
- System theme detection configured (if supported)
- Authentication state listeners established
  **Side Effects**:
- Adds event listeners for system theme changes
- Applies saved theme preference to DOM
- Sets up localStorage graceful degradation

### Signal Contracts

#### `currentTheme: Signal<'light' | 'dark'>`

**Values**: 'light' | 'dark' (never null/undefined)
**Updates**: When user changes theme or system theme changes (System mode)
**Default**: 'light'

#### `preferenceMode: Signal<ThemeMode>`

**Values**: 'light' | 'dark' | 'system'
**Updates**: When user selects different theme mode
**Default**: 'light'

#### `isSystemSupported: Signal<boolean>`

**Values**: true if browser supports `prefers-color-scheme`, false otherwise
**Updates**: Set once during initialization, never changes
**Usage**: Determines if System mode option is available

#### `isAuthenticated: Signal<boolean>`

**Values**: true for Admin/subscriber users, false for unauthenticated
**Updates**: When authentication state changes
**Usage**: Controls theme controls visibility

## Component Interface

### ThemeSwitcherComponent

```typescript
interface ThemeSwitcherComponent {
  // No inputs required - uses injected ThemeService

  // Event handlers
  onThemeSelect(mode: ThemeMode): void;

  // Template helpers
  getThemeIcon(mode: ThemeMode): string;
  getThemeLabel(mode: ThemeMode): string;
  isSystemModeDisabled(): boolean;
}
```

### Component Contract

#### Template Requirements

- Three buttons for Light, Dark, System themes
- Visual indication of currently selected theme
- Disabled state with tooltip for System mode on unsupported browsers
- Hidden/disabled when user not authenticated

#### Styling Requirements

- Uses Tailwind CSS utility classes
- No custom animations (instant theme switching)
- Accessible button states and focus indicators
- Responsive design for different screen sizes

## localStorage Contract

### Key Structure

```typescript
interface ThemeStorage {
  "love-oklch-theme": {
    mode: ThemeMode;
    version: number;
  };
}
```

### Storage Operations

#### Save Operation

```typescript
// Successful save
localStorage.setItem(
  "love-oklch-theme",
  JSON.stringify({
    mode: selectedMode,
    version: 1,
  })
);

// Error handling
try {
  // save operation
} catch (error) {
  // Graceful degradation - continue with session-only theme
  console.warn("Theme preference could not be saved");
}
```

#### Load Operation

```typescript
// Successful load
const stored = localStorage.getItem("love-oklch-theme");
const preference = stored ? JSON.parse(stored) : { mode: "light", version: 1 };

// Error handling - invalid JSON or missing key
const preference = { mode: "light", version: 1 }; // fallback
```

## CSS Contract

### Theme Application

```css
/* Applied to document element */
[data-theme="light"] {
  --color-background: #ffffff;
  --color-text: #000000;
  /* ... other theme variables */
}

[data-theme="dark"] {
  --color-background: #000000;
  --color-text: #ffffff;
  /* ... other theme variables */
}
```

### System Theme Detection

```css
/* Fallback for browsers without JavaScript */
@media (prefers-color-scheme: dark) {
  :root {
    --color-background: #000000;
    --color-text: #ffffff;
  }
}
```

## Error Handling Contract

### localStorage Errors

- **QuotaExceededError**: Graceful degradation to session-only theme
- **SecurityError**: Graceful degradation with user notification
- **Invalid JSON**: Fallback to default light theme

### System Theme Detection Errors

- **matchMedia not supported**: Disable System mode, show tooltip
- **Event listener errors**: Fall back to manual theme switching only

### Authentication Errors

- **No auth service**: Hide theme controls completely
- **Auth state changes**: Immediately update theme controls visibility
