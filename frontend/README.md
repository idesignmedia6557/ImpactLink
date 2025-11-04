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

## Technologies

- React 18+
- TypeScript
- Tailwind CSS
- Redux Toolkit
- React Router
- Axios for API calls
- Vite for build tooling

## Contributing

Please ensure all code follows the TypeScript and React best practices.
