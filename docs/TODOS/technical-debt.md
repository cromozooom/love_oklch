# Technical Debt & Improvements TODO

**Created**: 2025-10-25  
**Priority**: MEDIUM  
**Status**: Backlog Items

## 🔧 Technical Debt Items

### **Authentication System**

#### **1. AuthInterceptor Circular Dependency**

**Status**: ⚠️ WORKAROUND IN PLACE  
**Issue**: AuthInterceptor creates circular dependency with AuthService  
**Current Solution**: Removed interceptor, using manual headers  
**Proper Fix**: Redesign auth flow to avoid circular dependency

**Files**:

- `frontend/src/app/app.config.ts` - Re-enable interceptor
- `frontend/src/app/auth/services/auth.interceptor.ts` - Fix dependency cycle
- `frontend/src/app/auth/services/auth.service.ts` - Remove manual headers

**Implementation Strategy**:

```typescript
// Option 1: Use APP_INITIALIZER for auth state
// Option 2: Lazy load AuthService in interceptor
// Option 3: Split auth verification from main service
```

#### **2. JWT Token Validation**

**Priority**: LOW  
**Issue**: No client-side token expiration checking  
**Impact**: Possible unnecessary API calls with expired tokens

**Implementation**:

```typescript
private isTokenExpired(token: string): boolean {
  const payload = JSON.parse(atob(token.split('.')[1]));
  return payload.exp * 1000 < Date.now();
}
```

### **Error Handling**

#### **3. Global Error Handler**

**Priority**: MEDIUM  
**Issue**: Inconsistent error handling across components  
**Need**: Centralized error handling service

**Files**:

- Create `frontend/src/app/core/services/error-handler.service.ts`
- Update all components to use consistent error handling

#### **4. User Feedback System**

**Priority**: MEDIUM  
**Issue**: No unified notification system  
**Need**: Toast/notification service for user feedback

### **Code Quality**

#### **5. Console Statement Cleanup**

**Priority**: HIGH (Constitution Compliance)  
**Issue**: Debug console statements in production code  
**Required by**: Constitution Principle VIII

**Action Items**:

1. Audit all files for console.log statements
2. Remove or convert to proper logging service
3. Add pre-commit hook to prevent console statements

#### **6. Type Safety Improvements**

**Priority**: MEDIUM  
**Issue**: Some `any` types in codebase  
**Goal**: Strict TypeScript compliance

**Files to Review**:

- All service files for proper typing
- Component inputs/outputs
- API response models

### **Testing**

#### **7. Unit Test Coverage**

**Priority**: MEDIUM  
**Current**: E2E tests exist, unit tests minimal  
**Goal**: 80% unit test coverage

**Focus Areas**:

- AuthService unit tests
- Component logic tests
- Service method tests

#### **8. Mock Data Service**

**Priority**: LOW  
**Issue**: Hardcoded test data in multiple places  
**Need**: Centralized mock data service for testing

### **Performance**

#### **9. Bundle Size Optimization**

**Priority**: LOW  
**Issue**: No bundle analysis performed  
**Action**: Analyze and optimize Angular bundle size

**Tools**:

- webpack-bundle-analyzer
- Angular CLI build analyzer

#### **10. Lazy Loading**

**Priority**: LOW  
**Issue**: All routes loaded eagerly  
**Optimization**: Implement lazy loading for feature modules

## 🏗️ Architecture Improvements

### **11. State Management**

**Priority**: MEDIUM  
**Current**: Service-based state  
**Consider**: NgRx or Akita for complex state management

**Trigger**: When application grows beyond current scope

### **12. Component Organization**

**Priority**: LOW  
**Issue**: Flat component structure  
**Improvement**: Feature-based folder organization

```
src/app/
├── core/           # Singleton services, guards
├── shared/         # Shared components, pipes
├── features/       # Feature modules
│   ├── auth/
│   ├── dashboard/
│   └── profile/
└── layout/         # Layout components
```

### **13. Configuration Management**

**Priority**: MEDIUM  
**Issue**: Environment-specific configs hardcoded  
**Need**: Proper configuration service

**Files**:

- `frontend/src/app/core/services/config.service.ts`
- Environment-specific API endpoints
- Feature flags system

## 📱 User Experience

### **14. Loading States**

**Priority**: MEDIUM  
**Issue**: No loading indicators  
**Need**: Consistent loading states for all async operations

### **15. Responsive Design**

**Priority**: LOW  
**Status**: Not evaluated  
**Action**: Test and improve mobile/tablet experience

### **16. Accessibility (a11y)**

**Priority**: MEDIUM  
**Status**: Not evaluated  
**Action**: WCAG 2.1 compliance audit and improvements

## 🚀 Future Features

### **17. Theme System**

**Priority**: LOW  
**Feature**: Dark/light mode toggle  
**Implementation**: CSS custom properties + service

### **18. Internationalization (i18n)**

**Priority**: LOW  
**Feature**: Multi-language support  
**Tool**: Angular i18n package

### **19. Offline Support**

**Priority**: LOW  
**Feature**: PWA with offline capabilities  
**Tool**: Angular Service Worker

## 📋 Implementation Guidelines

### **Quick Win Criteria**

- Can be completed in < 2 hours
- No breaking changes required
- Immediate user/developer benefit

### **Backlog Prioritization**

1. **HIGH**: Security issues, Constitution compliance
2. **MEDIUM**: User experience, maintainability
3. **LOW**: Nice-to-have features, optimizations

### **Before Starting Any Item**

1. Create feature branch
2. Write tests (if applicable)
3. Update documentation
4. Ensure Constitution compliance
5. Get code review before merging

## 🔄 Review Schedule

- **Weekly**: Review HIGH priority items
- **Monthly**: Assess MEDIUM priority items
- **Quarterly**: Evaluate LOW priority items and architecture decisions

## 📝 Notes

- **Update this file** when adding new technical debt
- **Mark items complete** and move to appropriate documentation
- **Link to related issues** when items become active tasks
- **Constitution compliance** should always take priority
