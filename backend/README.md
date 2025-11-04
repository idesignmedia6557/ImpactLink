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

### Environment Setup

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Configure the following environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `STRIPE_SECRET_KEY`: Stripe API secret key
- `PORT`: Server port (default: 3001)

### Database Setup

```bash
# Run migrations
npm run migrate

# Seed database (optional)
npm run seed
```

### Development

```bash
npm run dev
```

The API will be available at `http://localhost:3001`

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## API Documentation

API documentation will be available at `/api/docs` when the server is running.

## Key Features

- RESTful API architecture
- JWT-based authentication
- PostgreSQL database with Prisma ORM
- Stripe payment integration
- Input validation and sanitization
- Error handling middleware
- Rate limiting and security headers
- Comprehensive logging

## Technologies

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT for authentication
- Stripe API
- Jest for testing

## Security

- Password hashing with bcrypt
- JWT token authentication
- Input validation and sanitization
- SQL injection prevention (Prisma)
- CORS configuration
- Rate limiting
- Security headers (Helmet.js)

## Contributing

Please ensure all code follows the Node.js and TypeScript best practices. All new features should include appropriate tests.
