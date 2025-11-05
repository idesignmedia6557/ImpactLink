# Frontend
This directory contains the React-based frontend application for ImpactLink.
## Structure
The frontend will be organized as follows:
```
frontend/
├── src/
│   ├── components/     # Reusable React components
│   ├── pages/          # Page components
│   ├── services/       # API service layer
│   ├── store/          # Redux store configuration
│   ├── utils/          # Utility functions
│   ├── styles/         # Global styles and Tailwind config
│   └── App.tsx         # Main application component
├── public/             # Static assets
├── package.json        # Dependencies and scripts
└── README.md           # This file
```
## Getting Started
### Prerequisites
- Node.js v18 or higher
- npm or yarn
### Installation
```bash
cd frontend
npm install
```

### Stripe Installation
Install Stripe packages for payment integration:
```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### Development
```bash
npm run dev
```
The application will be available at `http://localhost:3000`
### Build
```bash
npm run build
```
## Key Features
- Modern React with TypeScript
- Responsive design with Tailwind CSS
- State management with Redux
- Client-side routing with React Router
- Integration with backend API

### Stripe Setup Notes for Development
1. Get your publishable key from the Stripe Dashboard
2. Use test mode keys for development (they start with `pk_test_`)
3. Add your `REACT_APP_STRIPE_PUBLISHABLE_KEY` to the `.env` file
4. The Stripe Elements components are provided by `@stripe/react-stripe-js`
5. Never commit your actual API keys to version control

## Technologies
- React 18+
- TypeScript
