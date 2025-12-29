import React, { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import { v4 as uuidv4 } from 'uuid';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Trash2, RefreshCw, Plus, Save } from 'lucide-react';
import ChessboardWrapper from '../components/ChessboardWrapper';
import { loadRepertoire, saveRepertoire } from '../utils/storage';

export default function Editor() {
    const [repertoire, setRepertoire] = useState(loadRepertoire());
    const [side, setSide] = useState('white');
    const [boardOrientation, setBoardOrientation] = useState('white');
    const location = useLocation();

    // Core Tree State
    const [currentNode, setCurrentNode] = useState(repertoire['white']);
    const [history, setHistory] = useState([]);
    const [activeTreeId, setActiveTreeId] = useState(null);
    const [future, setFuture] = useState([]);
    const [manualMove, setManualMove] = useState('');
    const [tempName, setTempName] = useState(''); // For the input field

    // Load initial tree if provided
    useEffect(() => {
        if (location.state?.loadTreeId) {
            loadTree(location.state.loadTreeId);
        }
    }, [location.state]);

    const loadTree = (treeId) => {
        const savedRep = loadRepertoire(); // Ensure fresh data
        const snapshot = savedRep.savedVariations?.find(t => t.id === treeId);

        if (snapshot) {
            // Restore state
            setSide(snapshot.rootColor);
            setBoardOrientation(snapshot.rootColor);

            const root = savedRep[snapshot.rootColor];
            let current = root;
            const newHistory = [];

            // Traverse path
            for (const id of snapshot.pathIds) {
                if (id === root.id) continue;
                const child = current.children.find(c => c.id === id);
                if (child) {
                    newHistory.push(current);
                    current = child;
                } else {
                    break;
                }
            }

            setHistory(newHistory);
            setFuture([]); // Clear future on new load
            setCurrentNode(current);
            setActiveTreeId(snapshot.id);
            setTempName(snapshot.name);
            setRepertoire(savedRep);
        }
    };

    const getPgn = () => {
        let pgn = '';
        let tempNode = repertoire['white']; // Start from root
        // We need to reconstruct the path from history + currentNode
        // But history stores node references.
        // Let's iterate history.
        let fullPath = [...history, currentNode];

        // This is tricky because history doesn't store "move index" easily if we just list nodes.
        // But we can just iterate and append SANs.
        // Standard PGN needs move numbers. 
        // 1. e4 e5 2. Nf3

        // Skip root
        let moveCount = 1;
        for (let i = 1; i < fullPath.length; i++) {
            const node = fullPath[i];
            if (i % 2 !== 0) { // White's move (1st move is index 1)
                pgn += `${moveCount}. ${node.san} `;
            } else { // Black's move
                pgn += `${node.san} `;
                moveCount++;
            }
        }
        return pgn.trim();
    };

    // Find Saved Tree (Helper)
    // We now rely on activeTreeId for "identity", but we can still check if path matches for robust sync
    const activeTree = repertoire.savedVariations?.find(t => t.id === activeTreeId);

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
        setActiveTreeId(null);
        setTempName('');
        setBoardOrientation(newSide);
    };

    const updateActiveTree = (nodeId) => {
        if (!activeTreeId) return;

        const newRep = { ...repertoire };
        const tree = newRep.savedVariations.find(t => t.id === activeTreeId);
        if (tree) {
            // Extend path
            // We assume history is already up to date when calling this? 
            // Actually makeMove calls this.
            // The path should be [...history, currentNode].map(id) but currentNode is updated via state...
            // Wait, we need the FULL path.

            // NOTE: State updates are async. We can't rely on 'history' being updated yet if called immediately.
            // But makeMove updates history and currentNode locally.
            // Let's pass the new path explicitly or wait for effect?
            // Safer to pass the new node ID and append it if it matches logic.

            // Actually, simply re-saving the path of the current moment is complex due to async state.
            // BETTER: We append the new nodeId to the active tree's path list directly.

            // Check if nodeId is already in path (back/forward navigation) -> No need to duplicate.
            if (!tree.pathIds.includes(nodeId)) {
                tree.pathIds.push(nodeId);
                tree.date = new Date().toISOString();
                setRepertoire(newRep);
            }
        }
    };

    // Derived Visual State: FEN string
    const currentFen = currentNode.fen || new Chess().fen();

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
                    setFuture([]); // New move clears future
                    // Sticky: If active tree, update its path if this move extends it
                    if (activeTreeId) {
                        updateActiveTree(existingChild.id);
                    }
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
                    setFuture([]);

                    // Sticky: Extend active tree
                    if (activeTreeId) {
                        const newRep = { ...repertoire };
                        const tree = newRep.savedVariations.find(t => t.id === activeTreeId);
                        if (tree) {
                            tree.pathIds.push(newChild.id);
                            tree.date = new Date().toISOString();
                            setRepertoire(newRep);
                        }
                    }
                }
                setManualMove('');
                return true;
            }
        } catch (e) {
            console.warn("Invalid move:", moveInput);
            return false;
        }
        return false;
    }, [currentFen, currentNode, repertoire, activeTreeId]); // Added activeTreeId dep

    function onPieceDrop(source, target) {
        return makeMove({ from: source, to: target, promotion: 'q' });
    }

    const handleBack = () => {
        if (history.length === 0) return;
        const prev = history[history.length - 1];
        setHistory(h => h.slice(0, -1));
        setFuture(f => [currentNode, ...f]);
        setCurrentNode(prev);
    };

    const handleForward = () => {
        if (future.length === 0) return;
        const next = future[0];
        setFuture(f => f.slice(1));
        setHistory(h => [...h, currentNode]);
        setCurrentNode(next);
    };

    const handleTreeSave = () => {
        const name = tempName.trim();
        if (!name) return;

        const newRep = { ...repertoire };
        if (!newRep.savedVariations) newRep.savedVariations = [];

        if (activeTreeId) {
            // Update existing
            const tree = newRep.savedVariations.find(t => t.id === activeTreeId);
            if (tree) {
                tree.name = name;
                tree.date = new Date().toISOString();
                // Ensure path is synced? Usually sticky handles it, but good to ensure.
                const currentPathIds = [...history, currentNode].map(n => n.id);
                tree.pathIds = currentPathIds;
            }
        } else {
            // Create new
            const newId = uuidv4();
            const currentPathIds = [...history, currentNode].map(n => n.id);
            const snapshot = {
                id: newId,
                name,
                rootColor: side,
                pathIds: currentPathIds,
                date: new Date().toISOString()
            };
            newRep.savedVariations.push(snapshot);
            setActiveTreeId(newId);
        }
        setRepertoire(newRep);
    };

    const handleDelete = () => {
        if (activeTreeId) {
            // Delete Tree
            // Use local find to ensure we have the name
            const treeToDelete = repertoire.savedVariations?.find(t => t.id === activeTreeId);
            const name = treeToDelete?.name || "this opening";

            if (!confirm(`Delete opening "${name}"?`)) return;

            const newRep = {
                ...repertoire,
                savedVariations: (repertoire.savedVariations || []).filter(t => t.id !== activeTreeId)
            };

            setRepertoire(newRep);
            setActiveTreeId(null);
            setTempName('');

            // Allow React to process the state update, but also reset board immediately
            const root = newRep[side];
            setCurrentNode(root);
            setHistory([]);
            setFuture([]);
        } else {
            // Just reset board
            if (!confirm("Reset the board? Unsaved moves will be lost.")) return;
            const root = repertoire[side];
            setCurrentNode(root);
            setHistory([]);
            setFuture([]);
            setTempName('');
        }
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{
                            fontFamily: 'monospace',
                            fontSize: '0.875rem',
                            color: 'var(--text-secondary)',
                            flex: 1,
                            minWidth: '200px'
                        }}>
                            {getPgn() || "Start"}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-secondary" onClick={() => setBoardOrientation(c => c === 'white' ? 'black' : 'white')} title="Flip Board">
                                <RefreshCw size={16} />
                            </button>
                            <button className="btn btn-secondary" onClick={handleBack} disabled={history.length === 0} title="Back">
                                <ArrowLeft size={16} />
                            </button>
                            <button className="btn btn-secondary" onClick={handleForward} disabled={future.length === 0} title="Forward">
                                <ArrowRight size={16} />
                            </button>
                            <button className="btn btn-secondary" style={{ color: 'var(--error)' }} onClick={handleDelete} title={activeTreeId ? "Delete Saved Tree" : "Reset Board"}>
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Opening Naming */}
                    <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                            className="input"
                            style={{ flex: 1 }}
                            placeholder="Opening Name (e.g. Sicilian Najdorf)..."
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                        />
                        <button
                            className="btn btn-primary"
                            onClick={handleTreeSave}
                            disabled={!tempName.trim()}
                        >
                            <Save size={16} /> Save
                        </button>
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
                                        setFuture([]);
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

                    {/* Saved Trees List */}
                    {repertoire.savedVariations && repertoire.savedVariations.length > 0 && (
                        <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Saved Trees</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {repertoire.savedVariations.map(tree => (
                                    <div
                                        key={tree.id}
                                        onClick={() => loadTree(tree.id)}
                                        style={{
                                            padding: '0.5rem',
                                            backgroundColor: 'var(--bg-primary)',
                                            borderRadius: 'var(--radius-sm)',
                                            cursor: 'pointer',
                                            fontSize: '0.875rem',
                                            display: 'flex',
                                            justifyContent: 'space-between'
                                        }}
                                        className="hover-bg-secondary"
                                    >
                                        <span>{tree.name}</span>
                                        <span style={{ color: 'var(--text-secondary)' }}>{tree.rootColor}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
