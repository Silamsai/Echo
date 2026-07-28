import { useState, useEffect } from 'react';

const getInitialsColor = (seed) => {
    if (!seed) return 'var(--accent, #7b6ef6)';
    const colors = [
        '#f87171', '#fb923c', '#fbbf24', '#34d399', '#2dd4bf',
        '#38bdf8', '#60a5fa', '#818cf8', '#a78bfa', '#f472b6'
    ];
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

const getInitials = (name) => {
    if (!name) return '?';
    const clean = name.trim().replace(/[@]/g, '');
    if (!clean) return '?';
    const parts = clean.split(/[\s_-]+/);
    if (parts.length >= 2) {
        return (parts[0].slice(0, 1) + parts[1].slice(0, 1)).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
};

const Avatar = ({ src, name, sizeClass = 'w-9 h-9', borderRadiusClass = 'rounded-lg', isOnline, borderStyle = '1px solid var(--border-primary)' }) => {
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        setImgError(false);
    }, [src]);

    const initials = getInitials(name);
    const bgColor = getInitialsColor(name);

    return (
        <div className={`relative flex-shrink-0 ${sizeClass}`}>
            {!imgError && src ? (
                <img
                    src={src}
                    alt={name || 'User avatar'}
                    className={`w-full h-full ${borderRadiusClass} object-cover`}
                    style={{ border: borderStyle }}
                    onError={() => setImgError(true)}
                />
            ) : (
                <div
                    className={`w-full h-full ${borderRadiusClass} flex items-center justify-center font-bold text-white uppercase select-none`}
                    style={{
                        background: bgColor,
                        border: borderStyle,
                        fontSize: sizeClass.includes('w-7') ? '10px' : sizeClass.includes('w-12') ? '14px' : '11px',
                        fontFamily: 'monospace'
                    }}
                >
                    {initials}
                </div>
            )}
            {isOnline && (
                <span
                    className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full shadow-lg animate-pulse"
                    style={{ border: '2px solid var(--bg-surface, #0d0d12)' }}
                />
            )}
        </div>
    );
};

export default Avatar;
