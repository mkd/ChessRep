export const LICHESS_API_BASE = 'https://explorer.lichess.ovh/masters';
export const LICHESS_EVAL_BASE = 'https://lichess.org/api/cloud-eval';

// Rate limiting handling could be improved, but for now we simple fetch.
// Masters DB
export async function fetchMasters(fen) {
    try {
        const params = new URLSearchParams({
            fen: fen,
            moves: 30, // Get top moves
            topGames: 0
        });
        
        const response = await fetch(`${LICHESS_API_BASE}?${params.toString()}`);
        if (!response.ok) {
           return null;
        }
        return await response.json();
    } catch (e) {
        console.error("Masters fetch failed", e);
        return null;
    }
}

// Cloud Eval
export async function fetchCloudEval(fen) {
    try {
        const response = await fetch(`${LICHESS_EVAL_BASE}?fen=${encodeURIComponent(fen)}`);
        if (!response.ok) {
            return null;
        }
        return await response.json();
    } catch (e) {
        console.error("Cloud Eval fetch failed", e);
        return null;
    }
}

// Helper to open analysis
export function openLichessAnalysis(fen) {
    // Replace spaces with + or %20
    const url = `https://lichess.org/analysis/${fen.replace(/ /g, '_')}`;
    window.open(url, '_blank', 'noreferrer');
}
