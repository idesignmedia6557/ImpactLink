SETUP.md# ImpactLink Backend Setup Guide

## Step 1: Install Dependencies

```bash
cd backend
npm install
npm install prisma @prisma/client
npm install bcrypt stripe dotenv express
npm install -D typescript @types/node @types/express
```

## Step 2: Configure Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Database Configuration (HostKing PostgreSQL)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/impactlink_db?schema=public"

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# JWT
JWT_SECRET=your_secure_random_secret

# Server
PORT=3001
NODE_ENV=development

# Frontend URL
FRONTEND_URL=https://impactlink.solovedhelpinghands.org.za
```

## Step 3: Set Up Database (HostKing)

1. Log in to HostKing cPanel:
   - URL: https://my.hostking.host/clientarea.php?action=productdetails&id=19513
   
2. Navigate to **Database Management**

3. Create PostgreSQL Database:
   - Database name: `impactlink_db`
   - Create a database user
   - Grant all privileges to the user
   - Note down the credentials

4. Update your `.env` file with the connection details

## Step 4: Initialize Prisma

```bash
# Generate Prisma Client
npx prisma generate

# Create initial migration
npx prisma migrate dev --name init

# This will:
# - Create all tables in your database
# - Generate the Prisma Client
# - Apply the schema
```

## Step 5: Seed Database (Optional)

Create seed data for testing:

```bash
npx prisma db seed
```

## Step 6: Verify Setup

Check that everything is working:

```bash
# Open Prisma Studio to view your database
npx prisma studio

# Run the backend server
npm run dev
```

## Troubleshooting

### Database Connection Issues

- Verify PostgreSQL is running on HostKing
- Check DATABASE_URL format
- Ensure firewall allows connections
- Verify user has proper permissions

### Migration Errors

```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or create a new migration
npx prisma migrate dev --name fix_issue
```

## Next Steps

1. ✅ Database schema is ready
2. ⏳ Create API endpoints (see `/routes`)
3. ⏳ Build frontend UI components
4. ⏳ Integrate Stripe payments
5. ⏳ Deploy to production

For complete implementation guide, see: [Notion Implementation Guide](https://notion.so/ImpactLink-MVP-Implementation-Guide-2a43c025c6ac8034a75fd443b184ec0f)
