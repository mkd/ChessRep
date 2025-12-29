# ChessRep

A sleek, mobile-responsive React application for building and practicing your chess opening repertoire using spaced repetition.

## Features

- **Opening Editor**: Manually enter your repertoire moves for both White and Black.
- **Tree Structure**: Supports variations and comments for every move.
- **Practice Mode**: Uses a Spaced Repetition logic (Leitner system) to help you memorize your lines efficiently. Moves are scheduled for review based on your performance.
- **Mobile First**: Designed to work responsibly and effectively on mobile devices (e.g., iPhone).
- **Dark Mode**: Sleek, premium dark theme.

## Tech Stack

- **React** (Vite)
- **Chess Logic**: `chess.js`
- **Visualization**: `react-chessboard`
- **Routing**: `react-router-dom`
- **Icons**: `lucide-react`
- **Persistence**: `localStorage` (Data stays in your browser)

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

3. **Build for Production**:
   ```bash
   npm run build
   ```

## Usage

1. **Editor**: Go to the Editor to start adding moves. Play a move on the board to add it to your repertoire. Add comments or delete variations as needed.
2. **Practice**: Go to Practice mode. The app will present positions where you have a move due for review. Play the correct move to advance its schedule!
