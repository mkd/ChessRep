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

    useEffect(() => {
        // Generate Queue
        const newQueue = [];
        const now = Date.now();

        const traverse = (node, parentFen, side) => {
            // Determine who made the move at 'node'
            // If parentFen is undefined (Root), node is root. No move made.

            if (parentFen) {
                const g = new Chess(parentFen);
                const moveColor = g.turn(); // 'w' or 'b'

                // If the move that created this node was made by 'side', it's a practice item
                // Node represents the state AFTER the move.
                // So if I am White, I want to practice White moves.
                // White moves are those where `parentFen` turn was 'w'.

                if (moveColor === side[0]) {
                    // Check if due
                    const nextReview = node.learning?.nextReview || 0;
                    if (nextReview <= now) {
                        newQueue.push({
                            node,
                            parentFen,
                            correctSan: node.san
                        });
                    }
                }
            }

            // Recurse
            node.children.forEach(child => traverse(child, node.fen, side));
        };

        traverse(repertoire.white, null, 'white');
        traverse(repertoire.black, null, 'black');

        // Shuffle
        for (let i = newQueue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newQueue[i], newQueue[j]] = [newQueue[j], newQueue[i]];
        }

        setQueue(newQueue);
        setStatus(newQueue.length > 0 ? 'active' : 'empty');
    }, []);

    useEffect(() => {
        if (status === 'active' && queue.length > 0 && !currentItem) {
            const item = queue[0];
            setCurrentItem(item);
            setGame(new Chess(item.parentFen));
            const g = new Chess(item.parentFen);
            setOrientation(g.turn() === 'w' ? 'white' : 'black');
            setFeedback(null);
        } else if (status === 'active' && queue.length === 0) {
            setStatus('complete');
        }
    }, [status, queue, currentItem]);

    const onDrop = (source, target) => {
        if (status !== 'active') return false;

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

    if (status === 'loading') return <div className="container center">Loading...</div>;
    if (status === 'empty') return (
        <div className="container full-height" style={{ justifyContent: 'center', textAlign: 'center' }}>
            <CheckCircle size={64} color="var(--success)" />
            <h2>All caught up!</h2>
            <p style={{ color: 'var(--text-secondary)' }}>No moves due for review.</p>
            <Link to="/" className="btn btn-primary">Back Home</Link>
        </div>
    );
    if (status === 'complete') return (
        <div className="container full-height" style={{ justifyContent: 'center', textAlign: 'center' }}>
            <CheckCircle size={64} color="var(--success)" />
            <h2>Session Complete!</h2>
            <p style={{ color: 'var(--text-secondary)' }}>You reviewed all due moves.</p>
            <Link to="/" className="btn btn-primary">Back Home</Link>
        </div>
    );

    return (
        <div className="container full-height">
            <header style={{ padding: '1rem 0' }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ArrowLeft size={20} /> Quit Practice
                </Link>
            </header>

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                    <ChessboardWrapper
                        position={game.fen()}
                        onPieceDrop={onDrop}
                        orientation={orientation}
                        arePiecesDraggable={status === 'active' && !feedback}
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
        </div>
    );
}
