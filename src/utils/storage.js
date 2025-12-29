const STORAGE_KEY = 'chess-repertoire-data';

export const initialRepertoire = {
    white: {
        id: 'root',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        children: []
    },
    black: {
        id: 'root',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        children: []
    },
    savedVariations: []
};

export const loadRepertoire = () => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return initialRepertoire;
        const parsed = JSON.parse(data);
        return {
            ...initialRepertoire,
            ...parsed,
            savedVariations: parsed.savedVariations || []
        };
    } catch (e) {
        console.error("Failed to load repertoire", e);
        return initialRepertoire;
    }
};

export const saveRepertoire = (repertoire) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(repertoire));
};
