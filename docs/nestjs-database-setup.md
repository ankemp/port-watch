# NestJS Database Setup Best Practices

**Related Issue:** #34 - Database Setup - PostgreSQL Schema and Migrations  
**Date:** October 16, 2025  
**Framework:** NestJS with PostgreSQL

## Table of Contents

1. [ORM Selection](#orm-selection)
2. [Database Configuration](#database-configuration)
3. [Schema Design](#schema-design)
4. [Migration Strategy](#migration-strategy)
5. [Best Practices](#best-practices)
6. [Security Considerations](#security-considerations)
7. [Testing Strategy](#testing-strategy)

---

## ORM Selection

### Recommended ORMs for NestJS + PostgreSQL

#### 1. **Prisma** (Recommended for this project)

**Pros:**

- Modern, type-safe ORM with excellent TypeScript support
- Auto-generated types from schema
- Intuitive migration system (`prisma migrate`)
- Great developer experience with Prisma Studio
- Built-in query builder with strong typing
- Excellent documentation

**Cons:**

- Slightly different from traditional ORMs (no decorators on entities)
- Less flexible for complex queries compared to raw SQL

**When to use:** New projects, teams prioritizing developer experience and type safety

#### 2. **TypeORM**

**Pros:**

- Most popular ORM in NestJS ecosystem
- Decorator-based entities (familiar to Angular developers)
- Supports multiple databases
- Active Record and Data Mapper patterns
- Extensive community resources

**Cons:**

- Less type-safe than Prisma
- `synchronize: true` is dangerous in production
- More boilerplate code

**When to use:** Teams familiar with decorator-based ORMs, need for complex relationships

### Decision for Port-Watch: **Prisma**

**Rationale:**

- Better type safety aligns with our TypeScript-first approach
- Simpler migration strategy
- Auto-generated types reduce boilerplate
- Excellent for multi-table relationships (users, hosts, containers, etc.)

---

## Database Configuration

### Step 1: Install Dependencies

```bash
npm install --save @prisma/client
npm install --save-dev prisma
```

### Step 2: Initialize Prisma

```bash
npx prisma init
```

This creates:

- `prisma/schema.prisma` - Database schema definition
- `.env` - Environment variables (including DATABASE_URL)

### Step 3: Configure PostgreSQL Connection

**`prisma/schema.prisma`:**

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

**`.env`:**

```bash
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA
DATABASE_URL="postgresql://postgres:password@localhost:5432/port_watch?schema=public"
```

**Environment Variables (Production):**

```bash
# Use different URLs for different environments
DATABASE_URL="${DB_PROTOCOL}://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=${DB_SCHEMA}"

# Connection pooling (for production)
DATABASE_URL="postgresql://user:password@host:5432/db?schema=public&connection_limit=10&pool_timeout=20"
```

### Step 4: Create Prisma Service

**`src/prisma/prisma.service.ts`:**

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    // Connect to database when module initializes
    await this.$connect();
    console.log('Database connected successfully');
  }

  async onModuleDestroy() {
    // Disconnect when application shuts down
    await this.$disconnect();
    console.log('Database disconnected');
  }

  // Optional: Enable query logging in development
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }
}
```

**`src/prisma/prisma.module.ts`:**

```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Makes PrismaService available globally without re-importing
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

**`src/app.module.ts`:**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    // Other modules...
  ],
})
export class AppModule {}
```

---

## Schema Design

### Port-Watch Database Schema

Based on the FRD requirements, here's the complete Prisma schema:

**`prisma/schema.prisma`:**

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// Enums
enum UserRole {
  ADMIN
  USER
}

enum HostConnectionType {
  SOCKET
  TCP
  SSH
}

enum SSHAuthMethod {
  PASSWORD
  PRIVATE_KEY
}

enum PermissionType {
  VIEW
  MANAGE
  LOGS
  DELETE
  DEPLOY_STACK
}

enum AuditEventType {
  USER_LOGIN_SUCCESS
  USER_LOGIN_FAILURE
  USER_CREATED
  USER_UPDATED
  USER_DELETED
  HOST_ADDED
  HOST_UPDATED
  HOST_DELETED
  CONTAINER_STARTED
  CONTAINER_STOPPED
  CONTAINER_RESTARTED
  CONTAINER_DELETED
  STACK_DEPLOYED
  STACK_TAKEN_DOWN
  IMAGE_PULLED
  IMAGE_DELETED
  IMAGES_PRUNED
}

enum AuditResourceType {
  USER
  HOST
  CONTAINER
  IMAGE
  STACK
}

// Models
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  username      String   @unique
  passwordHash  String
  role          UserRole @default(USER)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  permissions   Permission[]
  auditLogs     AuditLog[]

  @@map("users")
}

model Host {
  id              String             @id @default(uuid())
  name            String
  connectionType  HostConnectionType

  // TCP/SSH connection details
  host            String?
  port            Int?

  // SSH specific
  sshUsername     String?
  sshAuthMethod   SSHAuthMethod?
  sshPassword     String?            // Encrypted
  sshPrivateKey   String?            // Encrypted

  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  // Relations
  permissions     Permission[]
  deployments     Deployment[]

  @@map("hosts")
}

model Permission {
  id              String         @id @default(uuid())
  userId          String
  permissionType  PermissionType

  // Host permission
  hostId          String?

  // Container permission (stored as external ID from Docker)
  containerExternalId  String?

  // Stack permission
  stackId         String?

  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  // Relations
  user            User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  host            Host?          @relation(fields: [hostId], references: [id], onDelete: Cascade)
  stack           Stack?         @relation(fields: [stackId], references: [id], onDelete: Cascade)

  @@unique([userId, hostId, permissionType])
  @@unique([userId, containerExternalId, permissionType])
  @@unique([userId, stackId, permissionType])
  @@map("permissions")
}

model GitRepository {
  id              String    @id @default(uuid())
  name            String
  url             String
  branch          String    @default("main")

  // Authentication
  authType        String    // "token", "ssh", "none"
  accessToken     String?   // Encrypted
  sshKey          String?   // Encrypted

  lastSyncedAt    DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  stacks          Stack[]

  @@map("git_repositories")
}

model Stack {
  id                String     @id @default(uuid())
  name              String
  gitRepositoryId   String
  composePath       String     // Path to docker-compose.yml in repo

  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt

  // Relations
  gitRepository     GitRepository @relation(fields: [gitRepositoryId], references: [id], onDelete: Cascade)
  deployments       Deployment[]
  permissions       Permission[]

  @@unique([gitRepositoryId, composePath])
  @@map("stacks")
}

model Deployment {
  id              String    @id @default(uuid())
  stackId         String
  hostId          String

  // Deployment metadata
  deployedBy      String    // User ID
  projectName     String    // Docker Compose project name

  status          String    @default("active") // active, stopped, failed

  deployedAt      DateTime  @default(now())
  stoppedAt       DateTime?

  // Relations
  stack           Stack     @relation(fields: [stackId], references: [id], onDelete: Cascade)
  host            Host      @relation(fields: [hostId], references: [id], onDelete: Cascade)

  @@unique([stackId, hostId])
  @@map("deployments")
}

model AuditLog {
  id              String            @id @default(uuid())
  timestamp       DateTime          @default(now())

  // User who performed action
  userId          String?
  username        String

  // Action details
  eventType       AuditEventType
  resourceType    AuditResourceType?
  resourceId      String?

  // Additional context (JSON)
  details         Json?
  ipAddress       String?
  userAgent       String?

  // Relations
  user            User?             @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([eventType])
  @@index([timestamp])
  @@map("audit_logs")
}
```

### Key Design Decisions:

1. **UUIDs for Primary Keys**: More secure, prevents enumeration attacks
2. **Encrypted Fields**: SSH keys, passwords, tokens stored encrypted
3. **Soft Deletes**: Audit logs preserved even when users deleted (SetNull)
4. **Indexes**: Added on frequently queried fields (userId, eventType, timestamp)
5. **Unique Constraints**: Prevent duplicate permissions
6. **Cascading Deletes**: Clean up related data automatically
7. **JSON for Flexibility**: `details` field in AuditLog for extensibility

---

## Migration Strategy

### Creating Initial Migration

```bash
# Create and apply migration
npx prisma migrate dev --name init
```

This command:

1. Creates SQL migration files in `prisma/migrations/`
2. Applies migration to database
3. Regenerates Prisma Client

### Migration Best Practices

#### 1. **Never Use `synchronize: true` in Production**

```prisma
# ❌ BAD - Don't do this in production
# synchronize: true auto-alters schema (data loss risk)

# ✅ GOOD - Use migrations
npx prisma migrate deploy  # For production
```

#### 2. **Name Migrations Descriptively**

```bash
# ✅ Good migration names
npx prisma migrate dev --name add_user_roles
npx prisma migrate dev --name create_audit_log_table
npx prisma migrate dev --name add_host_encryption

# ❌ Bad migration names
npx prisma migrate dev --name update
npx prisma migrate dev --name fix
```

#### 3. **Migration Workflow**

**Development:**

```bash
# 1. Modify schema.prisma
# 2. Create and apply migration
npx prisma migrate dev --name descriptive_name

# 3. Prisma will:
#    - Generate migration SQL
#    - Apply to database
#    - Regenerate Prisma Client
```

**Production:**

```bash
# 1. Run migrations (CI/CD or deployment script)
npx prisma migrate deploy

# 2. Generate Prisma Client
npx prisma generate
```

#### 4. **Handling Breaking Changes**

```bash
# If you need to make breaking changes:

# Option A: Create new migration
npx prisma migrate dev --name breaking_change

# Option B: Reset database (development only!)
npx prisma migrate reset  # ⚠️ DELETES ALL DATA
```

#### 5. **Seeding Data**

**`prisma/seed.ts`:**

```typescript
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create default admin user
  const adminPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@port-watch.local' },
    update: {},
    create: {
      email: 'admin@port-watch.local',
      username: 'admin',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  console.log('Seed data created:', { admin });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**`package.json`:**

```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

**Run seeding:**

```bash
npx prisma db seed
```

---

## Best Practices

### 1. **Environment-Specific Configuration**

```bash
# .env.development
DATABASE_URL="postgresql://dev_user:dev_pass@localhost:5432/port_watch_dev?schema=public"

# .env.test
DATABASE_URL="postgresql://test_user:test_pass@localhost:5432/port_watch_test?schema=public"

# .env.production
DATABASE_URL="postgresql://prod_user:${PROD_PASSWORD}@db.example.com:5432/port_watch?schema=public&sslmode=require"
```

### 2. **Connection Pooling**

```typescript
// prisma.service.ts
constructor() {
  super({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Configure connection pool
    // Note: Prisma handles pooling automatically, but you can tune it
  });
}
```

### 3. **Error Handling**

```typescript
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

async createUser(data: CreateUserDto) {
  try {
    return await this.prisma.user.create({ data });
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      // P2002: Unique constraint violation
      if (error.code === 'P2002') {
        throw new ConflictException('User with this email already exists');
      }
    }
    throw error;
  }
}
```

### 4. **Transaction Handling**

```typescript
async deployStack(stackId: string, hostId: string, userId: string) {
  return await this.prisma.$transaction(async (tx) => {
    // Create deployment
    const deployment = await tx.deployment.create({
      data: {
        stackId,
        hostId,
        deployedBy: userId,
        projectName: `stack-${stackId}`,
      },
    });

    // Log audit event
    await tx.auditLog.create({
      data: {
        userId,
        username: 'current_user', // Get from context
        eventType: 'STACK_DEPLOYED',
        resourceType: 'STACK',
        resourceId: stackId,
        details: { deploymentId: deployment.id },
      },
    });

    return deployment;
  });
}
```

### 5. **Type Safety with Services**

```typescript
// users.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findUnique(where: Prisma.UserWhereUniqueInput): Promise<User | null> {
    return this.prisma.user.findUnique({ where });
  }

  async findMany(params: { skip?: number; take?: number; where?: Prisma.UserWhereInput; orderBy?: Prisma.UserOrderByWithRelationInput }): Promise<User[]> {
    const { skip, take, where, orderBy } = params;
    return this.prisma.user.findMany({
      skip,
      take,
      where,
      orderBy,
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async update(params: { where: Prisma.UserWhereUniqueInput; data: Prisma.UserUpdateInput }): Promise<User> {
    const { where, data } = params;
    return this.prisma.user.update({ where, data });
  }

  async delete(where: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.prisma.user.delete({ where });
  }
}
```

---

## Security Considerations

### 1. **Encrypt Sensitive Data**

Install encryption library:

```bash
npm install --save crypto-js
```

**`src/common/encryption.service.ts`:**

```typescript
import { Injectable } from '@nestjs/common';
import * as CryptoJS from 'crypto-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EncryptionService {
  private readonly encryptionKey: string;

  constructor(private configService: ConfigService) {
    this.encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');
    if (!this.encryptionKey) {
      throw new Error('ENCRYPTION_KEY must be set in environment variables');
    }
  }

  encrypt(text: string): string {
    return CryptoJS.AES.encrypt(text, this.encryptionKey).toString();
  }

  decrypt(ciphertext: string): string {
    const bytes = CryptoJS.AES.decrypt(ciphertext, this.encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
}
```

**Usage in service:**

```typescript
async createHost(data: CreateHostDto) {
  const encryptedData = {
    ...data,
    sshPassword: data.sshPassword
      ? this.encryption.encrypt(data.sshPassword)
      : null,
    sshPrivateKey: data.sshPrivateKey
      ? this.encryption.encrypt(data.sshPrivateKey)
      : null,
  };

  return this.prisma.host.create({ data: encryptedData });
}
```

### 2. **Password Hashing**

```bash
npm install --save bcrypt
npm install --save-dev @types/bcrypt
```

```typescript
import * as bcrypt from 'bcrypt';

async hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

async comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### 3. **SQL Injection Prevention**

Prisma automatically prevents SQL injection through parameterized queries:

```typescript
// ✅ SAFE - Prisma handles this automatically
const user = await this.prisma.user.findUnique({
  where: { email: userInput },
});

// ❌ NEVER DO THIS - Raw SQL without parameters
await this.prisma.$executeRawUnsafe(`SELECT * FROM users WHERE email = '${userInput}'`);

// ✅ If you must use raw SQL, use parameterized version
await this.prisma.$executeRaw`
  SELECT * FROM users WHERE email = ${userInput}
`;
```

### 4. **Database User Permissions**

```sql
-- Create dedicated database user with limited permissions
CREATE USER port_watch_app WITH PASSWORD 'secure_password';

-- Grant only necessary permissions
GRANT CONNECT ON DATABASE port_watch TO port_watch_app;
GRANT USAGE ON SCHEMA public TO port_watch_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO port_watch_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO port_watch_app;

-- Revoke dangerous permissions
REVOKE CREATE ON SCHEMA public FROM port_watch_app;
REVOKE DROP ON ALL TABLES IN SCHEMA public FROM port_watch_app;
```

---

## Testing Strategy

### 1. **Unit Tests with Mocked Prisma**

```typescript
// users.service.spec.ts
import { Test } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create a user', async () => {
    const user = { id: '1', email: 'test@example.com', username: 'test' };
    mockPrismaService.user.create.mockResolvedValue(user);

    const result = await service.create({
      email: 'test@example.com',
      username: 'test',
      passwordHash: 'hash',
      role: 'USER',
    });

    expect(result).toEqual(user);
    expect(mockPrismaService.user.create).toHaveBeenCalledTimes(1);
  });
});
```

### 2. **Integration Tests with Test Database**

```typescript
// test/setup.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_TEST_URL,
    },
  },
});

beforeAll(async () => {
  // Run migrations
  await prisma.$executeRawUnsafe('DROP SCHEMA IF EXISTS public CASCADE');
  await prisma.$executeRawUnsafe('CREATE SCHEMA public');
  // Run: npx prisma migrate deploy
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean database between tests
  const tables = await prisma.$queryRaw`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  `;

  for (const { tablename } of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE`);
  }
});
```

---

## Implementation Checklist for Issue #34

- [ ] Install Prisma and dependencies
- [ ] Initialize Prisma project
- [ ] Create `PrismaService` and `PrismaModule`
- [ ] Define complete schema in `schema.prisma`
- [ ] Create initial migration
- [ ] Set up environment variables for different environments
- [ ] Implement `EncryptionService` for sensitive data
- [ ] Create seed script for development data
- [ ] Add database health check endpoint
- [ ] Write unit tests with mocked Prisma
- [ ] Set up integration test database
- [ ] Document schema in separate file
- [ ] Create database backup strategy
- [ ] Configure CI/CD pipeline for migrations

---

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [NestJS Prisma Recipe](https://docs.nestjs.com/recipes/prisma)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Don%27t_Do_This)
- [Database Security Checklist](https://cheatsheetseries.owasp.org/cheatsheets/Database_Security_Cheat_Sheet.html)
