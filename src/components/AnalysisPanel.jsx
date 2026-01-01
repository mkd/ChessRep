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
        <div className="sheet" style={{
            flex: 1,
            marginTop: 0,
            position: 'relative',
            zIndex: 5,
            // Remove overflow:hidden/auto from here to let the parent (page) scroll
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0
        }}>
            {/* Active Line Display - Horizontal Scroll */}
            <div style={{
                flexShrink: 0,
                backgroundColor: 'var(--bg-tertiary)',
                borderBottom: '1px solid var(--border-color)',
                padding: '0.5rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                overflowX: 'auto',
                whiteSpace: 'nowrap',
                height: '3.5rem'
            }}>
                {openingName && (
                    <div className="text-secondary text-xs uppercase tracking-wider font-semibold mr-2" style={{ color: 'var(--accent-primary)', flexShrink: 0 }}>
                        {openingName}
                    </div>
                )}
                {/* Reconstruct history from currentLine string is a bit hacky, but consistent with current props. 
                     Ideally we'd map over a 'history' prop, but let's parse the string for now or use the moves logic if available.
                     actually we have 'currentLine' string. Let's make it look like pills.
                */}
                {currentLine ? (
                    currentLine.split(' ').map((token, i) => {
                        if (token.includes('.')) {
                            return <span key={i} className="text-tertiary text-xs font-mono select-none" style={{ marginRight: '0.25rem' }}>{token}</span>;
                        }
                        return (
                            <span key={i} style={{
                                padding: '0.25rem 0.5rem',
                                backgroundColor: 'var(--bg-primary)',
                                borderRadius: '0.25rem',
                                border: '1px solid var(--border-color)',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                color: 'var(--text-primary)'
                            }}>
                                {token}
                            </span>
                        );
                    })
                ) : (
                    <div className="text-tertiary text-sm italic">Start analysis...</div>
                )}
            </div>

            {/* Annotation Section */}
            <div style={{ marginBottom: '1rem', flexShrink: 0, padding: '0 1rem', marginTop: '1rem' }}>
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
                        style={{ padding: '0.5rem', minHeight: '3rem', cursor: 'text', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}
                    >
                        {currentNode.comments ? (
                            <p style={{ margin: 0, lineHeight: '1.5' }}>{currentNode.comments}</p>
                        ) : (
                            <span className="text-tertiary text-sm italic">Add annotation...</span>
                        )}
                    </div>
                )}
            </div>

            {/* Gap Warning */}
            {isGap && (
                <div style={{ padding: '0 1rem' }}>
                    <div className="card" style={{ marginBottom: '1rem', borderColor: 'var(--accent-primary)', backgroundColor: 'rgba(99, 102, 241, 0.05)' }}>
                        <div className="text-sm font-semibold text-primary" style={{ marginBottom: '0.25rem' }}>You haven't studied this line yet</div>
                        <div className="text-xs text-secondary" style={{ marginBottom: '0.75rem' }}>
                            Choose a move below to add it to your repertoire.
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '0.5rem', padding: '0 0.5rem' }}>
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
                    Saved Moves
                </button>
                <button
                    className={`btn-ghost ${activeTab === 'saved' ? 'text-primary font-semibold' : ''}`}
                    style={{ flex: 1, borderBottom: activeTab === 'saved' ? '2px solid var(--accent-primary)' : 'none', borderRadius: 0 }}
                    onClick={() => setActiveTab('saved')}
                >
                    My Repertoires
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
                                                <td style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <span className="font-bold text-base" style={{ minWidth: '3ch' }}>{move.san}</span>
                                                    {isSaved && (
                                                        <span title="In Repertoire" style={{ color: 'var(--success)', display: 'flex', background: 'rgba(34, 197, 94, 0.1)', padding: '2px', borderRadius: '4px' }}>
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', width: '60%' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                        <div style={{ display: 'flex', height: '6px', width: '100%', borderRadius: '3px', overflow: 'hidden' }}>
                                                            <div style={{ width: `${wPct}%`, backgroundColor: '#4ade80' }} /> {/* green-400 */}
                                                            <div style={{ width: `${dPct}%`, backgroundColor: '#94a3b8' }} /> {/* slate-400 */}
                                                            <div style={{ width: `${bPct}%`, backgroundColor: '#f87171' }} /> {/* red-400 */}
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                                                            <span>{wPct}%</span>
                                                            <span>{dPct}%</span>
                                                            <span>{bPct}%</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                                                    {total > 1000 ? (total / 1000).toFixed(1) + 'k' : total}
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
