# Authentication Security Improvements TODO

**Created**: 2025-10-25  
**Priority**: HIGH SECURITY  
**Status**: Pending Implementation

## 🚨 Current Security Issues Identified

### **localStorage Data Exposure**

Currently storing in localStorage:

```json
{
  "user": {
    "id": "1119f3c3-4e53-425e-9cc8-3f26743c1308",
    "email": "admin@example.com",
    "role": "admin",
    "name": "Admin User"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### **Attack Vectors**

- ❌ XSS attacks can steal tokens and user data
- ❌ Malicious browser extensions can access localStorage
- ❌ Shared computers expose sensitive admin credentials
- ❌ JWT token visible in dev tools
- ❌ Admin role exposed to any script

## ✅ Immediate Fixes Applied

### **1. Reduced localStorage Footprint**

- ✅ **DONE**: Modified `storeAuthData()` to only store minimal user data:
  ```json
  {
    "id": "uuid",
    "role": "admin"
    // email and name removed from storage
  }
  ```

### **2. Smart User Data Retrieval**

- ✅ **DONE**: Updated `getCurrentUser()` to extract full user details from JWT token when needed
- ✅ **DONE**: Maintains UI functionality while reducing stored data

## 🛡️ Additional Security Improvements Needed

### **Priority 1: High Impact**

#### **1. Implement HttpOnly Cookies**

**Impact**: Prevents XSS token theft completely  
**Effort**: Medium (requires backend changes)  
**Files**:

- `backend/src/controllers/AuthController.ts` - Set httpOnly cookies
- `frontend/src/app/auth/services/auth.service.ts` - Remove localStorage token storage
- `frontend/src/app/auth/services/auth.interceptor.ts` - Cookies sent automatically

**Implementation**:

```typescript
// Backend: Set httpOnly cookie instead of returning JWT
res.cookie("auth_token", jwt, {
  httpOnly: true,
  secure: true,
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

// Frontend: Remove token from localStorage entirely
// Cookies automatically included in requests
```

#### **2. Add Content Security Policy**

**Impact**: Prevents XSS attacks  
**Effort**: Low  
**Files**: `frontend/src/index.html`

**Implementation**:

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';" />
```

#### **3. Implement Auto-logout on Tab Close (Non-Remember Mode)**

**Impact**: Clears session data when user doesn't choose "Remember Me"  
**Effort**: Low  
**Files**: `frontend/src/app/auth/services/auth.service.ts`

**Implementation**:

```typescript
// Add to constructor
window.addEventListener("beforeunload", () => {
  const rememberMe = localStorage.getItem(this.REMEMBER_KEY) === "true";
  if (!rememberMe) {
    this.clearStoredData();
  }
});
```

### **Priority 2: Medium Impact**

#### **4. Token Encryption in Storage**

**Impact**: Obfuscates JWT even if localStorage is compromised  
**Effort**: Medium  
**Dependencies**: crypto-js or Web Crypto API

**Implementation**:

```typescript
import CryptoJS from 'crypto-js';

private encryptToken(token: string): string {
  const secretKey = 'user-specific-key'; // Derive from user data
  return CryptoJS.AES.encrypt(token, secretKey).toString();
}

private decryptToken(encryptedToken: string): string {
  const secretKey = 'user-specific-key';
  const bytes = CryptoJS.AES.decrypt(encryptedToken, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
}
```

#### **5. Implement Short-lived Access Tokens**

**Impact**: Reduces window of token abuse  
**Effort**: High (requires backend token refresh system)  
**Files**: Backend AuthController, Frontend AuthService

**Implementation**:

- Access tokens: 15 minutes
- Refresh tokens: 7 days
- Automatic silent refresh before expiration

#### **6. Add Session Fingerprinting**

**Impact**: Detects token theft across different environments  
**Effort**: Medium  
**Implementation**: Store browser fingerprint with session, validate on each request

### **Priority 3: Nice to Have**

#### **7. Implement Logout on Multiple Failed Requests**

**Impact**: Auto-logout on potential token tampering  
**Effort**: Low

#### **8. Add Security Headers**

**Impact**: Additional XSS/CSRF protection  
**Effort**: Low  
**Implementation**: Add security headers to all responses

## 📊 Current Risk Assessment

| **Risk**            | **Before** | **After Immediate Fixes** | **After All Improvements** |
| ------------------- | ---------- | ------------------------- | -------------------------- |
| XSS Token Theft     | 🔴 HIGH    | 🟡 MEDIUM                 | 🟢 LOW                     |
| Admin Role Exposure | 🔴 HIGH    | 🟡 MEDIUM                 | 🟢 LOW                     |
| Email/Name Exposure | 🔴 HIGH    | 🟢 LOW                    | 🟢 LOW                     |
| Session Hijacking   | 🔴 HIGH    | 🟡 MEDIUM                 | 🟢 LOW                     |
| CSRF Attacks        | 🟡 MEDIUM  | 🟡 MEDIUM                 | 🟢 LOW                     |

## 🎯 Implementation Plan

### **Phase 1 (Quick Wins - 1-2 hours)**

1. ✅ Reduce localStorage data (DONE)
2. Add Content Security Policy
3. Implement auto-logout on tab close
4. Add security headers

### **Phase 2 (Backend Changes - 4-6 hours)**

1. Implement httpOnly cookies
2. Remove JWT from localStorage completely
3. Update auth interceptor for cookie-based auth

### **Phase 3 (Advanced Security - 8-10 hours)**

1. Implement token refresh system
2. Add session fingerprinting
3. Token encryption
4. Comprehensive security testing

## 🧪 Testing Requirements

### **Security Tests Needed**

1. XSS attack simulation
2. Token theft prevention validation
3. Session hijacking tests
4. Cross-browser security validation
5. CSRF attack prevention tests

### **Functional Tests**

1. Authentication still works after security changes
2. User experience remains smooth
3. Remember Me functionality preserved
4. Auto-logout works correctly

## 📝 Notes

- **Current Status**: Basic security improvements applied
- **Next Session**: Implement Phase 1 quick wins
- **Constitution Compliance**: New security measures align with Principle VIII (Production Code Cleanliness)
- **Testing**: All security changes must pass E2E tests before deployment
