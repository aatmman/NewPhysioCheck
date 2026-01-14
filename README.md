# PhysioCheck Care Portal

React + TypeScript + Vite frontend for the PhysioCheck Care Portal digital rehabilitation platform. This application focuses on motion tracking and remote physiotherapy management.

## Architecture & Tech Stack

For a detailed technical overview, see [ARCHITECTURE.md](./ARCHITECTURE.md).

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui.
- **AI/Vision**: MediaPipe Vision for real-time pose estimation and exercise tracking.
- **Backend/DB**: Supabase (Authentication, PostgreSQL Database).

## Setup

### Prerequisites

- Node.js 18+ (or Bun)
- npm, yarn, or bun package manager

### Installation

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   # or
   bun install
   ```

2. **Configure environment variables:**
   
   Create a `.env` file in the `frontend` directory based on the `.env.example`:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_API_URL=http://localhost:8000/api/v1
   ```
   
   **Where to get these:**
   - **VITE_SUPABASE_URL**: Supabase Dashboard → Settings → API → Project URL
   - **VITE_SUPABASE_ANON_KEY**: Supabase Dashboard → Settings → API → `anon` `public` key
   - **VITE_API_URL**: Your backend API base URL (defaults to localhost:8000/api/v1)

3. **Run the development server:**
   ```bash
   npm run dev
   # or
   bun dev
   ```
   
   The app will be available at `http://localhost:8080`

4. **Build for production:**
   ```bash
   npm run build
   # or
   bun run build
   ```

## Project Structure

```
frontend/
├── src/
│   ├── main.tsx                 # App entry point
│   ├── App.tsx                  # Root component with routing
│   ├── index.css                # Global styles
│   │
│   ├── pages/                   # Page components
│   │   ├── Index.tsx            # Doctor dashboard
│   │   ├── Login.tsx            # Authentication page
│   │   ├── Patients.tsx         # Patient list (doctor)
│   │   ├── ...
│   │   └── patient/             # Patient-specific pages
│   │       ├── PatientHome.tsx
│   │       └── PatientSessionActive.tsx # Motion tracking implementation
│   │
│   ├── components/              # Reusable components
│   │   ├── layout/              # Layout structures
│   │   ├── dashboard/           # Dashboard charts and widgets
│   │   └── ui/                  # shadcn/ui base components
│   │
│   ├── context/                 # Auth and navigation state
│   ├── lib/                     # Supabase and API clients
│   ├── hooks/                   # Custom logic (toasts, mobile detection)
│   └── types/                   # TypeScript definitions
│
├── public/                      # Static assets
└── package.json                 # Project dependencies
```

## Key Features

- **Motion Tracking**: Real-time pose detection using MediaPipe Vision.
- **Exercise Recognition**: Automated repetition counting for physical therapy exercises.
- **Role-Based Portals**: Dedicated interfaces for doctors and patients.
- **Analytics Dashboard**: Visual progress tracking for Range of Motion (ROM) and adherence.
- **Secure Messaging**: Integrated chat between providers and patients.

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Deployment (Vercel)

This application is optimized for Vercel. 
- **Root Directory**: `frontend`
- **Framework Preset**: Vite
- **Build Command**: `vite build`
- **Output Directory**: `dist`

**Environment Variables Required**:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

A `vercel.json` is included in the `frontend` directory to handle SPA routing.

### Test Credentials

- **Doctor**: `sanchitdubbewar08@gmail.com` / `test123456`
- **Patient**: `sbcv32@gmail.com` / `test123456`

## Troubleshooting

### "Missing VITE_SUPABASE_URL"
- Ensure `.env` exists in the `frontend` directory.
- Variables must be prefixed with `VITE_`.

### MediaPipe Issues
- Ensure you have a working camera.
- Check browser permissions for camera access during session tracking.

---

**Last Updated:** January 2026  
**Frontend Version:** 1.0.1
