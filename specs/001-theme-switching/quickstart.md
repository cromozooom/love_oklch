# Theme Switching - Developer Quickstart

## Overview

This guide helps developers implement and test the theme switching feature in the Love OKLCH application.

## Prerequisites

- Angular 18.x development environment
- Authenticated user system (Admin/subscriber roles)
- Playwright testing framework
- PowerShell 7+ for build commands

## Quick Setup

### 1. Development Environment

```powershell
# Navigate to frontend directory
cd frontend

# Install dependencies (if needed)
npm install

# Start development server
npm start
```

### 2. Core Implementation Files

**Theme Service** (`src/app/services/theme.service.ts`)

- Central theme state management using Angular Signals
- localStorage persistence with graceful degradation
- System theme detection via `matchMedia()` API
- Authentication-aware theme controls

**Theme Switcher Component** (`src/app/components/theme-switcher/`)

- Reusable component with three theme buttons (Light, Dark, System)
- Integrates with ThemeService for state and actions
- Handles browser compatibility and authentication state

**Theme Models** (`src/app/models/theme.models.ts`)

- TypeScript types and enums for theme-related data
- localStorage schema definitions
- Theme state interfaces

### 3. CSS Theme System

**Theme Variables** (`src/styles/themes/theme-variables.scss`)

- CSS custom properties for consistent theming
- Light and dark color schemes
- Integration with Tailwind CSS configuration

**Application Styles** (`src/styles/globals.scss`)

- Data attribute selectors: `[data-theme="light|dark"]`
- Responsive theme switching without animations
- Accessibility-focused color contrasts

## Implementation Workflow

### Phase 1: Service Implementation

1. Create `ThemeService` with Angular Signals
2. Implement localStorage persistence with error handling
3. Add system theme detection using `matchMedia()` API
4. Integrate with existing authentication service

### Phase 2: Component Development

1. Create `ThemeSwitcherComponent` with three theme buttons
2. Add visual indicators for current theme selection
3. Handle browser compatibility (disable System mode if unsupported)
4. Implement authentication-based visibility controls

### Phase 3: CSS Integration

1. Define theme CSS custom properties
2. Apply data attributes for theme switching
3. Test theme consistency across all application pages
4. Verify Tailwind CSS integration

### Phase 4: Testing

1. Unit tests for ThemeService logic
2. Component tests for ThemeSwitcherComponent
3. E2E tests for complete user workflows
4. Browser compatibility testing

## Testing Strategy

### Manual Testing Checklist

- [ ] **Authentication**: Login as Admin/subscriber, verify theme controls visible
- [ ] **Theme Switching**: Click Light/Dark buttons, verify immediate visual change
- [ ] **System Detection**: Enable System mode, change OS theme, verify auto-switching
- [ ] **Persistence**: Set theme, refresh browser, verify theme maintained
- [ ] **Cross-Component**: Move theme buttons to different component, verify functionality
- [ ] **Unauthenticated**: Logout, verify theme controls hidden
- [ ] **Browser Support**: Test in browsers without `prefers-color-scheme` support

### Automated Testing

```powershell
# Frontend unit tests
cd frontend
npm test

# E2E tests
cd ../e2e
npx playwright test theme-switching/
```

## Key Integration Points

### Authentication Service

```typescript
// ThemeService constructor
constructor(
  private authService: AuthService // or existing auth mechanism
) {
  // Subscribe to authentication state changes
  this.isAuthenticated = computed(() =>
    this.authService.isAuthenticated() &&
    this.authService.hasRole(['admin', 'subscriber'])
  );
}
```

### Dashboard Component Integration

```typescript
// dashboard.component.ts - existing file
export class DashboardComponent {
  // Add theme switcher to template
  // No additional logic needed - component handles everything
}
```

```html
<!-- dashboard.component.html -->
<div class="dashboard-header">
  <!-- existing header content -->
  <app-theme-switcher></app-theme-switcher>
</div>
```

## Troubleshooting

### Common Issues

**Theme not persisting across sessions**

- Check localStorage permissions in browser
- Verify JSON serialization in ThemeService
- Test graceful degradation fallback

**System theme not working**

- Verify browser supports `prefers-color-scheme`
- Check `matchMedia()` API availability
- Confirm event listeners are properly attached

**Theme controls visible for unauthenticated users**

- Verify AuthService integration in ThemeService
- Check authentication signal updates
- Test role-based access control

**Styles not updating immediately**

- Confirm CSS custom properties are properly defined
- Verify data attribute application on document element
- Check for CSS specificity conflicts

### Debug Commands

```powershell
# Check theme preference in localStorage
# (Run in browser DevTools console)
localStorage.getItem('love-oklch-theme')

# Test system theme detection
window.matchMedia('(prefers-color-scheme: dark)').matches

# Verify authentication state
# (Angular DevTools or component inspection)
```

## Performance Considerations

- Theme switching should complete in <1 second
- System theme detection should respond in <2 seconds
- Minimal DOM updates (CSS custom properties only)
- No layout thrashing during theme changes

## Browser Support

- **Full support**: Modern browsers with `prefers-color-scheme`
- **Partial support**: Older browsers (Light/Dark modes only)
- **Graceful degradation**: System mode disabled with tooltip
- **Fallback**: Light theme when localStorage unavailable

## Next Steps

After implementing the theme switching feature:

1. User testing for accessibility and usability
2. Performance monitoring in production
3. Analytics for theme usage patterns
4. Future enhancements (custom themes, accent colors)
