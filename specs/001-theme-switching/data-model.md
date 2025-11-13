# Data Model: Theme Switching

## Core Entities

### ThemePreference

Represents user's selected theme preference stored in localStorage.

**Fields:**

- `mode`: ThemeMode - The user's selected theme mode (Light, Dark, System)
- `version`: number - Schema version for future migrations (default: 1)

**Validation Rules:**

- `mode` must be one of: 'light', 'dark', 'system'
- `version` must be positive integer
- JSON structure must be valid for localStorage serialization

**Lifecycle:**

- Created: When user first selects a theme
- Updated: When user changes theme preference
- Deleted: Never (graceful degradation to default)

### ThemeState

Represents the current active theme being applied to the application.

**Fields:**

- `currentTheme`: 'light' | 'dark' - Currently applied visual theme
- `preferenceMode`: ThemeMode - User's preference setting
- `isSystemSupported`: boolean - Whether browser supports system theme detection
- `isAuthenticated`: boolean - Whether user has access to theme controls

**State Transitions:**

- Initial State: `{ currentTheme: 'light', preferenceMode: 'light', isSystemSupported: false, isAuthenticated: false }`
- Authentication: Updates `isAuthenticated` based on user login status
- System Detection: Updates `isSystemSupported` based on browser capability
- Theme Change: Updates `currentTheme` and `preferenceMode` based on user selection
- OS Change: Updates `currentTheme` when system theme changes (System mode only)

### ThemeMode

Enumeration of available theme selection modes.

**Values:**

- `'light'` - Force light theme regardless of system preference
- `'dark'` - Force dark theme regardless of system preference
- `'system'` - Automatically follow operating system theme preference

**Constraints:**

- Must be string literal type for TypeScript safety
- Must match localStorage serialization format
- Must align with CSS theme class names

## Storage Schema

### localStorage Structure

```json
{
  "love-oklch-theme": {
    "mode": "light" | "dark" | "system",
    "version": 1
  }
}
```

**Storage Rules:**

- Single localStorage key for all theme preferences
- JSON serialization for structured data
- Version field enables future schema migrations
- Fallback to default when key missing or invalid
- Graceful handling when localStorage disabled

## Integration Points

### Authentication System

- **Dependency**: Existing AuthService or authentication guard
- **Integration**: ThemeService subscribes to authentication state
- **Constraint**: Theme controls only visible for authenticated users (Admin, subscribers)

### CSS Theme System

- **Implementation**: CSS custom properties with data attributes
- **Structure**: `[data-theme="light|dark"]` on document root
- **Variables**: Standardized CSS custom property names for colors

### Browser APIs

- **System Detection**: `window.matchMedia('(prefers-color-scheme: dark)')`
- **Change Listening**: `MediaQueryList.addEventListener('change', handler)`
- **Feature Detection**: Check `matchMedia` support before System mode

## Validation & Constraints

### Data Validation

- Theme mode values must match enum
- localStorage JSON must parse successfully
- Version numbers must be compatible
- Fallback values always available

### Business Rules

- Authenticated users only: Theme controls hidden for unauthenticated users
- System mode availability: Disabled with tooltip on unsupported browsers
- Persistence scope: Each device maintains independent preference
- Default behavior: Light theme when no preference set or localStorage unavailable

### Performance Constraints

- Theme switching response: <1 second (per SC-001)
- System theme detection: <2 seconds (per SC-003)
- Memory usage: Minimal overhead for theme state
- DOM updates: Efficient CSS custom property changes only
