# ImpactLink Development Environment Setup

## System Requirements

- Node.js 18+
- npm 8+ or yarn
- PostgreSQL 14+
- Git
- VS Code (recommended)

## Quick Start (5 minutes)

### 1. Clone Repository
```bash
git clone https://github.com/idesignmedia6557/ImpactLink.git
cd ImpactLink
```

### 2. Install Dependencies
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### 3. Setup Environment Variables
```bash
# Copy template
cp .env.example .env

# Edit .env with your settings
# REACT_APP_API_URL=http://localhost:3001/api
# DATABASE_URL=postgresql://user:password@localhost:5432/impactlink
# STRIPE_PUBLIC_KEY=pk_test_...
# STRIPE_SECRET_KEY=sk_test_...
```

### 4. Database Setup
```bash
# From backend directory
cd backend
npm run migrate
npm run seed  # Optional: add sample data
```

### 5. Start Development Servers
```bash
# Terminal 1: Frontend (from frontend directory)
cd frontend
npm start
# Opens http://localhost:3000

# Terminal 2: Backend (from backend directory)
cd backend
npm run dev
# Runs on http://localhost:3001
```

## Full Local Setup (Detailed)

### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start

# Run tests
npm test

# Build production
npm run build
```

### Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Setup database
npm run migrate

# Start development server
npm run dev

# Run tests
npm test

# Seed database with sample data
npm run seed
```

### Database Configuration

**PostgreSQL Connection String Format:**
```
postgresql://username:password@localhost:5432/impactlink_dev
```

**Create Database:**
```bash
createdb impactlink_dev
```

**Run Migrations:**
```bash
cd backend
PRISMA_DATABASE_URL="postgresql://..." npm run migrate
```

## Docker Setup (Alternative)

```bash
# Start all services with Docker Compose
docker-compose up

# Frontend: http://localhost:3000
# Backend: http://localhost:3001
# PostgreSQL: localhost:5432
```

## Development Workflow

### 1. Create Feature Branch
```bash
git checkout -b feature/feature-name
```

### 2. Make Changes
- Frontend: `frontend/src/**`
- Backend: `backend/src/**`

### 3. Test Locally
```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend
npm test
```

### 4. Run Linting
```bash
# Frontend
cd frontend
npm run lint

# Backend
cd backend
npm run lint
```

### 5. Commit and Push
```bash
git add .
git commit -m "feat: description of changes"
git push origin feature/feature-name
```

### 6. Create Pull Request
- Push to GitHub
- Create PR with detailed description
- Reference related issues
- Wait for CI/CD checks to pass

## Debugging

### Frontend
- Browser DevTools (F12)
- React DevTools extension
- Redux DevTools (if using Redux)

### Backend
```bash
# Enable debug logging
DEBUG=* npm run dev

# Use node inspector
node --inspect-brk server.js
```

## Useful Commands

```bash
# Reset everything
rm -rf node_modules package-lock.json
npm install

# Clear cache
npm cache clean --force

# Check for vulnerabilities
npm audit

# Update dependencies
npm outdated
npm update
```

## Troubleshooting

### Port Already in Use
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Database Connection Error
- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Run migrations: `npm run migrate`

### Module Not Found
```bash
rm -rf node_modules
npm install
```

### Git Case Sensitivity Issue
```bash
git config core.ignorecase false
git rm --cached frontend/src/pages/*.tsx
git add frontend/src/pages/
git commit -m "fix: correct file casing"
```

## IDE Setup

### VS Code Extensions
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- ESLint
- PostCSS Language Support
- Thunder Client (API testing)

### VS Code Settings
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## Next Steps

1. Follow QUICK_IMPLEMENTATION_FIXES.md for priorities
2. Read API_INTEGRATION_GUIDE.md for API implementation
3. Check GitHub Issues #1-4 for specific tasks
4. Join team Slack for questions

## Support

- Issues: Check GitHub Issues
- Documentation: See QUICK_IMPLEMENTATION_FIXES.md
- API Guide: See API_INTEGRATION_GUIDE.md
- Questions: Create GitHub Discussion

---

**Last Updated**: November 11, 2025  
**Version**: 1.0  
**Status**: Ready for Development
