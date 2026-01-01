# ChessRep

A sleek, mobile-responsive React application for building and practicing your chess opening repertoire using spaced repetition.

## Features

- **Opening Explorer**: Intuitive interface to build and analyze your repertoire.
- **Tree Structure**: Supports unlimited variations, comments, and annotations (?!, !!, etc).
- **Practice Mode**: Uses a Spaced Repetition logic (Leitner system) to prioritize moves you struggle with.
- **Cloud Sync**: Seamlessly syncs your repertoire across devices using Supabase.
- **User Accounts**: Registration and Login system to protect your data.
- **Mobile First**: Optimized layout for mobile usage (iPhone PWA ready).
- **Dark Mode**: Premium, OLED-friendly dark theme.

## Tech Stack

- **Frontend**: React (Vite)
- **Logic**: `chess.js`
- **Visualization**: `react-chessboard`
- **Backend/DB**: Supabase (PostgreSQL + Auth)
- **State**: `react-router-dom` (Routing), Context API (Auth)
- **Icons**: `lucide-react`

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Locally**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

3. **Supabase Setup**:
   - Create a project at [supabase.com](https://supabase.com).
   - Run the SQL setup script (`supabase_setup.sql`) in your project's SQL Editor.
   - Copy `.env.example` to `.env` and add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

4. **Build for Production**:
   ```bash
   npm run build
   ```

## Usage

1. **Dashboard**: Sign up/Log in to access your repertoire.
2. **Explorer**: Add moves to your White or Black repertoire.
3. **Practice**: Review due moves. The app tracks your success rate and schedules "Correct" moves further into the future.

