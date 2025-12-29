import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Brain, Plus } from 'lucide-react';

import { loadRepertoire } from '../utils/storage';

export default function Home() {
    const repertoire = loadRepertoire();
    const savedTrees = repertoire.savedVariations || [];

    return (
        <div className="container full-height">
            <header style={{ padding: '2rem 0', textAlign: 'center' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '700', margin: 0 }}>Chess Rep</h1>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Master your openings</p>
            </header>

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center' }}>
                <Link to="/editor" className="card-link">
                    <div className="card" style={{
                        backgroundColor: 'var(--bg-secondary)',
                        padding: '1.5rem',
                        borderRadius: 'var(--radius-lg)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        border: '1px solid var(--border-color)'
                    }}>
                        <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '0.75rem', borderRadius: '50%' }}>
                            <BookOpen color="var(--accent-primary)" size={24} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Editor</h2>
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Build and manage your repertoire</p>
                        </div>
                    </div>
                </Link>

                <Link to="/practice" className="card-link">
                    <div className="card" style={{
                        backgroundColor: 'var(--bg-secondary)',
                        padding: '1.5rem',
                        borderRadius: 'var(--radius-lg)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        border: '1px solid var(--border-color)'
                    }}>
                        <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '0.75rem', borderRadius: '50%' }}>
                            <Brain color="var(--success)" size={24} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Practice</h2>
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Test your knowledge</p>
                        </div>
                    </div>
                </Link>

                {savedTrees.length > 0 && (
                    <div style={{ marginTop: '2rem' }}>
                        <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Saved Opening Trees</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {savedTrees.map(tree => (
                                <Link
                                    key={tree.id}
                                    to="/editor"
                                    state={{ loadTreeId: tree.id }}
                                    className="card-link"
                                >
                                    <div className="card" style={{
                                        backgroundColor: 'var(--bg-secondary)',
                                        padding: '1rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border-color)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div style={{ fontWeight: 500 }}>{tree.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            {new Date(tree.date).toLocaleDateString()}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            <footer style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                Chess Repertoire App
            </footer>
        </div>
    );
}
