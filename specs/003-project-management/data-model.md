# Data Model: Project Management with Undo/Redo Functionality

**Date**: October 25, 2025
**Feature**: Project Management with Undo/Redo Functionality

## Core Entities

### Project

Primary entity representing a user's color exploration project.

```typescript
interface Project {
  id: string; // UUID v4
  userId: string; // Reference to user
  name: string; // User-defined project name
  description?: string; // Optional project description
  colorGamut: ColorGamut; // Color gamut (sRGB, Display P3, Unlimited gamut)
  colorSpace: ColorSpace; // Color space (LCH, OKLCH)
  createdAt: Date; // Creation timestamp
  updatedAt: Date; // Last modification timestamp
  isActive: boolean; // Soft delete flag
}

enum ColorGamut {
  SRGB = "sRGB",
  DISPLAY_P3 = "Display P3",
  UNLIMITED = "Unlimited gamut",
}

enum ColorSpace {
  LCH = "LCH",
  OKLCH = "OKLCH",
}
```

**Validation Rules**:

- `id`: Required, valid UUID v4 format
- `userId`: Required, must reference existing user
- `name`: Required, 1-100 characters, trimmed
- `description`: Optional, max 500 characters
- `colorGamut`: Required, must be valid ColorGamut enum value
- `colorSpace`: Required, must be valid ColorSpace enum value
- `createdAt`: Required, valid ISO date
- `updatedAt`: Required, valid ISO date, must be >= createdAt
- `isActive`: Required boolean

**Business Rules**:

- sRGB gamut provides most restrictive color range for OKLCH values
- Display P3 gamut allows wider color range than sRGB but less than Unlimited
- Unlimited gamut allows any valid Lightness/Chroma/Hue values for OKLCH colors
- Default users limited to 1 active project (isActive = true)
- Subscription users have unlimited active projects
- Project names must be unique per user

### ProjectModification

Represents a tracked change to project properties for undo/redo functionality.

```typescript
interface ProjectModification {
  id: string; // UUID v4
  projectId: string; // Reference to project
  type: ModificationType; // Type of modification
  propertyName: string; // Name of modified property
  previousValue: unknown; // Previous property value
  newValue: unknown; // New property value
  timestamp: Date; // When modification occurred
  commandId: string; // Unique identifier for command
}

enum ModificationType {
  PROPERTY_CHANGE = "property_change",
  INITIAL_STATE = "initial_state",
}
```

**Validation Rules**:

- `id`: Required, valid UUID v4 format
- `projectId`: Required, must reference existing project
- `type`: Required, must be valid ModificationType enum value
- `propertyName`: Required, 1-50 characters, alphanumeric + underscore
- `previousValue`: Serializable value, can be null for initial state
- `newValue`: Required, serializable value
- `timestamp`: Required, valid ISO date
- `commandId`: Required, valid UUID v4 format

**Business Rules**:

- Default users limited to 5 modifications per project
- Subscription users limited to 50 modifications per project
- Modifications stored in sessionStorage, not persisted to backend
- Oldest modifications automatically pruned when limit exceeded

### User (Extended)

Extended user entity to support subscription-based project limits.

```typescript
interface User {
  id: string; // UUID v4
  email: string; // User email
  subscription: SubscriptionType; // Subscription level
  createdAt: Date; // Account creation
  updatedAt: Date; // Last update
}

enum SubscriptionType {
  DEFAULT = "default",
  PREMIUM = "premium",
}
```

**Validation Rules**:

- `subscription`: Required, must be valid SubscriptionType enum value

**Business Rules**:

- DEFAULT subscription: 1 active project, 5 undo/redo operations
- PREMIUM subscription: unlimited projects, 50 undo/redo operations

## Data Relationships

```
User (1) ←→ (many) Project
Project (1) ←→ (many) ProjectModification (server-side persistence)
```

## Storage Strategy

### Backend (PostgreSQL)

- `users` table: User account and subscription information
- `projects` table: Project metadata and current state
- `project_modifications` table: Complete modification history for undo/redo operations
- Real-time persistence: All changes saved immediately to database

### Frontend (Browser Storage)

- `localStorage`: User preferences and session persistence only
- No modification history stored client-side - all undo/redo data retrieved from server

## Database Schema

### projects table

```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color_gamut VARCHAR(20) NOT NULL CHECK (color_gamut IN ('sRGB', 'Display P3', 'Unlimited gamut')),
    color_space VARCHAR(20) NOT NULL CHECK (color_space IN ('LCH', 'OKLCH')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,

    CONSTRAINT unique_project_name_per_user UNIQUE (user_id, name)
        WHERE is_active = true
);

CREATE INDEX idx_projects_user_active ON projects (user_id, is_active);
CREATE INDEX idx_projects_updated_at ON projects (updated_at);
```

### project_modifications table

````sql
CREATE TABLE project_modifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('property_change', 'initial_state')),
    property_name VARCHAR(50) NOT NULL,
    previous_value JSONB,
    new_value JSONB NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    command_id UUID NOT NULL,

    FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE INDEX idx_project_modifications_project ON project_modifications (project_id, timestamp);
CREATE INDEX idx_project_modifications_command ON project_modifications (command_id);
```### users table extension

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription VARCHAR(20)
    DEFAULT 'default'
    CHECK (subscription IN ('default', 'premium'));
````

## Frontend Models

### Command Pattern Implementation

```typescript
interface Command {
  id: string;
  execute(): void;
  undo(): void;
  getModification(): ProjectModification;
}

interface ProjectState {
  project: Project;
  history: ProjectModification[];
  currentIndex: number;
  canUndo: boolean;
  canRedo: boolean;
}
```

This data model supports all required functionality while maintaining clear separation between persistent project data and transient modification history.
