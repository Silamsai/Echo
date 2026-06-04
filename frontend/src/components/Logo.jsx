const Logo = ({ layout = 'horizontal', className = '' }) => {
  return (
    <div className={`flex items-center ${layout === 'vertical' ? 'flex-col text-center' : 'flex-row gap-3'} ${className}`}>
      {/* SVG Icon matching the official Echo gradient circular logo */}
      <svg
        viewBox="0 0 100 100"
        className={layout === 'vertical' ? 'w-24 h-24 mb-4' : 'w-10 h-10'}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="echo-logo-gradient" x1="15%" y1="15%" x2="85%" y2="85%">
            <stop offset="0%" stopColor="#8b5cf6" /> {/* Violet/Purple */}
            <stop offset="50%" stopColor="#6366f1" /> {/* Indigo */}
            <stop offset="100%" stopColor="#3b82f6" /> {/* Blue */}
          </linearGradient>
        </defs>

        {/* Speech Bubble Base Shape */}
        <path
          d="M 50 15 
             C 72.09 15, 90 32.91, 90 55 
             C 90 77.09, 72.09 95, 50 95 
             C 41.5 95, 33.6 92.35, 27.1 87.8 
             C 17.5 92.5, 9.8 94.6, 9 94.7 
             C 8.2 94.8, 7.5 94.1, 7.7 93.3 
             C 8.3 90.7, 10.9 81.3, 14.8 74.2 
             C 10.5 68.6, 8 61.8, 8 55 
             C 8 32.91, 25.91 15, 50 15 Z"
          fill="url(#echo-logo-gradient)"
        />

        {/* Cutout to form the letter 'e' */}
        <path
          d="M 50 35 
             C 39 35, 30 44, 30 55 
             C 30 66, 39 75, 50 75 
             C 58 75, 65 70, 68 62
             L 57 62
             C 55 65, 53 66, 50 66
             C 45 66, 41 62, 40 57
             L 70 57
             C 70 56, 70 55, 70 54
             C 70 43, 61 35, 50 35 Z
             M 50 44
             C 53.5 44, 56.5 46.5, 58 50
             L 41 50
             C 42.5 46.5, 45.5 44, 50 44 Z"
          fill="#ffffff"
        />

        {/* 3 Dots inside the top loop of 'e' */}
        <circle cx="43" cy="47" r="2.5" fill="#1e1b4b" />
        <circle cx="50" cy="47" r="2.5" fill="#1e1b4b" />
        <circle cx="57" cy="47" r="2.5" fill="#1e1b4b" />
      </svg>

      {/* Typography */}
      <div className={layout === 'vertical' ? 'mt-2' : 'flex flex-col'}>
        <span className={`font-black tracking-tight text-[var(--logo-text)] font-sans ${layout === 'vertical' ? 'text-4xl' : 'text-2xl leading-none'}`}>
          echo
        </span>
        <span className={`text-[#3b82f6] font-bold tracking-widest uppercase font-sans ${layout === 'vertical' ? 'text-xs mt-2' : 'text-[9px] mt-0.5'}`}>
          {layout === 'vertical' ? 'Chat. Connect. Repeat.' : 'Conversations That Resonate'}
        </span>
      </div>
    </div>
  );
};

export default Logo;
