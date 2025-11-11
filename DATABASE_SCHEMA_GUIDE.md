# ImpactLink Database Schema & Migrations Guide

## Overview

This guide documents the database schema for the ImpactLink MVP platform using Prisma ORM with PostgreSQL. It includes all models, relationships, migrations, and best practices for data management.

## Database Setup

### Prerequisites
```bash
# Install Prisma CLI
npm install -D prisma @prisma/client

# Ensure PostgreSQL is running
# Set DATABASE_URL in .env
DATABASE_URL="postgresql://user:password@localhost:5432/impactlink"
```

### Initial Setup
```bash
cd backend

# Initialize Prisma
npx prisma init

# Update schema.prisma with models
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database (optional)
npm run prisma:seed
```

## Data Models

### 1. User Model

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String
  password      String    // Hashed with bcrypt
  role          Role      @default(donor)
  emailVerified DateTime?
  
  // Relations
  donations     Donation[]
  charities     Charity[]
  reviews       Review[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([email])
}

enum Role {
  donor
  charity_admin
  corporate_admin
  platform_admin
}
```

### 2. Charity Model

```prisma
model Charity {
  id            String    @id @default(cuid())
  name          String
  description   String    @db.Text
  registrationNumber String @unique
  email         String    @unique
  website       String?
  phoneNumber   String?
  
  // Address
  street        String
  city          String
  state         String
  zipCode       String
  country       String
  
  // Financial
  taxId         String?
  bankAccount   String?   // Encrypted
  
  // Status
  verified      Boolean   @default(false)
  active        Boolean   @default(true)
  
  // Relations
  admin         User      @relation(fields: [adminId], references: [id])
  adminId       String
  projects      Project[]
  donations     Donation[]
  reviews       Review[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([verified, active])
  @@index([name])
}
```

### 3. Project Model

```prisma
model Project {
  id            String    @id @default(cuid())
  title         String
  description   String    @db.Text
  category      ProjectCategory
  targetAmount  Int       // In cents (e.g., 50000 = $500)
  currentAmount Int       @default(0)
  deadline      DateTime
  imageUrl      String?
  
  // Status
  status        ProjectStatus @default(active)
  verified      Boolean   @default(false)
  
  // Relations
  charity       Charity   @relation(fields: [charityId], references: [id])
  charityId     String
  donations     Donation[]
  updates       ProjectUpdate[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([charityId])
  @@index([status])
  @@index([verified])
}

enum ProjectCategory {
  health
  education
  poverty
  environment
  emergency
  other
}

enum ProjectStatus {
  draft
  active
  completed
  cancelled
}
```

### 4. Donation Model

```prisma
model Donation {
  id            String    @id @default(cuid())
  amount        Int       // In cents
  currency      String    @default("USD")
  
  // Donor
  donor         User      @relation(fields: [donorId], references: [id])
  donorId       String
  
  // Recipient
  project       Project   @relation(fields: [projectId], references: [id])
  projectId     String
  charity       Charity   @relation(fields: [charityId], references: [id])
  charityId     String
  
  // Payment
  stripePaymentId String  @unique
  paymentMethod String    // card, bank_transfer, etc.
  status        DonationStatus @default(pending)
  
  // Receipt
  receiptUrl    String?
  taxDeductible Boolean   @default(true)
  
  // Metadata
  isAnonymous   Boolean   @default(false)
  message       String?
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([donorId])
  @@index([projectId])
  @@index([status])
  @@index([createdAt])
}

enum DonationStatus {
  pending
  completed
  failed
  refunded
}
```

### 5. Review Model

```prisma
model Review {
  id            String    @id @default(cuid())
  rating        Int       // 1-5 stars
  comment       String    @db.Text
  
  // Relations
  reviewer      User      @relation(fields: [reviewerId], references: [id])
  reviewerId    String
  charity       Charity   @relation(fields: [charityId], references: [id])
  charityId     String
  
  verified      Boolean   @default(false)
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@unique([reviewerId, charityId])
  @@index([charityId])
  @@index([rating])
}
```

### 6. ProjectUpdate Model

```prisma
model ProjectUpdate {
  id            String    @id @default(cuid())
  title         String
  content       String    @db.Text
  imageUrl      String?
  
  // Relations
  project       Project   @relation(fields: [projectId], references: [id])
  projectId     String
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([projectId])
}
```

## Migration Strategy

### Creating Migrations
```bash
# After modifying schema.prisma
npx prisma migrate dev --name <migration_name>

# Examples:
npx prisma migrate dev --name init
npx prisma migrate dev --name add_project_updates
npx prisma migrate dev --name add_review_verification
```

### Migration Naming Conventions
- `init` - Initial schema
- `add_<table>_<column>` - Add new column
- `update_<table>_<column>` - Modify column
- `add_<table>` - Add new table
- `add_<relation>_relation` - Add relationship between tables

### Running Migrations
```bash
# Development environment
npm run prisma:migrate:dev

# Production environment (preview first)
npm run prisma:migrate:deploy --preview
npm run prisma:migrate:deploy

# Reset database (development only)
npm run prisma:migrate:reset
```

## Indexes Strategy

Critical indexes for performance:

1. **User**: email (unique login)
2. **Charity**: verified, active (filtering)
3. **Project**: status, verified (filtering)
4. **Donation**: donorId, projectId, status (queries)
5. **Review**: charityId, rating (aggregation)

## Database Seeding

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create test users
  const testUser = await prisma.user.create({
    data: {
      email: 'donor@test.com',
      name: 'Test Donor',
      password: await bcrypt.hash('TestPassword123!', 10),
      role: 'donor'
    }
  });

  // Create test charity
  const testCharity = await prisma.charity.create({
    data: {
      name: 'Test Charity',
      description: 'A test charity for development',
      registrationNumber: 'REG123456',
      email: 'charity@test.com',
      street: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
      country: 'USA',
      adminId: testUser.id,
      verified: true
    }
  });

  console.log('Seeded:', { testUser, testCharity });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Add to `package.json`:
```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

Run seeding:
```bash
npx prisma db seed
```

## Query Optimization

### Common Queries

```typescript
// Get charity with projects and donations
const charity = await prisma.charity.findUnique({
  where: { id: charityId },
  include: {
    projects: {
      where: { status: 'active' }
    },
    donations: {
      orderBy: { createdAt: 'desc' },
      take: 10
    }
  }
});

// Get project with donation statistics
const project = await prisma.project.findUnique({
  where: { id: projectId },
  include: {
    donations: {
      where: { status: 'completed' }
    },
    updates: {
      orderBy: { createdAt: 'desc' },
      take: 5
    }
  }
});

// Get user donations with projects
const userDonations = await prisma.donation.findMany({
  where: { donorId: userId },
  include: {
    project: {
      include: { charity: true }
    }
  },
  orderBy: { createdAt: 'desc' }
});
```

## Data Privacy & Security

### Password Hashing
```typescript
import * as bcrypt from 'bcrypt';

// Hash password before saving
const hashedPassword = await bcrypt.hash(plainTextPassword, 10);

// Verify password
const isValid = await bcrypt.compare(plainTextPassword, hashedPassword);
```

### Sensitive Data Encryption
```typescript
// For bank accounts and payment info
import crypto from 'crypto';

function encryptSensitiveData(data: string): string {
  const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY!);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}
```

### Database Backups
```bash
# Backup production database
pg_dump -U username -h localhost impactlink > backup.sql

# Restore from backup
psql -U username -h localhost impactlink < backup.sql
```

## Troubleshooting

### Common Issues

**"Prisma has detected an abnormal termination"**
```bash
# Clear Prisma cache
rm -rf node_modules/.prisma
npm install
```

**Migration conflicts**
```bash
# Resolve with reset (dev only)
npm run prisma:migrate:reset
```

**Duplicate migration**
```bash
# Delete failed migration file from prisma/migrations/
# Re-run migration
npx prisma migrate dev --name new_name
```

## Performance Benchmarks

Target query times:
- Simple find: < 10ms
- Find with relations: < 50ms
- Aggregation query: < 100ms

Use `prisma.$queryRaw()` for complex queries that need optimization beyond Prisma.

## References

- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Tuning_Your_PostgreSQL_Server)
- [Database Design Patterns](https://www.postgresql.org/docs/current/ddl-intro.html)
