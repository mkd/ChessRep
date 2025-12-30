import React, { useState, useEffect } from 'react';
import { ExternalLink, Database, MessageSquare } from 'lucide-react';
import { fetchMasters, openLichessAnalysis } from '../utils/lichess';

export default function AnalysisPanel({
    fen,
    moves,
    currentNode,
    onMoveClick,
    currentPath = [],
    onGapClick,
    onSaveAnnotation,
    onMoveSelect,
    activeVariationName,
    currentLine,
    savedVariations = [],
    onLoadTree,
    onDeleteMove
}) {
    const [activeTab, setActiveTab] = useState('masters'); // masters, eval, saved
    const [stats, setStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(false);
    const [isEditingAnnotation, setIsEditingAnnotation] = useState(false);
    const [annotationText, setAnnotationText] = useState(currentNode.comments || '');

    useEffect(() => {
        setAnnotationText(currentNode.comments || '');
        setIsEditingAnnotation(false);
    }, [currentNode]);

    useEffect(() => {
        if (activeTab === 'masters') {
            setLoadingStats(true);
            fetchMasters(fen).then(data => {
                setStats(data);
                setLoadingStats(false);
            });
        }
    }, [fen, activeTab]);

    const handleSaveAnnotation = () => {
        onSaveAnnotation(annotationText);
        setIsEditingAnnotation(false);
    };

    const isGap = currentNode.children.length === 0;
    const openingName = stats?.opening?.name || activeVariationName;

    return (
        <div className="sheet" style={{ flex: 1, marginTop: '-1rem', position: 'relative', zIndex: 5, overflow: 'hidden' }}>
            {/* Active Line Display */}
            <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
                {openingName && (
                    <div className="text-secondary text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--accent-primary)' }}>
                        {openingName}
                    </div>
                )}
                {currentLine && (
                    <div className="font-mono text-sm" style={{ whiteSpace: 'nowrap', overflowX: 'auto', paddingBottom: '2px' }}>
                        {currentLine}
                    </div>
                )}
                {!currentLine && !openingName && <div className="text-tertiary text-sm italic">Start analysis...</div>}
            </div>

            {/* Annotation Section */}
            <div style={{ marginBottom: '1rem', flexShrink: 0 }}>
                {isEditingAnnotation ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <textarea
                            className="input"
                            rows={3}
                            value={annotationText}
                            onChange={e => setAnnotationText(e.target.value)}
                            placeholder="Add your thoughts..."
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => setIsEditingAnnotation(false)}>Cancel</button>
                            <button className="btn btn-primary btn-sm" onClick={handleSaveAnnotation}>Save</button>
                        </div>
                    </div>
                ) : (
                    <div
                        onClick={() => setIsEditingAnnotation(true)}
                        style={{ padding: '0.5rem', minHeight: '3rem', cursor: 'text' }}
                    >
                        {currentNode.comments ? (
                            <p style={{ margin: 0, lineHeight: '1.5' }}>{currentNode.comments}</p>
                        ) : (
                            <span className="text-tertiary text-sm italic">Add annotation...</span>
                        )}
                    </div>
                )}
            </div>

            {/* Gap Warning (Only if no children and mostly likely a gap) */}
            {isGap && (
                <div className="card" style={{ marginBottom: '1rem', borderColor: 'var(--accent-primary)', backgroundColor: 'rgba(99, 102, 241, 0.05)' }}>
                    <div className="text-sm font-semibold text-primary" style={{ marginBottom: '0.25rem' }}>Your Move</div>
                    <div className="text-xs text-secondary" style={{ marginBottom: '0.75rem' }}>
                        Choose a move from the Masters list below to add it to your repertoire automatically.
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
                <button
                    className={`btn-ghost ${activeTab === 'masters' ? 'text-primary font-semibold' : ''}`}
                    style={{ flex: 1, borderBottom: activeTab === 'masters' ? '2px solid var(--accent-primary)' : 'none', borderRadius: 0 }}
                    onClick={() => setActiveTab('masters')}
                >
                    Masters
                </button>
                <button
                    className={`btn-ghost ${activeTab === 'eval' ? 'text-primary font-semibold' : ''}`}
                    style={{ flex: 1, borderBottom: activeTab === 'eval' ? '2px solid var(--accent-primary)' : 'none', borderRadius: 0 }}
                    onClick={() => setActiveTab('eval')}
                >
                    User Moves
                </button>
                <button
                    className={`btn-ghost ${activeTab === 'saved' ? 'text-primary font-semibold' : ''}`}
                    style={{ flex: 1, borderBottom: activeTab === 'saved' ? '2px solid var(--accent-primary)' : 'none', borderRadius: 0 }}
                    onClick={() => setActiveTab('saved')}
                >
                    My Lines
                </button>
            </div>

            {/* Content List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {activeTab === 'masters' && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {loadingStats ? (
                            <div className="text-secondary text-center p-4">Loading stats...</div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                <thead>
                                    <tr className="text-secondary text-xs" style={{ textAlign: 'left' }}>
                                        <th style={{ padding: '0.5rem', fontWeight: 500 }}>Move</th>
                                        <th style={{ padding: '0.5rem', fontWeight: 500, textAlign: 'right' }}>Games</th>
                                        <th style={{ padding: '0.5rem', fontWeight: 500, width: '140px' }}>Win / Draw / Loss</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(stats?.moves || []).slice(0, 10).map((move, i) => {
                                        const total = move.white + move.black + move.draws;
                                        const wPct = Math.round((move.white / total) * 100);
                                        const dPct = Math.round((move.draws / total) * 100);
                                        const bPct = Math.round((move.black / total) * 100);
                                        const isSaved = currentNode.children.some(c => c.san === move.san);

                                        return (
                                            <tr
                                                key={i}
                                                style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                                                onClick={() => {
                                                    if (isSaved) {
                                                        const child = currentNode.children.find(c => c.san === move.san);
                                                        onMoveClick(child);
                                                    } else {
                                                        onMoveSelect(move.san);
                                                    }
                                                }}
                                                className="hover:bg-tertiary"
                                            >
                                                <td style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span className="font-semibold">{move.san}</span>
                                                    {isSaved && (
                                                        <span title="In Repertoire" style={{ color: 'var(--success)', display: 'flex' }}>
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--text-secondary)' }}>
                                                    {total}
                                                </td>
                                                <td style={{ padding: '0.5rem' }}>
                                                    <div style={{ display: 'flex', height: '6px', width: '100%', borderRadius: '3px', overflow: 'hidden', marginBottom: '4px' }}>
                                                        <div style={{ width: `${wPct}%`, backgroundColor: '#e5e5e5' }} />
                                                        <div style={{ width: `${dPct}%`, backgroundColor: '#525252' }} />
                                                        <div style={{ width: `${bPct}%`, backgroundColor: '#171717' }} />
                                                    </div>
                                                    <div style={{ fontSize: '0.7em', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                                                        <span>{wPct}%</span>
                                                        <span>{dPct}%</span>
                                                        <span>{bPct}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {activeTab === 'eval' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.5rem 0' }}>
                        {currentNode.children.length === 0 && <div className="text-secondary text-center text-sm">No moves saved yet.</div>}
                        {currentNode.children.map(child => (
                            <div key={child.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <button
                                    className="btn btn-secondary"
                                    style={{ flex: 1, justifyContent: 'space-between' }}
                                    onClick={() => onMoveClick(child)}
                                >
                                    <span className="font-semibold">{child.san}</span>
                                    <span className="text-xs text-secondary">{child.children.length} replies</span>
                                </button>
                                <button
                                    className="btn btn-ghost text-error"
                                    style={{ padding: '0.5rem' }}
                                    onClick={() => {
                                        onDeleteMove(child.id);
                                    }}
                                    title="Delete Move"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'saved' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.5rem 0' }}>
                        {savedVariations.length === 0 && <div className="text-secondary text-center text-sm">No repertoire lines found.</div>}
                        {savedVariations.map((tree, idx) => (
                            <div key={tree.id || idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <button
                                    className="btn btn-secondary"
                                    style={{ flex: 1, justifyContent: 'space-between', borderLeft: '4px solid var(--accent-primary)' }}
                                    onClick={() => onLoadTree(tree.id)}
                                >
                                    <div style={{ textAlign: 'left', width: '100%' }}>
                                        <div className="font-semibold truncate">{tree.name}</div>
                                        {/* <div className="text-xs text-secondary truncate">{tree.line}</div> */}
                                    </div>
                                </button>
                                <button
                                    className="btn btn-ghost text-error"
                                    style={{ padding: '0.5rem' }}
                                    onClick={() => {
                                        if (confirm(`Delete line?`)) { // Optional confirm, or fast delete
                                            onDeleteMove(tree.id);
                                        }
                                    }}
                                    title="Delete Line"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary flex-1" onClick={onGapClick}>
                    Next Gap
                </button>
                <button className="btn btn-ghost flex-1" onClick={() => openLichessAnalysis(fen)}>
                    Analyze on Lichess
                </button>
            </div>
        </div>
    );
}
