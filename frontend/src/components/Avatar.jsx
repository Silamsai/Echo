import { useState, useEffect } from 'react';
import { getUserAvatar } from '../utils/avatar';

const Avatar = ({
  src,
  name,
  sizeClass = 'w-9 h-9',
  borderRadiusClass = 'rounded-lg',
  isOnline,
  borderStyle = '1px solid var(--border-primary)',
  onClick,
}) => {
  const [failedSrc, setFailedSrc] = useState(null);

  const primary = src && String(src).trim() ? String(src).trim() : '';
  const fallback = getUserAvatar(null, { seed: name || 'user' });
  const activeSrc = primary && failedSrc !== primary ? primary : fallback;

  useEffect(() => {
    setFailedSrc(null);
  }, [src, name]);

  return (
    <div
      className={`relative flex-shrink-0 ${sizeClass} ${onClick ? 'cursor-pointer hover:scale-105 active:scale-95 transition-all' : ''}`}
      onClick={onClick}
    >
      <img
        src={activeSrc}
        alt={name || 'User avatar'}
        className={`w-full h-full ${borderRadiusClass} object-cover`}
        style={{ border: borderStyle, background: 'var(--bg-panel, #14141c)' }}
        referrerPolicy="no-referrer"
        onError={() => {
          if (primary && failedSrc !== primary) {
            setFailedSrc(primary);
          }
        }}
      />
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
