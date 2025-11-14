# Research: Theme Switching Implementation

## Angular Signals for Theme State Management

**Decision**: Use Angular Signals with computed values for reactive theme state management
**Rationale**:

- Angular Signals provide excellent reactivity for theme state changes
- Computed signals automatically update when theme preference or system theme changes
- Better performance than RxJS observables for simple state management
- Follows constitution requirement for centralized state store

**Alternatives considered**:

- Pure RxJS BehaviorSubject - more complex for simple state
- Component-level state - violates centralized state requirement
- NgRx - prohibited by constitution (legacy state library)

## CSS Custom Properties for Theme Implementation

**Decision**: Use CSS custom properties (CSS variables) with data attributes for theme switching
**Rationale**:

- Instant theme switching without CSS transitions (per clarification)
- Works with Tailwind CSS using custom property configuration
- Better browser support than CSS-in-JS solutions
- Allows runtime theme changes without rebuilding styles

**Alternatives considered**:

- CSS-in-JS solutions - adds unnecessary complexity
- Separate CSS files per theme - requires dynamic loading
- SCSS mixins - compile-time only, not runtime switchable

## localStorage Key Strategy

**Decision**: Use structured localStorage key with fallback handling
**Rationale**:

- Single key 'love-oklch-theme' with JSON value containing theme preference
- Graceful degradation when localStorage unavailable (per clarification)
- Supports versioning for future theme preference extensions

**Alternatives considered**:

- Multiple localStorage keys - harder to manage
- sessionStorage - doesn't persist across sessions
- IndexedDB - overkill for simple preference storage

## System Theme Detection Implementation

**Decision**: Use `matchMedia('(prefers-color-scheme: dark)')` with change listeners
**Rationale**:

- Standard web API with excellent browser support
- Automatic detection of OS theme changes
- Can be polyfilled for older browsers
- Integrates well with Angular lifecycle

**Alternatives considered**:

- CSS-only approach - no JavaScript control needed
- Third-party libraries - violates minimal dependencies principle
- Custom polling - inefficient and unreliable

## Authentication Integration Strategy

**Decision**: Inject existing AuthService/Guard into ThemeService for user state
**Rationale**:

- Leverage existing authentication system
- Theme service reactive to authentication state changes
- Clean separation of concerns
- No duplication of authentication logic

**Alternatives considered**:

- Duplicate authentication logic - violates DRY principle
- Theme service independent of auth - violates requirement FR-002
- Manual authentication checks - error-prone

## Browser Compatibility Handling

**Decision**: Feature detection with graceful degradation for System theme mode
**Rationale**:

- Check `window.matchMedia` support before enabling System mode
- Show disabled state with tooltip for unsupported browsers
- Light and Dark modes work universally
- Maintains functionality for maximum users

**Alternatives considered**:

- Polyfills for older browsers - adds dependency complexity
- Hide entire feature on old browsers - reduces accessibility
- Error messages - poor user experience

## Component Architecture

**Decision**: Separate ThemeSwitcherComponent for reusability across the application
**Rationale**:

- Can be moved between components as required (FR-012)
- Single responsibility principle
- Easier testing and maintenance
- Follows Angular component best practices

**Alternatives considered**:

- Inline theme buttons in each component - code duplication
- Single dashboard-only implementation - not reusable
- Service-only approach - no UI consistency
