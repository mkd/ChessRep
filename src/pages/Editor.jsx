import React, { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import { v4 as uuidv4 } from 'uuid';
import { useLocation, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, RefreshCw, Save } from 'lucide-react';
import ChessboardWrapper from '../components/ChessboardWrapper';
import RepertoireHeader from '../components/RepertoireHeader';
import AnalysisPanel from '../components/AnalysisPanel';
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

    // Derived Visual State: FEN string
    const currentFen = currentNode.fen || new Chess().fen();

    // Load initial tree if provided
    useEffect(() => {
        if (location.state?.loadTreeId) {
            loadTree(location.state.loadTreeId);
        }
    }, [location.state]);

    const loadTree = (treeId) => {
        const savedRep = loadRepertoire();
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
            setFuture([]);
            setCurrentNode(current);
            setActiveTreeId(snapshot.id);
            setRepertoire(savedRep);
        }
    };

    // Persist
    useEffect(() => {
        saveRepertoire(repertoire);
    }, [repertoire]);

    const makeMove = useCallback((moveInput) => {
        try {
            const game = new Chess(currentFen);
            let move = null;
            try {
                move = game.move(moveInput);
            } catch (e) {
                return false;
            }

            if (move) {
                const newFen = game.fen();
                const existingChild = currentNode.children.find(c => c.san === move.san);

                if (existingChild) {
                    setHistory(h => [...h, currentNode]);
                    setCurrentNode(existingChild);
                    setFuture([]);
                    if (activeTreeId) updateActiveTree(existingChild.id);
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
                    if (activeTreeId) extendActiveTree(newChild.id);
                }
                return true;
            }
        } catch (e) {
            return false;
        }
        return false;
    }, [currentFen, currentNode, repertoire]);

    // Helper to format PGN
    const formatPGN = (historyMoves) => {
        return historyMoves.reduce((acc, move, i) => {
            const moveNum = Math.floor(i / 2) + 1;
            if (i % 2 === 0) {
                return acc + (i > 0 ? ' ' : '') + moveNum + '. ' + move;
            } else {
                return acc + ' ' + move;
            }
        }, '');
    };

    // Helper to find path to a node
    const findPathToNode = (root, targetId) => {
        if (root.id === targetId) return [root];
        for (const child of root.children) {
            const path = findPathToNode(child, targetId);
            if (path) return [root, ...path];
        }
        return null;
    };

    const handleLoadLine = (leafId) => {
        const root = repertoire[side];
        const path = findPathToNode(root, leafId);
        if (path) {
            setHistory(path.slice(0, -1));
            setCurrentNode(path[path.length - 1]);
            setFuture([]);
        }
    };

    const handleDeleteNode = (targetId) => {
        // Recursive delete
        const deleteFromNode = (node) => {
            const idx = node.children.findIndex(c => c.id === targetId);
            if (idx !== -1) {
                node.children.splice(idx, 1);
                return true;
            }
            for (const child of node.children) {
                if (deleteFromNode(child)) return true;
            }
            return false;
        };

        const root = repertoire[side];
        if (deleteFromNode(root)) {
            setRepertoire({ ...repertoire });
            if (history.some(n => n.id === targetId) || currentNode.id === targetId) {
                setHistory([]);
                setCurrentNode(root);
                setFuture([]);
            }
        }
    };

    const handleDeleteLine = (leafId) => {
        const root = repertoire[side];
        const path = findPathToNode(root, leafId);
        if (!path || path.length < 2) return;

        let deleteTarget = path[path.length - 1]; // Default to leaf

        // Walk upwards to find the highest exclusive parent
        for (let i = path.length - 2; i >= 0; i--) {
            const parent = path[i];
            const child = path[i + 1];

            if (parent.children.length > 1) {
                // Branch point found, delete the child that leads to our line
                deleteTarget = child;
                break;
            } else if (parent === root) {
                // Reached root, delete the child of root
                deleteTarget = child;
                break;
            } else {
                // Parent has only 1 child and is not root, so it is part of the line
                deleteTarget = parent;
            }
        }

        handleDeleteNode(deleteTarget.id);
    };

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

    // Breadcrumbs Calculation
    const getBreadcrumbs = () => {
        return [side === 'white' ? 'White Repertoire' : 'Black Repertoire'];
    };

    const handleSettingsClick = () => {
        const newSide = side === 'white' ? 'black' : 'white';
        setSide(newSide);
        setBoardOrientation(newSide);
        setCurrentNode(repertoire[newSide]);
        setHistory([]);
        setFuture([]);
    };

    const handleSaveAnnotation = (text) => {
        currentNode.comments = text;
        setRepertoire({ ...repertoire });
    };

    const handleGapClick = () => {
        // Find next gap (first leaf node in current subtree)
        // BFS to find closest leaf
        const queue = [currentNode];
        while (queue.length > 0) {
            const node = queue.shift();
            if (node.children.length === 0 && node !== currentNode) {
                // Determine path to this node to set history/future... complex without parent pointers
                // For now, simple alert as placeholder
                alert("Gap navigation: Jump to " + node.san);
                return;
            }
            queue.push(...node.children);
        }
        alert("No gaps found in this line!");
    };

    const handleMoveSelect = (san) => {
        makeMove(san);
    };

    // Generate lines for "My Lines" tab
    const getRepertoireLines = () => {
        const lines = [];
        const traverse = (node, pathSan) => {
            if (node.children.length === 0 && pathSan.length > 0) {
                // It's a line
                lines.push({
                    id: node.id,
                    name: formatPGN(pathSan),
                    line: pathSan.join(' '),
                    date: new Date().toISOString(),
                    rootColor: side
                });
            }
            for (const child of node.children) {
                traverse(child, [...pathSan, child.san]);
            }
        };
        traverse(repertoire[side], []);
        return lines;
    };

    return (
        <div className="full-height bg-primary">
            <RepertoireHeader
                breadcrumbs={getBreadcrumbs()}
                onSettingsClick={handleSettingsClick}
            />

            <div style={{ flex: '0 0 auto', width: '100%', maxWidth: '420px', margin: '0 auto', padding: '0.5rem' }}>
                <ChessboardWrapper
                    position={currentFen}
                    onPieceDrop={onPieceDrop}
                    orientation={boardOrientation}
                />

                {/* Controls */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                    <button className="btn btn-secondary" onClick={handleBack} disabled={history.length === 0} title="Back">
                        <ArrowLeft size={20} />
                    </button>
                    <button className="btn btn-secondary" onClick={() => setBoardOrientation(o => o === 'white' ? 'black' : 'white')} title="Flip Board">
                        <RefreshCw size={20} />
                    </button>
                    <button className="btn btn-secondary" onClick={handleForward} disabled={future.length === 0} title="Forward">
                        <ArrowRight size={20} />
                    </button>
                </div>
            </div>

            <AnalysisPanel
                fen={currentFen}
                moves={currentNode.children} // Pass children to show user moves
                currentNode={currentNode}
                activeVariationName={null} // We now rely on stats.opening.name
                currentLine={(() => {
                    const moves = [...history.slice(1), currentNode].filter(n => n.san);
                    return moves.reduce((acc, move, i) => {
                        const moveNum = Math.floor(i / 2) + 1;
                        if (i % 2 === 0) {
                            return acc + (i > 0 ? ' ' : '') + moveNum + '. ' + move.san;
                        } else {
                            return acc + ' ' + move.san;
                        }
                    }, '');
                })()}
                onMoveClick={(child) => {
                    setHistory(h => [...h, currentNode]);
                    setCurrentNode(child);
                    setFuture([]);
                }}
                onMoveSelect={handleMoveSelect}
                onGapClick={handleGapClick}
                onSaveAnnotation={handleSaveAnnotation}
                savedVariations={getRepertoireLines()}
                onLoadTree={handleLoadLine}
                onDeleteMove={handleDeleteNode}
            />
        </div>
    );
}
