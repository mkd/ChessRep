import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Play, Settings, RefreshCw, X } from 'lucide-react';
import ChessboardWrapper from '../components/ChessboardWrapper';
import RepertoireHeader from '../components/RepertoireHeader';
import { loadRepertoire, saveRepertoire } from '../utils/storage';

export default function Practice() {
    const [repertoire, setRepertoire] = useState(loadRepertoire());

    // State Machine: 'setup' | 'active' | 'feedback' | 'complete' | 'empty'
    const [phase, setPhase] = useState('setup');

    // Config
    const [config, setConfig] = useState({
        sides: { white: true, black: true },
        forceAll: false,
        selectedTrees: [] // IDs
    });

    // Session State
    const [queue, setQueue] = useState([]);
    const [currentItem, setCurrentItem] = useState(null);
    const [game, setGame] = useState(new Chess());
    const [orientation, setOrientation] = useState('white');
    const [stats, setStats] = useState({ total: 0, learned: 0, due: 0, sessionCorrect: 0, sessionWrong: 0 });
    const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong'

    // --- Helpers ---
    const getTimeUntilDue = (nextReview) => {
        const diff = nextReview - Date.now();
        if (diff <= 0) return "Now";
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        if (hours > 24) return `${Math.floor(hours / 24)}d`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    const toggleTree = (id) => {
        setConfig(prev => {
            const exists = prev.selectedTrees.includes(id);
            if (exists) return { ...prev, selectedTrees: prev.selectedTrees.filter(t => t !== id) };
            return { ...prev, selectedTrees: [...prev.selectedTrees, id] };
        });
    };

    const [isAnimating, setIsAnimating] = useState(false);
    const [hintSquare, setHintSquare] = useState(null);

    // --- Effect: Load Item & Animate ---
    // --- Effect: Next Item Management ---
    useEffect(() => {
        if (phase === 'active' && queue.length > 0 && !currentItem) {
            const item = queue[0];
            setCurrentItem(item);
        } else if (phase === 'active' && queue.length === 0 && !currentItem) {
            setPhase('complete');
        }
    }, [phase, queue, currentItem]);

    // --- Effect: Animation & Setup ---
    useEffect(() => {
        if (!currentItem) return;

        // Reset state
        setFeedback(null);
        setHintSquare(null);

        // Orientation
        const g = new Chess(currentItem.parentFen);
        setOrientation(g.turn() === 'w' ? 'white' : 'black');

        // Animation Logic
        if (currentItem.history && currentItem.history.length > 0) {
            setIsAnimating(true);
            setGame(new Chess()); // Start fresh for animation

            let moveIndex = 0;
            const animateInterval = setInterval(() => {
                if (moveIndex >= currentItem.history.length) {
                    clearInterval(animateInterval);
                    setIsAnimating(false);
                    setGame(new Chess(currentItem.parentFen)); // Sync state
                    return;
                }

                // Play next move
                setGame(g => {
                    const newG = new Chess(g.fen());
                    newG.move(currentItem.history[moveIndex]);
                    return newG;
                });
                moveIndex++;
            }, 600);

            return () => {
                clearInterval(animateInterval);
                setIsAnimating(false); // Ensure we unlock if unmounted/changed
            };
        } else {
            // No history, just load
            setIsAnimating(false);
            setGame(new Chess(currentItem.parentFen));
        }
    }, [currentItem]);

    // Update startPractice to include history in queue items
    // We need to modify the traverse function in startPractice.
    // Since I can't easily edit startPractice via this chunk without replacing the whole file,
    // I will rewrite startPractice here.

    // --- Logic: Start Session ---
    const startPractice = () => {
        const newQueue = [];
        let total = 0, learned = 0, due = 0;
        const now = Date.now();

        const traverse = (node, fenBeforeMove, side, historyMoves = []) => {
            if (fenBeforeMove) {
                const g = new Chess(fenBeforeMove);
                const turnToMove = g.turn();

                // If current turn matches the side we are practicing, add to queue
                if (node.san && turnToMove === side[0]) {
                    // Filter by Tree
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
                        if (node.learning?.box > 0) learned++;

                        const nextReview = node.learning?.nextReview || 0;
                        if (nextReview <= now) due++;

                        if (config.forceAll || nextReview <= now) {
                            newQueue.push({
                                node,
                                parentFen: fenBeforeMove,
                                correctSan: node.san,
                                nextReview,
                                history: historyMoves
                            });
                        }
                    }
                }
            }

            // Calculate FEN AFTER this node's move to pass to children
            let fenAfterMove = fenBeforeMove;
            if (node.san) {
                const g = new Chess(fenBeforeMove || new Chess().fen());
                g.move(node.san);
                fenAfterMove = g.fen();
            } else if (!fenBeforeMove && node.fen) {
                // Root case handling if startFen passed as null (shouldn't happen with current call)
                fenAfterMove = node.fen;
            }

            // Calculate history for children (append current node's move if exists)
            const nextHistory = node.san ? [...historyMoves, node.san] : historyMoves;

            for (const child of node.children) {
                // Child needs the FEN *after* parent's move as its starting point
                traverse(child, fenAfterMove, side, nextHistory);
            }
        };

        const startFen = new Chess().fen();
        if (config.sides.white) traverse(repertoire.white, startFen, 'white', []);
        if (config.sides.black) traverse(repertoire.black, startFen, 'black', []);

        // Shuffle
        for (let i = newQueue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newQueue[i], newQueue[j]] = [newQueue[j], newQueue[i]];
        }

        setStats({ total, learned, due, sessionCorrect: 0, sessionWrong: 0 });
        setQueue(newQueue);
        setPhase(newQueue.length > 0 ? 'active' : 'empty');
    };


    // --- Logic: Handle Move ---
    const onDrop = (source, target) => {
        if (phase !== 'active' || feedback || isAnimating) return false;

        try {
            const move = game.move({ from: source, to: target, promotion: 'q' });
            if (!move) return false;

            if (move.san === currentItem.correctSan) {
                // Correct
                setFeedback('correct');
                setHintSquare(null);

                // Scheduling Logic
                const intervals = [1, 3, 7, 14, 30, 90];
                const currentBox = currentItem.node.learning?.box || 0;
                const newBox = Math.min(currentBox + 1, intervals.length - 1);
                const nextReview = Date.now() + (intervals[newBox] * 24 * 60 * 60 * 1000);

                currentItem.node.learning = {
                    box: newBox,
                    nextReview: nextReview,
                    lastReviewed: Date.now()
                };

                setStats(s => ({ ...s, sessionCorrect: s.sessionCorrect + 1 }));
                saveRepertoire(repertoire);

                setTimeout(() => {
                    setQueue(q => q.slice(1));
                    setCurrentItem(null);
                    setFeedback(null);
                }, 1200);

            } else {
                // Wrong
                setFeedback('wrong');

                currentItem.node.learning = {
                    box: 0,
                    nextReview: Date.now(),
                    lastReviewed: Date.now()
                };

                setStats(s => ({ ...s, sessionWrong: s.sessionWrong + 1 }));
                saveRepertoire(repertoire);

                setTimeout(() => {
                    game.undo();
                    setGame(new Chess(game.fen()));
                    setFeedback(null);
                }, 1500);
            }
            return true;
        } catch (e) {
            return false;
        }
    };

    const handleGiveHint = () => {
        // Highlight from square
        // We need to know the 'from' square of the correct move.
        // We have `currentItem.correctSan`. We need to parse it relative to `game`.
        try {
            const g = new Chess(game.fen());
            const move = g.move(currentItem.correctSan); // This returns the move object with `from` and `to`
            if (move) {
                setHintSquare(move.from);
            }
        } catch (e) {
            console.error(e);
        }
    };

    // --- Render Helpers ---
    const getSquareStyles = () => {
        if (!hintSquare) return {};
        return {
            [hintSquare]: { backgroundColor: 'rgba(255, 255, 0, 0.5)' }
        };
    };

    // --- Render: Setup ---
    if (phase === 'setup') {
        const savedTrees = repertoire.savedVariations || [];
        return (
            <div className="full-height bg-primary">
                <RepertoireHeader breadcrumbs={['Practice', 'Setup']} />

                <main className="container" style={{ paddingTop: '1rem', paddingBottom: '2rem' }}>
                    <div className="card" style={{ marginBottom: '1rem' }}>
                        <div className="font-semibold" style={{ marginBottom: '0.5rem' }}>I want to practice...</div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className={`btn ${config.sides.white ? 'btn-primary' : 'btn-secondary'} flex-1`}
                                onClick={() => setConfig(c => ({ ...c, sides: { ...c.sides, white: !c.sides.white } }))}>White</button>
                            <button className={`btn ${config.sides.black ? 'btn-primary' : 'btn-secondary'} flex-1`}
                                onClick={() => setConfig(c => ({ ...c, sides: { ...c.sides, black: !c.sides.black } }))}>Black</button>
                        </div>
                    </div>

                    <div className="card" style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="font-semibold">Ignore Schedule (Practice All)</span>
                            <div
                                onClick={() => setConfig(c => ({ ...c, forceAll: !c.forceAll }))}
                                style={{
                                    width: '40px', height: '24px',
                                    backgroundColor: config.forceAll ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                                    borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'background-color 0.2s'
                                }}
                            >
                                <div style={{
                                    width: '20px', height: '20px', backgroundColor: 'white', borderRadius: '50%',
                                    position: 'absolute', top: '2px', left: config.forceAll ? '18px' : '2px', transition: 'left 0.2s'
                                }} />
                            </div>
                        </div>
                    </div>

                    {savedTrees.length > 0 && (
                        <div className="card" style={{ marginBottom: '1.5rem' }}>
                            <div className="font-semibold" style={{ marginBottom: '0.5rem' }}>Select Openings</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {savedTrees.map(tree => {
                                    const selected = config.selectedTrees.includes(tree.id);
                                    return (
                                        <div key={tree.id}
                                            onClick={() => toggleTree(tree.id)}
                                            className="btn-ghost"
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                                padding: '0.75rem', borderRadius: 'var(--radius-md)',
                                                backgroundColor: selected ? 'var(--bg-tertiary)' : 'transparent',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <div style={{
                                                width: '18px', height: '18px', borderRadius: '4px', border: '2px solid var(--text-secondary)',
                                                backgroundColor: selected ? 'var(--accent-primary)' : 'transparent',
                                                borderColor: selected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                {selected && <div style={{ width: '8px', height: '8px', backgroundColor: 'white', borderRadius: '2px' }} />}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div className="font-medium">{tree.name}</div>
                                                <div className="text-secondary text-xs">{tree.rootColor}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <button className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }} onClick={startPractice}>
                        <Play fill="currentColor" size={20} /> Start Session
                    </button>

                    <div className="text-center text-secondary text-sm" style={{ marginTop: '1rem' }}>
                        {config.forceAll ? 'Will practice all moves.' : 'Will only practice moves due for review.'}
                    </div>
                </main>
            </div>
        );
    }

    // --- Render: Empty/Complete ---
    if (phase === 'empty' || phase === 'complete') {
        const isComplete = phase === 'complete';
        return (
            <div className="full-height bg-primary container flex-col items-center justify-center text-center" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ marginBottom: '2rem' }}>
                    {isComplete ? <CheckCircle size={80} className="text-success" /> : <CheckCircle size={80} className="text-secondary" />}
                </div>
                <h2 className="text-xl font-bold mb-2">{isComplete ? "Session Complete!" : "All caught up!"}</h2>
                <p className="text-secondary mb-8">
                    {isComplete
                        ? `You practiced ${stats.total} moves. Correct: ${stats.sessionCorrect}, Wrong: ${stats.sessionWrong}.`
                        : "No moves are due for review right now."}
                </p>
                <div className="flex gap-4">
                    <Link to="/" className="btn btn-secondary">Home</Link>
                    <button onClick={() => setPhase('setup')} className="btn btn-primary">Practice Again</button>
                </div>
            </div>
        );
    }

    // --- Render: Active ---
    if (!currentItem) return <div className="full-height bg-primary" />;

    const activeTreeName = repertoire.savedVariations?.find(v => v.pathIds.includes(currentItem.node.id))?.name || "Practicing Node";

    return (
        <div className="full-height bg-primary relative">
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '60px', zIndex: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem'
            }}>
                <button onClick={() => setPhase('setup')} className="btn-ghost" style={{ padding: '0.5rem' }}><X size={24} /></button>
                <div className="text-lg font-bold">{activeTreeName}</div>
                <div style={{ width: '40px' }} /> {/* Spacer */}
            </div>

            {/* Board */}
            <div style={{ marginTop: '80px', padding: '0 0.5rem' }}>
                <div style={{ width: '100%', maxWidth: '420px', margin: '0 auto', position: 'relative' }}>
                    <ChessboardWrapper
                        position={game.fen()}
                        onPieceDrop={onDrop}
                        orientation={orientation}
                        arePiecesDraggable={!feedback && !isAnimating}
                        squareStyles={getSquareStyles()}
                    />

                    {/* Feedback Overlay */}
                    {feedback && (
                        <div className="animate-fadeIn" style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: feedback === 'correct' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)',
                            borderRadius: '2px', pointerEvents: 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {feedback === 'correct' ? <CheckCircle size={80} color="white" /> : <XCircle size={80} color="white" />}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Controls */}
            <div className="sheet" style={{
                marginTop: 'auto', flex: 1, maxHeight: '30vh',
                borderTopLeftRadius: '1.5rem', borderTopRightRadius: '1.5rem',
                justifyContent: 'space-between', paddingBottom: '2rem'
            }}>
                <div className="text-center">
                    <div className="text-secondary text-sm font-medium mb-1">
                        {game.turn() === 'w' ? "White to move" : "Black to move"}
                    </div>
                    {feedback === 'correct' && (
                        <div className="text-success font-bold animate-fadeIn">
                            Great! Next review: {getTimeUntilDue(currentItem.nextReview)}
                        </div>
                    )}
                    {feedback === 'wrong' && (
                        <div className="text-error font-bold animate-fadeIn">
                            Incorrect. Reviewing soon.
                        </div>
                    )}
                    {!feedback && <div className="text-xl font-bold">Find the move</div>}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                    <div className="text-secondary text-xs">
                        {queue.length} left
                    </div>
                    <button className="btn btn-secondary" onClick={handleGiveHint}>
                        Show me the move
                    </button>
                    <div className="text-secondary text-xs">
                        {stats.sessionCorrect} / {stats.sessionCorrect + stats.sessionWrong}
                    </div>
                </div>
            </div>
        </div>
    );
}
