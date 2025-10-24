# Implementation Plan: Database Schema for Freemium Entitlement System

**Branch**: `001-freemium-entitlements` | **Date**: October 24, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-freemium-entitlements/spec.md`

## Summary

Implement a flexible database schema that enables dynamic subscription plan management through an entitlement matrix system. The solution supports both recurring and one-time payment models, uses JSON-based feature configuration for complex settings, maintains single-user accounts with role-based administrative access, and enforces 7-day grace periods for subscription management. Technical approach focuses on PostgreSQL with normalized tables for scalability and efficient query performance for entitlement checks.

## Technical Context

**Language/Version**: TypeScript/Node.js 20+ (backend), SQL (database schema)  
**Primary Dependencies**: PostgreSQL 15+, Prisma ORM, Express.js/Fastify  
**Storage**: PostgreSQL with JSONB for flexible feature configurations  
**Testing**: Jest for unit tests, Supertest for API integration tests  
**Target Platform**: Linux/Docker containers, cloud-native deployment  
**Project Type**: Backend API service (part of existing web application)  
**Performance Goals**: <50ms p95 for entitlement checks, 100k+ concurrent users  
**Constraints**: ACID compliance, referential integrity, sub-second admin operations  
**Scale/Scope**: 5 core tables, 100k+ users, multi-tenant ready architecture

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- ✅ **Dependency Minimalism**: Uses PostgreSQL (essential for ACID compliance) and Prisma (industry standard ORM)
- ✅ **No Framework Overengineering**: Simple normalized schema without complex abstractions
- ✅ **Testable Architecture**: Clear separation between data layer and business logic
- ✅ **Performance Priority**: Indexed queries, efficient JSON operations, optimized for read-heavy workloads
- ✅ **Constitutional Compliance**: Aligns with existing Angular/TypeScript/PostgreSQL stack

## Project Structure

### Documentation (this feature)

```text
specs/001-freemium-entitlements/
├── plan.md              # This file - implementation strategy
├── research.md          # Database design patterns and performance analysis
├── data-model.md        # Entity relationships and schema definitions
├── quickstart.md        # Setup and integration guide
├── contracts/           # API contracts for entitlement service
└── tasks.md             # Detailed implementation tasks
```

### Source Code (repository root)
```text
backend/
├── src/
│   ├── database/
│   │   ├── migrations/           # Database schema migrations
│   │   ├── seeds/               # Initial data (plans, features)
│   │   └── schema.prisma        # Prisma schema definition
│   ├── modules/
│   │   ├── entitlements/
│   │   │   ├── entitlement.service.ts    # Core entitlement logic
│   │   │   ├── entitlement.controller.ts # API endpoints
│   │   │   └── entitlement.repository.ts # Data access layer
│   │   ├── subscriptions/
│   │   │   ├── subscription.service.ts   # Subscription management
│   │   │   └── subscription.repository.ts
│   │   ├── plans/
│   │   │   ├── plan.service.ts          # Plan configuration
│   │   │   └── plan-feature.service.ts  # Feature assignment
│   │   └── admin/
│   │       ├── admin.controller.ts       # Admin panel APIs
│   │       └── admin.middleware.ts       # Role-based access
│   └── types/
│       ├── entitlement.types.ts         # TypeScript interfaces
│       └── subscription.types.ts
└── tests/
    ├── integration/
    │   ├── entitlement-check.test.ts     # End-to-end scenarios
    │   └── admin-operations.test.ts      # Admin workflow tests
    └── unit/
        ├── entitlement.service.test.ts   # Business logic tests
        └── subscription.service.test.ts

frontend/src/app/admin/
├── plan-management/              # Angular components for plan config
├── user-management/             # Subscription oversight
└── entitlement-dashboard/       # Feature usage analytics
```

**Structure Decision**: Extends existing backend/frontend architecture with new modules for entitlement management, integrated with current Angular frontend and Node.js backend structure.

## Implementation Phases

### Phase 0: Research & Design (1-2 days)
- Database schema optimization research
- Performance benchmarking for entitlement queries
- JSON schema validation patterns
- Multi-tenancy considerations

### Phase 1: Core Schema & Services (3-4 days)
- PostgreSQL schema with migrations
- Prisma model definitions
- Core entitlement service implementation
- Basic CRUD operations for plans/features

### Phase 2: Business Logic & Integration (2-3 days)
- Subscription lifecycle management
- Grace period handling
- Role-based admin permissions
- API endpoint development

### Phase 3: Testing & Optimization (2-3 days)
- Performance optimization for entitlement checks
- Integration test coverage
- Load testing with 100k+ users
- Documentation and deployment guides

## Complexity Tracking

*No constitutional violations detected - implementation uses standard patterns within existing architecture.*

## Database Schema Overview

### Core Tables
```sql
-- Users (extends existing user table)
users (
  user_id UUID PRIMARY KEY,
  email VARCHAR UNIQUE,
  password_hash VARCHAR,
  created_at TIMESTAMP
);

-- Subscription Plans
plans (
  plan_id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,           -- 'Free', 'Basic', 'Pro'
  price DECIMAL(10,2),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP
);

-- User Subscriptions
subscriptions (
  subscription_id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(user_id),
  plan_id UUID REFERENCES plans(plan_id),
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  status subscription_status,      -- 'active', 'expired', 'canceled', 'pending'
  payment_type payment_type,       -- 'recurring', 'one_time'
  grace_period_end TIMESTAMP,      -- end_date + 7 days
  created_at TIMESTAMP
);

-- Feature Catalog
features (
  feature_id UUID PRIMARY KEY,
  key_name VARCHAR UNIQUE,         -- 'PDF_EXPORT', 'STORAGE_LIMIT'
  display_name VARCHAR,
  description TEXT,
  is_boolean BOOLEAN,              -- true for on/off, false for limits
  created_at TIMESTAMP
);

-- Entitlement Matrix
plan_features (
  plan_feature_id UUID PRIMARY KEY,
  plan_id UUID REFERENCES plans(plan_id),
  feature_id UUID REFERENCES features(feature_id),
  value JSONB NOT NULL,            -- flexible config: {"enabled": true} or {"limit": 1000}
  created_at TIMESTAMP,
  UNIQUE(plan_id, feature_id)
);

-- Admin Roles (for role-based access control)
admin_roles (
  role_id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(user_id),
  role_name VARCHAR,               -- 'super_admin', 'plan_manager', 'billing_admin'
  permissions JSONB,               -- {"can_edit_plans": true, "can_view_billing": false}
  created_at TIMESTAMP
);
```

### Key Indexes
- `subscriptions(user_id, status)` - Fast user entitlement lookups
- `plan_features(plan_id)` - Efficient plan feature queries
- `features(key_name)` - Quick feature resolution by application code
- `subscriptions(end_date, status)` - Grace period cleanup jobs

## API Design Patterns

### Entitlement Check API
```typescript
// Primary entitlement check - optimized for performance
GET /api/v1/entitlements/check
Query: user_id, feature_key
Response: { allowed: boolean, limit?: number, current_usage?: number }

// Bulk entitlement check for UI rendering
POST /api/v1/entitlements/bulk-check
Body: { user_id, feature_keys: string[] }
Response: { [feature_key]: EntitlementResult }
```

### Admin Configuration APIs
```typescript
// Plan management (role-based access required)
POST /api/v1/admin/plans/{plan_id}/features
PUT /api/v1/admin/plans/{plan_id}/features/{feature_id}
DELETE /api/v1/admin/plans/{plan_id}/features/{feature_id}

// Feature catalog management
POST /api/v1/admin/features
PUT /api/v1/admin/features/{feature_id}
```

## Performance Considerations

- **Entitlement Caching**: Redis cache for frequent checks (TTL: 5 minutes)
- **Database Connection Pooling**: Optimized for read-heavy workloads
- **Query Optimization**: Prepared statements for entitlement checks
- **Graceful Degradation**: Fallback to basic permissions if entitlement service unavailable

## Security & Compliance

- **Data Encryption**: At-rest encryption for subscription and billing data
- **Audit Logging**: All administrative changes logged with user attribution
- **Role-Based Access**: Granular permissions for different admin functions
- **Rate Limiting**: API rate limits to prevent abuse of entitlement endpoints

## Integration Points

1. **Existing User System**: Extends current user authentication
2. **Billing Integration**: Webhooks for subscription status updates
3. **Frontend Dashboard**: Angular components for admin panel
4. **Application Features**: Middleware for feature access control
