# API Contracts: Project Management

**Date**: October 25, 2025
**Feature**: Project Management with Undo/Redo Functionality

## Base URL

All endpoints are relative to the application base URL with `/api/v1` prefix.

## Authentication

All endpoints require authentication via Bearer token in the Authorization header.

```
Authorization: Bearer <jwt-token>
```

## Project Management Endpoints

### GET /projects

Retrieve all projects for the authenticated user.

**Request**:

```http
GET /api/v1/projects
Authorization: Bearer <jwt-token>
```

**Query Parameters**:

- `active`: boolean (optional) - Filter by active status, defaults to `true`
- `limit`: number (optional) - Max results, defaults to 50, max 100
- `offset`: number (optional) - Pagination offset, defaults to 0

**Response 200**:

```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "userId": "550e8400-e29b-41d4-a716-446655440001",
        "name": "Sunset Color Palette",
        "description": "Exploring warm sunset colors",
        "colorGamut": "Display P3",
        "colorSpace": "OKLCH",
        "createdAt": "2025-01-15T10:30:00Z",
        "updatedAt": "2025-01-15T14:45:00Z",
        "isActive": true
      }
    ],
    "total": 1,
    "limit": 50,
    "offset": 0
  }
}
```

**Response 403** (Subscription limit exceeded):

```json
{
  "success": false,
  "error": {
    "code": "SUBSCRIPTION_LIMIT_EXCEEDED",
    "message": "Default subscription allows only 1 active project",
    "details": {
      "currentCount": 1,
      "maxAllowed": 1,
      "subscriptionType": "default"
    }
  }
}
```

### POST /projects

Create a new project.

**Request**:

```http
POST /api/v1/projects
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "Ocean Blues",
  "description": "Exploring oceanic color palettes",
  "colorGamut": "sRGB",
  "colorSpace": "OKLCH"
}
```

**Validation Rules**:

- `name`: Required, 1-100 characters, trimmed
- `description`: Optional, max 500 characters
- `colorGamut`: Required, must be one of: "sRGB", "Display P3", "Unlimited gamut"
- `colorSpace`: Required, must be one of: "LCH", "OKLCH"

**Response 201**:

```json
{
  "success": true,
  "data": {
    "project": {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "userId": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Ocean Blues",
      "description": "Exploring oceanic color palettes",
      "colorMode": "oklch",
      "colorGamut": "srgb",
      "colorSpace": "srgb",
      "createdAt": "2025-01-15T15:00:00Z",
      "updatedAt": "2025-01-15T15:00:00Z",
      "isActive": true
    }
  }
}
```

**Response 400** (Validation error):

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid project data",
    "details": {
      "name": ["Name is required and must be 1-100 characters"],
      "colorSpace": ["Color space 'display-p3' incompatible with gamut 'srgb'"]
    }
  }
}
```

**Response 403** (Subscription limit):

```json
{
  "success": false,
  "error": {
    "code": "PROJECT_LIMIT_EXCEEDED",
    "message": "Default subscription allows only 1 active project. Upgrade to premium for unlimited projects.",
    "details": {
      "currentCount": 1,
      "maxAllowed": 1,
      "subscriptionType": "default"
    }
  }
}
```

**Response 409** (Name conflict):

```json
{
  "success": false,
  "error": {
    "code": "PROJECT_NAME_EXISTS",
    "message": "A project with this name already exists",
    "details": {
      "conflictingName": "Ocean Blues"
    }
  }
}
```

### GET /projects/{id}

Retrieve a specific project by ID.

**Request**:

```http
GET /api/v1/projects/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <jwt-token>
```

**Response 200**:

```json
{
  "success": true,
  "data": {
    "project": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Sunset Color Palette",
      "description": "Exploring warm sunset colors",
      "colorMode": "oklch",
      "colorGamut": "p3",
      "colorSpace": "display-p3",
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-01-15T14:45:00Z",
      "isActive": true
    }
  }
}
```

**Response 404**:

```json
{
  "success": false,
  "error": {
    "code": "PROJECT_NOT_FOUND",
    "message": "Project not found or access denied"
  }
}
```

### PUT /projects/{id}

Update an existing project.

**Request**:

```http
PUT /api/v1/projects/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "Updated Sunset Palette",
  "description": "Enhanced sunset color exploration",
  "colorMode": "hsla",
  "colorGamut": "p3",
  "colorSpace": "display-p3"
}
```

**Response 200**:

```json
{
  "success": true,
  "data": {
    "project": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Updated Sunset Palette",
      "description": "Enhanced sunset color exploration",
      "colorMode": "hsla",
      "colorGamut": "p3",
      "colorSpace": "display-p3",
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-01-15T16:15:00Z",
      "isActive": true
    }
  }
}
```

**Response 400/404/409**: Same error responses as POST /projects

### DELETE /projects/{id}

Soft delete a project (set isActive = false).

**Request**:

```http
DELETE /api/v1/projects/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <jwt-token>
```

**Response 204**: No content (successful deletion)

**Response 404**: Same as GET /projects/{id}

## Project Modifications Endpoints

### GET /projects/{id}/modifications

Retrieve modification history for a project (for undo/redo functionality).

**Request**:

```http
GET /api/v1/projects/550e8400-e29b-41d4-a716-446655440000/modifications
Authorization: Bearer <jwt-token>
```

**Query Parameters**:

- `limit`: number (optional) - Max results, defaults to 50 based on subscription
- `offset`: number (optional) - Pagination offset, defaults to 0

**Response 200**:

```json
{
  "success": true,
  "data": {
    "modifications": [
      {
        "id": "750e8400-e29b-41d4-a716-446655440003",
        "projectId": "550e8400-e29b-41d4-a716-446655440000",
        "type": "property_change",
        "propertyName": "colorGamut",
        "previousValue": "sRGB",
        "newValue": "Display P3",
        "timestamp": "2025-01-15T14:45:00Z",
        "commandId": "850e8400-e29b-41d4-a716-446655440004"
      }
    ],
    "total": 1,
    "subscriptionLimit": 50,
    "remainingOperations": 49
  }
}
```

### POST /projects/{id}/modifications

Record a new project modification (called on every project change).

**Request**:

```http
POST /api/v1/projects/550e8400-e29b-41d4-a716-446655440000/modifications
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "type": "property_change",
  "propertyName": "colorSpace",
  "previousValue": "LCH",
  "newValue": "OKLCH",
  "commandId": "950e8400-e29b-41d4-a716-446655440005"
}
```

**Response 201**:

```json
{
  "success": true,
  "data": {
    "modification": {
      "id": "a50e8400-e29b-41d4-a716-446655440006",
      "projectId": "550e8400-e29b-41d4-a716-446655440000",
      "type": "property_change",
      "propertyName": "colorSpace",
      "previousValue": "LCH",
      "newValue": "OKLCH",
      "timestamp": "2025-01-15T15:30:00Z",
      "commandId": "950e8400-e29b-41d4-a716-446655440005"
    }
  }
}
```

**Response 403** (Subscription limit exceeded):

```json
{
  "success": false,
  "error": {
    "code": "UNDO_REDO_LIMIT_EXCEEDED",
    "message": "Subscription limit reached for undo/redo operations",
    "details": {
      "currentCount": 50,
      "maxAllowed": 50,
      "subscriptionType": "premium"
    }
  }
}
```

## Subscription Management Endpoints

### GET /user/subscription

Get current user's subscription information and limits.

**Request**:

```http
GET /api/v1/user/subscription
Authorization: Bearer <jwt-token>
```

**Response 200**:

```json
{
  "success": true,
  "data": {
    "subscription": {
      "type": "default",
      "limits": {
        "maxActiveProjects": 1,
        "maxUndoRedoOperations": 5
      },
      "usage": {
        "activeProjects": 1,
        "availableProjects": 0
      }
    }
  }
}
```

For premium subscription:

```json
{
  "success": true,
  "data": {
    "subscription": {
      "type": "premium",
      "limits": {
        "maxActiveProjects": null,
        "maxUndoRedoOperations": 50
      },
      "usage": {
        "activeProjects": 15,
        "availableProjects": null
      }
    }
  }
}
```

## Error Response Format

All error responses follow this consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // Additional error-specific details
    }
  }
}
```

## Common Error Codes

- `VALIDATION_ERROR`: Request data validation failed
- `PROJECT_NOT_FOUND`: Project doesn't exist or access denied
- `PROJECT_NAME_EXISTS`: Project name already exists for user
- `PROJECT_LIMIT_EXCEEDED`: Subscription project limit reached
- `SUBSCRIPTION_LIMIT_EXCEEDED`: General subscription limit error
- `UNAUTHORIZED`: Invalid or missing authentication
- `FORBIDDEN`: Valid auth but insufficient permissions
- `INTERNAL_ERROR`: Server error (500)

## Rate Limiting

All endpoints are rate limited:

- Default users: 100 requests/minute
- Premium users: 500 requests/minute

Rate limit headers included in all responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642252800
```
