import React from 'react';
import { ArrowLeft, Settings, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RepertoireHeader({ breadcrumbs = [], onSettingsClick }) {
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

            <button
                className="btn btn-secondary text-xs font-semibold"
                onClick={onSettingsClick}
                style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
                <Settings size={16} />
                <span>Switch Color</span>
            </button>
        </header>
    );
}
