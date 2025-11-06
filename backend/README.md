# Love OKLCH Backend - Freemium Entitlement System

Backend API service for the Love OKLCH color management application with freemium subscription management.

## Phase 1 Setup - Completed ✅

### Quick Start

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Start PostgreSQL with Docker:**
   ```bash
   npm run docker:up
   ```

3. **Generate Prisma client:**
   ```bash
   npm run db:generate
   ```

4. **Run database migrations:**
   ```bash
   npm run db:push
   ```

5. **Seed the database:**
   ```bash
   npm run db:seed
   ```

6. **Start development server:**
   ```bash
   npm run dev
   ```

### Architecture

- **Database**: PostgreSQL 15+ with Prisma ORM
- **Language**: TypeScript/Node.js 20+
- **Testing**: Jest with supertest for API testing
- **Containerization**: Docker Compose for local development

### Environment Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update environment variables as needed for your setup.

### Database Schema

The system includes the following core entities:

- **Users**: Authentication and user management
- **Plans**: Subscription plans (Free, Basic, Pro)
- **Features**: Feature catalog with flexible JSON configuration
- **Subscriptions**: User subscription management with grace periods
- **PlanFeatures**: Entitlement matrix linking plans to features
- **AdminRoles**: Role-based access control for administration
- **FeatureUsage**: Usage tracking for quota enforcement

### Seeded Data

After running the seed script, you'll have:

- 3 subscription plans (Free, Basic, Pro)
- 7 features with different configurations per plan
- 4 test users with different subscription levels
- 1 admin user with full permissions

### Test Users

- `free.user@example.com` - Free plan user
- `basic.user@example.com` - Basic plan user  
- `pro.user@example.com` - Pro plan user
- `admin@example.com` - System administrator

All test users have password: `password123`

### Available Scripts

- `npm run build` - Build TypeScript to JavaScript
- `npm run dev` - Start development server with hot reload
- `npm run test` - Run Jest tests
- `npm run test:coverage` - Run tests with coverage report
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with initial data
- `npm run docker:up` - Start PostgreSQL container
- `npm run docker:down` - Stop PostgreSQL container

### Docker Services

The Docker Compose configuration includes:

- **PostgreSQL 15**: Main database (port 5432)
- **PostgreSQL Test**: Test database (port 5433) 

### Next Steps

Phase 1 (Setup) is complete. Next phases will implement:

- Phase 2: Foundational infrastructure (repositories, services, middleware)
- Phase 3: User Story 1 - Admin configuration interface
- Phase 4: User Story 2 - Entitlement checking system
- Phase 5: User Story 3 - Subscription lifecycle management

## Development

### Project Structure

```
backend/
├── src/
│   ├── database/
│   │   ├── schema.prisma      # Prisma schema definition
│   │   └── seed.ts           # Database seeding script
│   ├── models/               # TypeScript models (Phase 2)
│   ├── repositories/         # Data access layer (Phase 2)
│   ├── services/            # Business logic (Phase 2)
│   ├── controllers/         # API endpoints (Phase 2)
│   ├── middleware/          # Express middleware (Phase 2)
│   └── types/               # TypeScript type definitions (Phase 2)
├── tests/
│   └── setup.ts             # Jest test configuration
├── docker/
│   └── docker-compose.yml   # PostgreSQL container setup
└── database/
    ├── init/                # Database initialization scripts
    └── seeds/               # SQL seed data
```

### Configuration

The application uses environment variables for configuration:

- **Database**: Connection strings and credentials
- **Security**: JWT secrets and bcrypt rounds
- **Features**: Grace period days, cache TTL
- **CORS**: Frontend origin and credentials
- **Logging**: Log level and format

See `.env.example` for all available configuration options.