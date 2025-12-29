import React, { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import { v4 as uuidv4 } from 'uuid';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trash2, RefreshCw, Plus } from 'lucide-react';
import ChessboardWrapper from '../components/ChessboardWrapper';
import { loadRepertoire, saveRepertoire } from '../utils/storage';

export default function Editor() {
    const [repertoire, setRepertoire] = useState(loadRepertoire());
    const [side, setSide] = useState('white');
    const [boardOrientation, setBoardOrientation] = useState('white');

    // Core Tree State
    const [currentNode, setCurrentNode] = useState(repertoire['white']);
    const [history, setHistory] = useState([]);
    const [manualMove, setManualMove] = useState('');

    // Derived Visual State: FEN string
    const currentFen = currentNode.fen || new Chess().fen();

    // Persist
    useEffect(() => {
        saveRepertoire(repertoire);
    }, [repertoire]);

    // Side Switch Logic
    const handleSideChange = (newSide) => {
        if (newSide === side) return;
        setSide(newSide);
        const root = repertoire[newSide];
        setCurrentNode(root);
        setHistory([]);
        setBoardOrientation(newSide);
    };

    const makeMove = useCallback((moveInput) => {
        try {
            const game = new Chess(currentFen);
            let move = null;
            if (typeof moveInput === 'string') {
                move = game.move(moveInput);
            } else {
                move = game.move(moveInput);
            }

            if (move) {
                const newFen = game.fen();
                const existingChild = currentNode.children.find(c => c.san === move.san);

                if (existingChild) {
                    setHistory(h => [...h, currentNode]);
                    setCurrentNode(existingChild);
                } else {
                    const newChild = {
                        id: uuidv4(),
                        san: move.san,
                        fen: newFen,
                        children: [],
                        comments: '',
                        learning: { box: 0, nextReview: Date.now() }
                    };
                    currentNode.children.push(newChild);
                    setRepertoire(prev => ({ ...prev }));
                    setHistory(h => [...h, currentNode]);
                    setCurrentNode(newChild);
                }
                setManualMove('');
                return true;
            }
        } catch (e) {
            console.warn("Invalid move:", moveInput);
            return false;
        }
        return false;
    }, [currentFen, currentNode, repertoire]);

    function onPieceDrop(source, target) {
        return makeMove({ from: source, to: target, promotion: 'q' });
    }

    const handleBack = () => {
        if (history.length === 0) return;
        const prev = history[history.length - 1];
        setHistory(h => h.slice(0, -1));
        setCurrentNode(prev);
    };

    const handleDelete = () => {
        if (history.length === 0) return;
        const parent = history[history.length - 1];
        parent.children = parent.children.filter(c => c.id !== currentNode.id);
        setRepertoire({ ...repertoire });
        setHistory(h => h.slice(0, -1));
        setCurrentNode(parent);
    };

    return (
        <div className="container full-height">
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 0' }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ArrowLeft size={20} /> Home
                </Link>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        className={`btn ${side === 'white' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => handleSideChange('white')}
                    >White</button>
                    <button
                        className={`btn ${side === 'black' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => handleSideChange('black')}
                    >Black</button>
                </div>
            </header>

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Board Container */}
                <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
                    <ChessboardWrapper
                        position={currentFen}
                        onPieceDrop={onPieceDrop}
                        orientation={boardOrientation}
                    />
                </div>

                {/* Controls */}
                <div className="controls" style={{
                    backgroundColor: 'var(--bg-secondary)',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    maxWidth: '600px',
                    margin: '0 auto',
                    width: '100%'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ fontWeight: 'bold' }}>
                            {currentNode.san || "Start"}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-secondary" onClick={() => setBoardOrientation(c => c === 'white' ? 'black' : 'white')}>
                                <RefreshCw size={16} /> Flip
                            </button>
                            <button className="btn btn-secondary" onClick={handleBack} disabled={history.length === 0}>
                                <ArrowLeft size={16} /> Back
                            </button>
                            {history.length > 0 &&
                                <button className="btn btn-secondary" style={{ color: 'var(--error)' }} onClick={handleDelete}>
                                    <Trash2 size={16} />
                                </button>
                            }
                        </div>
                    </div>

                    {/* Manual Entry */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                        <input
                            className="input"
                            style={{ flex: 1 }}
                            placeholder="Enter move (e.g. e4, Nf3)..."
                            value={manualMove}
                            onChange={(e) => setManualMove(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') makeMove(manualMove);
                            }}
                        />
                        <button className="btn btn-primary" onClick={() => makeMove(manualMove)}>
                            <Plus size={16} /> Add
                        </button>
                    </div>

                    {/* Variations */}
                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Variations</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {currentNode.children.length === 0 && <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No moves. Drag on board or enter manually.</span>}
                            {currentNode.children.map(child => (
                                <button
                                    key={child.id}
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setHistory(h => [...h, currentNode]);
                                        setCurrentNode(child);
                                    }}
                                >
                                    {child.san}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Comments */}
                    <div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Comments</div>
                        <textarea
                            className="input"
                            style={{ width: '100%', minHeight: '60px', resize: 'vertical' }}
                            value={currentNode.comments || ''}
                            onChange={(e) => {
                                currentNode.comments = e.target.value;
                                setRepertoire({ ...repertoire });
                            }}
                            placeholder="Notes on this position..."
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}
