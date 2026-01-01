import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Brain, Plus, User, LogOut, Settings } from 'lucide-react';

import { loadRepertoire } from '../utils/storage';

import { useAuth } from '../components/AuthProvider';
import AuthForm from '../components/AuthForm';
import ProfileModal from '../components/ProfileModal';

export default function Home() {
    const { user, loading, signOut } = useAuth();
    // const user = { email: 'tester@chessrep.com', user_metadata: { full_name: 'Tester' } }; const loading = false; // MOCK FOR TESTING
    const repertoire = loadRepertoire();
    const savedTrees = repertoire.savedVariations || [];

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    if (loading) {
        return <div className="full-height flex-center">Loading...</div>;
    }

    if (!user) {
        // if (false) { // FORCE SHOW DASHBOARD FOR TESTING
        return (
            <div className="container full-height" style={{ justifyContent: 'center', maxWidth: '600px' }}>
                <header style={{ padding: '2rem 0', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '700', margin: 0, color: 'var(--accent-primary)' }}>Chess Rep</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '1.1rem' }}>
                        Build your opening repertoire.<br />Practice smarter.
                    </p>
                </header>
                <AuthForm />

                {/* Fallback for local testing if Supabase is down */}
                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <p className="text-secondary text-xs">
                        Warning: Cloud sync requires an account.
                    </p>
                </div>
            </div>
        );
    }

    const displayName = user.user_metadata?.full_name || user.email?.split('@')[0];

    return (
        <div className="container full-height" onClick={() => isMenuOpen && setIsMenuOpen(false)}>
            <header style={{
                padding: '1.5rem 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'relative' // For dropdown positioning in a simple layout
            }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>Chess Rep</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Welcome back, {displayName}!</p>
                </div>

                <div style={{ position: 'relative' }}>
                    <div
                        onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                        style={{
                            width: '40px', height: '40px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-color)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'var(--accent-primary)'
                        }}
                    >
                        {user.user_metadata?.full_name ? user.user_metadata.full_name[0].toUpperCase() : <User size={20} />}
                    </div>

                    {isMenuOpen && (
                        <div className="card" style={{
                            position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem',
                            padding: '0.5rem', minWidth: '160px', zIndex: 50,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                        }}>
                            <button
                                onClick={() => { setIsProfileOpen(true); setIsMenuOpen(false); }}
                                className="btn-ghost"
                                style={{ width: '100%', justifyContent: 'flex-start', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                            >
                                <Settings size={16} /> Edit Profile
                            </button>
                            <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '0.25rem 0' }} />
                            <button
                                onClick={signOut}
                                className="btn-ghost"
                                style={{ width: '100%', justifyContent: 'flex-start', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--error)' }}
                            >
                                <LogOut size={16} /> Logout
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem' }}>
                {/* Daily Dashboard Section */}
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 className="text-lg font-bold text-primary">Daily Progress</h2>
                        <div
                            title="Your Daily Streak! Practice every day to keep the flame burning."
                            onClick={() => alert("Keep your streak alive by practicing at least 10 moves daily!")}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(245, 158, 11, 0.1)', padding: '0.25rem 0.75rem', borderRadius: '2rem', cursor: 'pointer' }}
                        >
                            <span style={{ fontSize: '1.25rem' }}>🔥</span>
                            <span className="font-bold" style={{ color: 'var(--warning)' }}>3</span>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Link to="/practice" className="card-link">
                            <div className="card" style={{
                                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.05) 100%)',
                                border: '1px solid rgba(34, 197, 94, 0.3)',
                                padding: '1.25rem',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                minHeight: '140px'
                            }}>
                                <div>
                                    <div style={{ background: 'rgba(34, 197, 94, 0.2)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                                        <Brain color="var(--success)" size={18} />
                                    </div>
                                    <div className="text-sm font-semibold text-secondary">Moves Due</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '2rem', fontWeight: '800', lineHeight: 1, color: '#fff' }}>12</div>
                                    <div className="text-xs text-secondary mt-1">Review now</div>
                                </div>
                            </div>
                        </Link>

                        <Link to="/editor" className="card-link">
                            <div className="card" style={{
                                background: 'var(--bg-secondary)',
                                padding: '1.25rem',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                minHeight: '140px'
                            }}>
                                <div>
                                    <div style={{ background: 'rgba(129, 140, 248, 0.1)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                                        <BookOpen color="var(--accent-primary)" size={18} />
                                    </div>
                                    <div className="text-sm font-semibold text-secondary">New Moves</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '2rem', fontWeight: '800', lineHeight: 1, color: 'var(--text-primary)' }}>+5</div>
                                    <div className="text-xs text-secondary mt-1">Added today</div>
                                </div>
                            </div>
                        </Link>
                    </div>
                </section>

                {/* Quick Actions / Navigation */}
                <section>
                    <h2 className="text-sm font-semibold text-secondary uppercase tracking-wider mb-3">Menu</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <Link to="/editor" className="card-link">
                            <div className="card" style={{
                                padding: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                transition: 'transform 0.2s',
                                cursor: 'pointer'
                            }}>
                                <div style={{ background: 'var(--bg-tertiary)', padding: '0.6rem', borderRadius: '0.5rem' }}>
                                    <BookOpen size={20} color="var(--accent-primary)" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div className="font-semibold text-base">Opening Explorer</div>
                                    <div className="text-xs text-secondary">Manage your repertoire</div>
                                </div>
                                <div style={{ color: 'var(--text-tertiary)' }}>→</div>
                            </div>
                        </Link>

                        <Link to="/practice" className="card-link">
                            <div className="card" style={{
                                padding: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                transition: 'transform 0.2s',
                                cursor: 'pointer'
                            }}>
                                <div style={{ background: 'var(--bg-tertiary)', padding: '0.6rem', borderRadius: '0.5rem' }}>
                                    <Brain size={20} color="var(--success)" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div className="font-semibold text-base">Practice Mode</div>
                                    <div className="text-xs text-secondary">Freeplay training</div>
                                </div>
                                <div style={{ color: 'var(--text-tertiary)' }}>→</div>
                            </div>
                        </Link>
                    </div>
                </section>


                {savedTrees.length > 0 && (
                    <section>
                        <h3 className="text-sm font-semibold text-secondary uppercase tracking-wider mb-3">Saved Trees</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
                            {savedTrees.map(tree => (
                                <Link
                                    key={tree.id}
                                    to="/editor"
                                    state={{ loadTreeId: tree.id }}
                                    className="card-link"
                                >
                                    <div className="card" style={{
                                        padding: '1rem',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        textAlign: 'center'
                                    }}>
                                        <div className="font-medium text-sm truncate" style={{ width: '100%' }}>{tree.name}</div>
                                        <div className="text-xs text-tertiary">
                                            {new Date(tree.date).toLocaleDateString()}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </main>

            <footer style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                Chess Repertoire App
            </footer>

            <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
        </div>
    );
}
