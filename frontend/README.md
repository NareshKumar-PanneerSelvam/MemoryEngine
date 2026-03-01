# MemoryEngine Frontend

React + TypeScript + Vite frontend for MemoryEngine.

## Quick Start

### 1) Prerequisites

- Node.js 18+
- npm

### 2) Install dependencies

```bash
cd frontend
npm install
```

Windows (PowerShell):

```powershell
cd frontend
npm install
```

### 3) Configure environment

```bash
cp .env.example .env
```

Windows (PowerShell):

```powershell
Copy-Item .env.example .env
```

Set API URL in `.env`:

```env
VITE_API_URL=http://localhost:8000
```

### 4) Start development server

```bash
npm run dev
```

Windows (PowerShell):

```powershell
npm run dev
```

Frontend runs at `http://localhost:5173`.

## Build

```bash
npm run build
```

## Notes

- TailwindCSS is already configured.
- Dark mode is class-based and persisted in localStorage.
- Authentication tokens are stored in localStorage for local development.
