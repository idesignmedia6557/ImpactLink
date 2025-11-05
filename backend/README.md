# Backend
This directory contains the Node.js/Express backend API for ImpactLink.
## Structure
The backend will be organized as follows:
```
backend/
├── src/
│   ├── controllers/    # Route controllers
│   ├── models/         # Database models (Prisma)
│   ├── routes/         # API routes
│   ├── middleware/     # Custom middleware
│   ├── services/       # Business logic layer
│   ├── utils/          # Utility functions
│   ├── config/         # Configuration files
│   └── index.ts        # Main application entry point
├── prisma/
│   └── schema.prisma   # Database schema
├── tests/              # Unit and integration tests
├── package.json        # Dependencies and scripts
├── .env.example        # Environment variables template
└── README.md           # This file
```
## Getting Started
### Prerequisites
- Node.js v18 or higher
- PostgreSQL v14 or higher
- npm or yarn
### Installation
```bash
cd backend
npm install
```

### Stripe Installation
Install Stripe packages for payment processing:
```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
```

### Environment Setup
Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```
Configure the following environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `STRIPE_SECRET_KEY`: Stripe API secret key

### Stripe Setup Notes for Development
1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Stripe Dashboard
3. Use test mode keys for development (they start with `sk_test_`)
4. Add your `STRIPE_SECRET_KEY` to the `.env` file
5. Never commit your actual API keys to version control
