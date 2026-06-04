import './ChatIllustration.css';

/* ─── Echo Logo Mark ─── */
const EchoMark = ({ size = 56 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <defs>
      <linearGradient id="ci-logo-g" x1="20%" y1="10%" x2="80%" y2="90%">
        <stop offset="0%" stopColor="#6eb5ff" />
        <stop offset="50%" stopColor="#7b6ef6" />
        <stop offset="100%" stopColor="#5956e9" />
      </linearGradient>
    </defs>
    <path
      d="M50 12C73.2 12 92 30.8 92 54C92 77.2 73.2 96 50 96C41 96 32.6 93.2 25.8 88.3C15.6 93.3 7.5 95.5 6.7 95.6C5.9 95.7 5.1 95 5.3 94.1C5.9 91.3 8.7 81.4 12.8 73.9C8.3 67.9 5.7 60.3 5.7 54C5.7 30.8 26.8 12 50 12Z"
      fill="url(#ci-logo-g)"
    />
    <path
      d="M50 34C38.4 34 29 43.4 29 55C29 66.6 38.4 76 50 76C58.6 76 66 71 69.2 63.6L57.8 63.6C55.6 66.9 53 68 50 68C44.4 68 39.8 63.8 39 58L71 58C71 57 71 56 71 55C71 43.4 61.6 34 50 34ZM50 42C54 42 57.2 44.8 58.6 48.6L41.4 48.6C42.8 44.8 46 42 50 42Z"
      fill="#ffffff"
    />
  </svg>
);

/* ─── Floating Chat Bubble Component ─── */
const FloatingBubble = ({ style, children, sent }) => (
  <div
    style={{
      position: 'absolute',
      borderRadius: sent ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
      padding: '10px 14px',
      fontSize: '11px',
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontWeight: 500,
      lineHeight: 1.4,
      color: sent ? '#ffffff' : '#e8e6ff',
      background: sent
        ? 'linear-gradient(135deg, #7b6ef6 0%, #5956e9 100%)'
        : 'rgba(255,255,255,0.06)',
      border: sent ? 'none' : '1px solid rgba(255,255,255,0.08)',
      backdropFilter: 'blur(8px)',
      boxShadow: sent
        ? '0 8px 24px rgba(123,110,246,0.35)'
        : '0 4px 16px rgba(0,0,0,0.3)',
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {children}
  </div>
);

const ChatIllustration = () => {
  return (
    <div
      className="w-full h-full flex items-center justify-center select-none overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #0a0a0f 0%, #0d0d18 100%)',
        position: 'relative',
      }}
    >
      {/* Background ambient glows */}
      <div style={{
        position: 'absolute', width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(123,110,246,0.07) 0%, transparent 70%)',
        top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: '250px', height: '250px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(93,176,255,0.05) 0%, transparent 70%)',
        top: '30%', left: '60%', transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }} />

      {/* Floating chat bubbles in background */}
      <FloatingBubble sent style={{ top: '18%', left: '12%', opacity: 0.25, transform: 'rotate(-4deg)', animation: 'float1 6s ease-in-out infinite' }}>
        Hey! 👋
      </FloatingBubble>
      <FloatingBubble sent={false} style={{ top: '24%', right: '10%', opacity: 0.2, transform: 'rotate(3deg)', animation: 'float2 7s ease-in-out infinite' }}>
        What's up? 😊
      </FloatingBubble>
      <FloatingBubble sent style={{ bottom: '22%', left: '8%', opacity: 0.2, transform: 'rotate(-2deg)', animation: 'float3 5.5s ease-in-out infinite' }}>
        Let's chat! 💬
      </FloatingBubble>
      <FloatingBubble sent={false} style={{ bottom: '18%', right: '9%', opacity: 0.18, transform: 'rotate(2deg)', animation: 'float1 8s ease-in-out infinite 1s' }}>
        🎙️ Voice note
      </FloatingBubble>
      <FloatingBubble sent style={{ top: '58%', left: '6%', opacity: 0.15, transform: 'rotate(-3deg)', animation: 'float2 6.5s ease-in-out infinite 0.5s' }}>
        Seen ✓✓
      </FloatingBubble>

      {/* Central content */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', zIndex: 1, padding: '24px' }}>

        {/* Logo with glow ring */}
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          {/* Outer glow ring */}
          <div style={{
            position: 'absolute', inset: '-10px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(123,110,246,0.2) 0%, transparent 70%)',
            animation: 'pulse-ring 3s ease-in-out infinite',
          }} />
          {/* Logo container */}
          <div style={{
            width: '88px', height: '88px', borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(123,110,246,0.15), rgba(93,176,255,0.1))',
            border: '1.5px solid rgba(123,110,246,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 0 8px rgba(123,110,246,0.05)',
          }}>
            <EchoMark size={52} />
          </div>
        </div>

        {/* Brand name */}
        <div style={{
          fontSize: '36px', fontWeight: 900,
          background: 'linear-gradient(90deg, #7b6ef6, #6eb5ff)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          letterSpacing: '-1px',
          lineHeight: 1,
          marginBottom: '8px',
        }}>
          echo
        </div>

        {/* Tagline */}
        <p style={{
          color: '#ffffff', fontSize: '18px', fontWeight: 600,
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          letterSpacing: '-0.3px', margin: '0 0 6px',
        }}>
          Welcome back 👋
        </p>
        <p style={{
          color: 'rgba(255,255,255,0.35)', fontSize: '12px',
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          maxWidth: '260px', lineHeight: 1.6, margin: '0 0 28px',
        }}>
          Select a conversation from the sidebar or search for someone to start chatting.
        </p>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { icon: '💬', label: 'Real-time chat' },
            { icon: '🎙️', label: 'Voice notes' },
            { icon: '🖼️', label: 'Image sharing' },
            { icon: '🔒', label: 'End-to-end encrypted' },
          ].map(({ icon, label }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '99px', padding: '5px 10px',
              fontSize: '10.5px', color: 'rgba(255,255,255,0.45)',
              fontFamily: '"Plus Jakarta Sans", sans-serif',
            }}>
              <span style={{ fontSize: '11px' }}>{icon}</span>
              {label}
            </div>
          ))}
        </div>

        {/* Separator line */}
        <div style={{
          marginTop: '28px', display: 'flex', alignItems: 'center', gap: '10px', width: '220px',
        }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
          <span style={{ fontSize: '9px', color: '#3a3a4a', fontFamily: 'monospace', letterSpacing: '2px', textTransform: 'uppercase' }}>
            CONVERSATIONS THAT RESONATE
          </span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translateY(0px) rotate(-4deg); }
          50% { transform: translateY(-8px) rotate(-4deg); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0px) rotate(3deg); }
          50% { transform: translateY(-10px) rotate(3deg); }
        }
        @keyframes float3 {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50% { transform: translateY(-6px) rotate(-2deg); }
        }
        @keyframes pulse-ring {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
};

export default ChatIllustration;
