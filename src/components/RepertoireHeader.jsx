import React from 'react';
import { ArrowLeft, User, ChevronRight, Settings } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

export default function RepertoireHeader({ breadcrumbs = [], onSettingsClick }) {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();

    return (
        <header style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-primary)',
            position: 'sticky',
            top: 0,
            zIndex: 10
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                <Link to="/" className="btn-ghost" style={{ padding: '0.25rem', borderRadius: '50%' }}>
                    <ArrowLeft size={20} />
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {breadcrumbs.map((crumb, index) => (
                        <React.Fragment key={index}>
                            <span className={index === breadcrumbs.length - 1 ? 'font-semibold text-primary' : 'text-secondary'}>
                                {crumb}
                            </span>
                            {index < breadcrumbs.length - 1 && (
                                <ChevronRight size={14} className="text-tertiary" style={{ margin: '0 0.25rem' }} />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-2">
                {onSettingsClick && (
                    <button
                        className="btn btn-secondary text-xs font-semibold"
                        onClick={onSettingsClick}
                        style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Settings size={16} />
                        <span className="hidden sm:inline">Switch Color</span>
                    </button>
                )}

                {user ? (
                    <button
                        className="btn btn-ghost text-error"
                        onClick={async () => {
                            await signOut();
                            navigate('/');
                        }}
                        style={{ padding: '0.5rem', borderRadius: '50%' }}
                        title="Sign Out"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    </button>
                ) : (
                    <Link
                        to="/"
                        className="btn btn-ghost text-secondary"
                        style={{ padding: '0.5rem', borderRadius: '50%' }}
                        title="Login"
                    >
                        <User size={20} />
                    </Link>
                )}
            </div>
        </header>
    );
}
