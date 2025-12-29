import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import ChessboardWrapper from '../components/ChessboardWrapper';
import { loadRepertoire, saveRepertoire } from '../utils/storage';

export default function Practice() {
    const [repertoire, setRepertoire] = useState(loadRepertoire());
    const [queue, setQueue] = useState([]);
    const [currentItem, setCurrentItem] = useState(null);
    const [game, setGame] = useState(new Chess());
    const [status, setStatus] = useState('loading'); // loading, empty, active, feedback, complete
    const [feedback, setFeedback] = useState(null); // 'correct', 'wrong'
    const [orientation, setOrientation] = useState('white');
    const [stats, setStats] = useState({ total: 0, learned: 0 });

    // Setup State
    const [phase, setPhase] = useState('setup'); // setup, active, complete, empty
    const [config, setConfig] = useState({
        sides: { white: true, black: true },
        forceAll: false,
        selectedTrees: [] // array of tree IDs. Empty = all.
    });

    // Helper: Get time until due formatted
    const getTimeUntilDue = (nextReview) => {
        const diff = nextReview - Date.now();
        if (diff <= 0) return "Now";
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        if (hours > 24) return `${Math.floor(hours / 24)}d`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    const startPractice = () => {
        // Generate Queue & Stats
        const newQueue = [];
        let total = 0;
        let learned = 0;
        const now = Date.now();

        const traverse = (node, parentFen, side) => {
            if (parentFen) {
                const g = new Chess(parentFen);
                const moveColor = g.turn();

                // Filter by Side
                if (moveColor === 'w' && !config.sides.white) return;
                if (moveColor === 'b' && !config.sides.black) return;

                if (moveColor === side[0]) {
                    // Filter by Tree Selection
                    // If selectedTrees is not empty, we check if this node belongs to one of them.
                    // This is tricky: Nodes don't know their tree.
                    // We need to check if this node ID is in any of the selected trees' pathIds.
                    let include = true;
                    if (config.selectedTrees.length > 0) {
                        const savedTrees = repertoire.savedVariations || [];
                        const inSelected = savedTrees.some(tree =>
                            config.selectedTrees.includes(tree.id) && tree.pathIds.includes(node.id)
                        );
                        if (!inSelected) include = false;
                    }

                    if (include) {
                        total++;
                        if (node.learning && node.learning.box > 0) {
                            learned++;
                        }

                        // Check if due OR Force All
                        const nextReview = node.learning?.nextReview || 0;
                        if (config.forceAll || nextReview <= now) {
                            newQueue.push({
                                node,
                                parentFen,
                                correctSan: node.san,
                                nextReview // Store for display
                            });
                        }
                    }
                }
            }
            node.children.forEach(child => traverse(child, node.fen, side));
        };

        if (config.sides.white) traverse(repertoire.white, null, 'white');
        if (config.sides.black) traverse(repertoire.black, null, 'black');

        setStats({ total, learned });

        // Shuffle
        for (let i = newQueue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newQueue[i], newQueue[j]] = [newQueue[j], newQueue[i]];
        }

        setQueue(newQueue);
        setPhase(newQueue.length > 0 ? 'active' : 'empty');
    };

    useEffect(() => {
        if (phase === 'active' && queue.length > 0 && !currentItem) {
            const item = queue[0];
            setCurrentItem(item);
            setGame(new Chess(item.parentFen));
            const g = new Chess(item.parentFen);
            setOrientation(g.turn() === 'w' ? 'white' : 'black');
            setFeedback(null);
        } else if (phase === 'active' && queue.length === 0) {
            setPhase('complete');
        }
    }, [phase, queue, currentItem]);

    // Helper to toggle Tree selection
    const toggleTree = (id) => {
        setConfig(prev => {
            const exists = prev.selectedTrees.includes(id);
            if (exists) {
                return { ...prev, selectedTrees: prev.selectedTrees.filter(t => t !== id) };
            } else {
                return { ...prev, selectedTrees: [...prev.selectedTrees, id] };
            }
        });
    };

    const onDrop = (source, target) => {
        if (phase !== 'active') return false;

        try {
            const move = game.move({ from: source, to: target, promotion: 'q' });
            if (!move) return false;

            if (move.san === currentItem.correctSan) {
                // Correct
                setFeedback('correct');
                // Update scheduling
                // Box logic: 0 -> 1 day, 1 -> 3, 2 -> 7, 3 -> 14, 4 -> 30, 5 -> 90
                const intervals = [1, 3, 7, 14, 30, 90];
                const currentBox = currentItem.node.learning?.box || 0;
                const newBox = Math.min(currentBox + 1, intervals.length - 1);
                const nextReview = Date.now() + (intervals[newBox] * 24 * 60 * 60 * 1000);

                currentItem.node.learning = {
                    box: newBox,
                    nextReview: nextReview,
                    lastReviewed: Date.now()
                };

                // Persist
                saveRepertoire(repertoire);

                setTimeout(() => {
                    setQueue(queue.slice(1));
                    setCurrentItem(null);
                }, 1000); // Wait a bit to show success

            } else {
                // Wrong
                setFeedback('wrong');
                // Reset to Box 0 or 1
                currentItem.node.learning = {
                    box: 0,
                    nextReview: Date.now(), // Due immediately (or tomorrow?) Usually immediate retry.
                    lastReviewed: Date.now()
                };
                // Keep in queue? Or put at end?
                // "Spaced Repetition" usually means retry until correct in same session often.
                // For now, failure puts it back at box 0, shows error.

                // Undo move on board after a delay or let them see
                saveRepertoire(repertoire);
                setTimeout(() => {
                    game.undo(); // Undo the wrong move
                    setGame(new Chess(game.fen()));
                    setFeedback(null);
                }, 1500);
            }
            return true;
        } catch (e) {
            return false;
        }
    };

    // Render Setup
    if (phase === 'setup') {
        const savedTrees = repertoire.savedVariations || [];
        return (
            <div className="container full-height">
                <header style={{ padding: '1rem 0' }}>
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ArrowLeft size={20} /> Home
                    </Link>
                </header>
                <main style={{ flex: 1, overflowY: 'auto', paddingBottom: '2rem' }}>
                    <h1 style={{ marginBottom: '1.5rem' }}>Practice Setup</h1>

                    {/* Sides */}
                    <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
                        <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>I want to practice...</div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                className={`btn ${config.sides.white ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setConfig(c => ({ ...c, sides: { ...c.sides, white: !c.sides.white } }))}
                            >White</button>
                            <button
                                className={`btn ${config.sides.black ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setConfig(c => ({ ...c, sides: { ...c.sides, black: !c.sides.black } }))}
                            >Black</button>
                        </div>
                    </div>

                    {/* Mode */}
                    <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: 600 }}>Practice All (Force Review)</span>
                            <input
                                type="checkbox"
                                checked={config.forceAll}
                                onChange={(e) => setConfig(c => ({ ...c, forceAll: e.target.checked }))}
                                style={{ width: '20px', height: '20px' }}
                            />
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                            If checked, you practice all selected moves regardless of whether they are due.
                        </p>
                    </div>

                    {/* Trees */}
                    {savedTrees.length > 0 && (
                        <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
                            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Select Openings (Optional)</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {savedTrees.map(tree => (
                                    <div key={tree.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
                                        <input
                                            type="checkbox"
                                            checked={config.selectedTrees.includes(tree.id)}
                                            onChange={() => toggleTree(tree.id)}
                                        />
                                        <span>{tree.name}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>({tree.rootColor})</span>
                                    </div>
                                ))}
                            </div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                Leave all unchecked to practice your entire repertoire.
                            </p>
                        </div>
                    )}

                    <button className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.2rem' }} onClick={startPractice}>
                        Start Session
                    </button>
                </main>
            </div>
        );
    }

    if (phase === 'loading') return <div className="container center">Loading...</div>;
    if (phase === 'empty') return (
        <div className="container full-height" style={{ justifyContent: 'center', textAlign: 'center' }}>
            <CheckCircle size={64} color="var(--success)" />
            <h2>All caught up!</h2>
            <p style={{ color: 'var(--text-secondary)' }}>No moves due for review matched your criteria.</p>
            <button onClick={() => setPhase('setup')} className="btn btn-primary" style={{ marginTop: '1rem' }}>Back to Setup</button>
        </div>
    );
    if (phase === 'complete') return (
        <div className="container full-height" style={{ justifyContent: 'center', textAlign: 'center' }}>
            <CheckCircle size={64} color="var(--success)" />
            <h2>Session Complete!</h2>
            <p style={{ color: 'var(--text-secondary)' }}>You reviewed all selected moves.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
                <Link to="/" className="btn btn-secondary">Home</Link>
                <button onClick={() => setPhase('setup')} className="btn btn-primary">Practice Again</button>
            </div>
        </div>
    );

    return (
        <div className="container full-height">
            <header style={{ padding: '1rem 0' }}>
                <button onClick={() => setPhase('setup')} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', padding: 0 }}>
                    <ArrowLeft size={20} /> Quit Session
                </button>
            </header>

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Info Card */}
                {currentItem && (
                    <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                            {repertoire.savedVariations?.find(v => v.pathIds.includes(currentItem.node.id))?.name || "Practicing Node"}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            Learned: {stats.learned} / {stats.total} ({Math.round(stats.total ? (stats.learned / stats.total) * 100 : 0)}%)
                            {currentItem.node.learning && currentItem.node.learning.box > 0 && (
                                <span style={{ marginLeft: '1rem', color: 'var(--accent-primary)' }}>
                                    (Due: {getTimeUntilDue(currentItem.nextReview)})
                                </span>
                            )}
                        </div>
                    </div>
                )}

                <div style={{ position: 'relative' }}>
                    <ChessboardWrapper
                        position={game.fen()}
                        onPieceDrop={onDrop}
                        orientation={orientation}
                        arePiecesDraggable={phase === 'active' && !feedback}
                    />
                    {feedback && (
                        <div style={{
                            position: 'absolute',
                            top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: feedback === 'correct' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            pointerEvents: 'none'
                        }}>
                            {feedback === 'correct'
                                ? <CheckCircle size={64} color="#fff" />
                                : <XCircle size={64} color="#fff" />
                            }
                        </div>
                    )}
                </div>

                <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
                    <p style={{ margin: 0, fontSize: '1.25rem' }}>
                        {feedback === 'wrong' ? `Try again!` : `Play the move for ${orientation}`}
                    </p>
                    <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        {queue.length} moves remaining
                    </p>
                </div>
            </main>
        </div >
    );
}
