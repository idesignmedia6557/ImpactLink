# Database Schema

## Overview

This document outlines the database schema for ImpactLink. The database will use PostgreSQL with Prisma ORM for type-safe database access.

## Core Entities

### Users
Stores information about both donors and charity administrators.

```sql
Table: users
- id: UUID (Primary Key)
- email: String (Unique, Required)
- password_hash: String (Required)
- user_type: Enum ['donor', 'charity_admin', 'admin']
- first_name: String
- last_name: String
- phone: String
- profile_image_url: String
- created_at: Timestamp
- updated_at: Timestamp
- last_login: Timestamp
- is_verified: Boolean (Default: false)
- verification_token: String
```

### Charities
Stores verified charity organizations.

```sql
Table: charities
- id: UUID (Primary Key)
- name: String (Required)
- description: Text
- mission_statement: Text
- category: Enum ['education', 'health', 'environment', 'poverty', 'animals', 'other']
- website_url: String
- logo_url: String
- banner_image_url: String
- address: String
- city: String
- state: String
- country: String
- postal_code: String
- registration_number: String (Tax ID/Charity Registration)
- verification_status: Enum ['pending', 'verified', 'rejected']
- verification_documents: JSON
- admin_user_id: UUID (Foreign Key -> users.id)
- created_at: Timestamp
- updated_at: Timestamp
- total_donations_received: Decimal
- active_campaigns_count: Integer
```

### Donations
Records all donation transactions.

```sql
Table: donations
- id: UUID (Primary Key)
- donor_id: UUID (Foreign Key -> users.id)
- charity_id: UUID (Foreign Key -> charities.id)
- campaign_id: UUID (Foreign Key -> campaigns.id, Nullable)
- amount: Decimal (Required, Min: 1.00)
- currency: String (Default: 'USD')
- payment_method: Enum ['credit_card', 'debit_card', 'bank_transfer']
- payment_status: Enum ['pending', 'completed', 'failed', 'refunded']
- stripe_payment_intent_id: String
- transaction_fee: Decimal
- net_amount: Decimal (Amount after fees)
- is_recurring: Boolean (Default: false)
- recurring_frequency: Enum ['monthly', 'quarterly', 'yearly', Nullable]
- donation_message: Text
- is_anonymous: Boolean (Default: false)
- created_at: Timestamp
- updated_at: Timestamp
- receipt_url: String
```

### Campaigns
Specific fundraising campaigns created by charities.

```sql
Table: campaigns
- id: UUID (Primary Key)
- charity_id: UUID (Foreign Key -> charities.id)
- title: String (Required)
- description: Text
- goal_amount: Decimal
- current_amount: Decimal (Default: 0)
- currency: String (Default: 'USD')
- start_date: Timestamp
- end_date: Timestamp
- status: Enum ['draft', 'active', 'completed', 'cancelled']
- image_url: String
- category: String
- created_at: Timestamp
- updated_at: Timestamp
```

### Impact Reports
Transparency reports showing how donations were used.

```sql
Table: impact_reports
- id: UUID (Primary Key)
- charity_id: UUID (Foreign Key -> charities.id)
- campaign_id: UUID (Foreign Key -> campaigns.id, Nullable)
- title: String (Required)
- description: Text
- amount_allocated: Decimal
- beneficiaries_count: Integer
- report_date: Timestamp
- images: JSON (Array of image URLs)
- documents: JSON (Array of supporting documents)
- created_at: Timestamp
- updated_at: Timestamp
```

### Fund Allocations
Detailed tracking of how donated funds are allocated.

```sql
Table: fund_allocations
- id: UUID (Primary Key)
- donation_id: UUID (Foreign Key -> donations.id)
- charity_id: UUID (Foreign Key -> charities.id)
- allocation_category: String (e.g., 'program costs', 'admin', 'fundraising')
- amount: Decimal
- description: Text
- allocated_date: Timestamp
- impact_report_id: UUID (Foreign Key -> impact_reports.id, Nullable)
- created_at: Timestamp
```

### Recurring Donations
Manages recurring donation subscriptions.

```sql
Table: recurring_donations
- id: UUID (Primary Key)
- donor_id: UUID (Foreign Key -> users.id)
- charity_id: UUID (Foreign Key -> charities.id)
- amount: Decimal
- currency: String
- frequency: Enum ['monthly', 'quarterly', 'yearly']
- status: Enum ['active', 'paused', 'cancelled']
- stripe_subscription_id: String
- next_payment_date: Timestamp
- start_date: Timestamp
- end_date: Timestamp (Nullable)
- created_at: Timestamp
- updated_at: Timestamp
```

### User Saved Charities
Allows donors to bookmark/save favorite charities.

```sql
Table: saved_charities
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key -> users.id)
- charity_id: UUID (Foreign Key -> charities.id)
- created_at: Timestamp
- UNIQUE constraint on (user_id, charity_id)
```

### Notifications
System notifications for users.

```sql
Table: notifications
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key -> users.id)
- type: Enum ['donation_received', 'campaign_update', 'verification_status', 'payment_failed']
- title: String
- message: Text
- is_read: Boolean (Default: false)
- related_entity_type: String (e.g., 'donation', 'campaign')
- related_entity_id: UUID
- created_at: Timestamp
```

## Relationships

1. **Users → Donations**: One-to-Many (A donor can make many donations)
2. **Charities → Donations**: One-to-Many (A charity can receive many donations)
3. **Charities → Campaigns**: One-to-Many (A charity can create many campaigns)
4. **Campaigns → Donations**: One-to-Many (A campaign can receive many donations)
5. **Charities → Impact Reports**: One-to-Many (A charity can create many impact reports)
6. **Donations → Fund Allocations**: One-to-Many (A donation can be allocated to multiple categories)
7. **Users → Recurring Donations**: One-to-Many (A donor can have multiple recurring donations)
8. **Users → Saved Charities**: Many-to-Many (Users can save multiple charities, charities can be saved by multiple users)

## Indexes

For optimal query performance, the following indexes should be created:

- `users(email)` - For login lookups
- `donations(donor_id, created_at)` - For donor history queries
- `donations(charity_id, created_at)` - For charity donation history
- `charities(verification_status)` - For filtering verified charities
- `charities(category)` - For category-based searches
- `campaigns(charity_id, status)` - For active campaign queries
- `fund_allocations(donation_id)` - For transparency reports

## Security Considerations

1. **Password Storage**: All passwords must be hashed using bcrypt with a minimum cost factor of 12
2. **PII Protection**: Personal information should be encrypted at rest
3. **Payment Data**: Never store full credit card information (use Stripe tokens)
4. **Soft Deletes**: Consider soft deletes for user accounts and critical data
5. **Audit Logs**: Implement audit logging for sensitive operations

## Migration Strategy

1. Initial schema creation with all core tables
2. Seed data for testing (sample charities, categories)
3. Incremental migrations for new features
4. Version control all schema changes through Prisma migrations

## Data Backup

- Daily automated backups
- Point-in-time recovery enabled
- Backup retention: 30 days
- Disaster recovery plan documented

## Future Enhancements

- **Reviews/Ratings**: Allow donors to rate and review charities
- **Social Features**: Comments, sharing, and social proof
- **Analytics**: Enhanced analytics tables for insights
- **Multi-language Support**: Internationalization fields
- **Matching Donations**: Corporate matching programs

---

**Status**: Draft - Subject to refinement during development
**Last Updated**: 2025-11-04
