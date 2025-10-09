# MoraPack - Frontend

Logistics management system built with React 19, TypeScript, and Vite.

## Tech Stack

- **Framework**: React 19
- **Language**: TypeScript
- **Build Tool**: Vite
- **Router**: React Router DOM
- **Data Fetching**: TanStack Query
- **HTTP Client**: Axios
- **Styling**: Styled Components
- **Global State**: Zustand

## Requirements

- Node.js >= 20.19.0 (recommended v22.12.0)
- npm >= 9.0.0

## Installation

### Setup Node.js

**WSL (Ubuntu/Debian)**
```bash
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 22.12.0
nvm use 22.12.0
nvm alias default 22.12.0
```

**macOS**
```bash
brew install nvm
nvm install 22.12.0
nvm use 22.12.0
nvm alias default 22.12.0
```

### Install dependencies and run

```bash
cd morapack-frontend
npm install
npm run dev
```

Application will be available at `http://localhost:5173`

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # Lint code
npm run format   # Format code
```

## Project Structure

```
src/
├── api/              # HTTP client and endpoints
├── components/
│   ├── ui/          # Reusable components (Button, Input, Card)
│   └── layout/      # Layouts (AuthLayout, MainLayout, Navbar)
├── hooks/           # Custom hooks
├── pages/           # Main views
│   ├── LoginPage/
│   └── DashboardPage/
├── routes/          # Route configuration
├── store/           # Global state (Zustand)
├── styles/          # Theme and global styles
└── types/           # Shared TypeScript types
```

## Conventions

### Component Organization
Each page/complex component follows the colocation pattern:

```
ComponentName/
├── ComponentName.tsx
├── ComponentName.styles.ts
├── useComponentLogic.ts (optional)
└── index.ts
```

### Imports
Use barrel exports for clean imports:

```typescript
import { Button, Input, Card } from '@/components/ui'
```

### Typing
Always define types for component props:

```typescript
export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>
```

## Troubleshooting

**Error: `crypto.hash is not a function`**
- Update Node.js to version >= 20.19.0

**Port 5173 already in use**
```bash
# WSL/macOS
lsof -ti:5173 | xargs kill -9
```

**TypeScript errors in IDE**
- Restart TypeScript server: `Ctrl+Shift+P` > "TypeScript: Restart TS Server"

## Production Build

```bash
npm run build
```

Optimized files will be generated in `dist/`

## Environment Variables

Create `.env` file at project root:

```env
# API Configuration
VITE_API_URL=http://localhost:8000/api

# App Configuration
VITE_APP_NAME=MoraPack
```
