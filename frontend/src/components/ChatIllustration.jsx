import './ChatIllustration.css';

const EchoMark = ({ size = 52 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <defs>
      <linearGradient id="ci-logo-g2" x1="20%" y1="10%" x2="80%" y2="90%">
        <stop offset="0%" stopColor="#c4b5fd" />
        <stop offset="50%" stopColor="#7b6ef6" />
        <stop offset="100%" stopColor="#5956e9" />
      </linearGradient>
    </defs>
    <path d="M50 12C73.2 12 92 30.8 92 54C92 77.2 73.2 96 50 96C41 96 32.6 93.2 25.8 88.3C15.6 93.3 7.5 95.5 6.7 95.6C5.9 95.7 5.1 95 5.3 94.1C5.9 91.3 8.7 81.4 12.8 73.9C8.3 67.9 5.7 60.3 5.7 54C5.7 30.8 26.8 12 50 12Z"
      fill="url(#ci-logo-g2)" />
    <path d="M50 34C38.4 34 29 43.4 29 55C29 66.6 38.4 76 50 76C58.6 76 66 71 69.2 63.6L57.8 63.6C55.6 66.9 53 68 50 68C44.4 68 39.8 63.8 39 58L71 58C71 57 71 56 71 55C71 43.4 61.6 34 50 34ZM50 42C54 42 57.2 44.8 58.6 48.6L41.4 48.6C42.8 44.8 46 42 50 42Z"
      fill="#ffffff" />
  </svg>
);

/* Liquid bubble */
const LiquidBubble = ({ text, sent, style }) => (
  <div className={`ci-bubble ${sent ? 'ci-bubble-sent' : 'ci-bubble-recv'}`} style={style}>
    {text}
  </div>
);

/* Feature pill */
const FeaturePill = ({ icon, label, delay }) => (
  <div className="ci-pill" style={{ animationDelay: delay }}>
    <span className="ci-pill-icon">{icon}</span>
    <span>{label}</span>
  </div>
);

const ChatIllustration = ({
  modeLabel = 'Direct Messages',
  helperText = 'Select a conversation or search for someone to start chatting.',
}) => {
  const steps = modeLabel.startsWith('Workspace')
    ? ['Choose a workspace', 'Open or create a channel', 'Start collaborating']
    : ['Search for people', 'Start a direct chat', 'Create a group when needed'];

  return (
    <div className="ci-root">

      {/* Deep background glows */}
      <div className="ci-glow ci-glow-1" />
      <div className="ci-glow ci-glow-2" />
      <div className="ci-glow ci-glow-3" />

      {/* Subtle grid mesh */}
      <div className="ci-mesh" />

      <LiquidBubble sent text="Start here" style={{ top: '16%', left: '10%', animationName: 'ciBubbleFloat1', animationDuration: '7s', opacity: 0.4 }} />
      <LiquidBubble sent={false} text="Clear and calm flow" style={{ top: '22%', right: '10%', animationName: 'ciBubbleFloat2', animationDuration: '8s', opacity: 0.32 }} />
      <LiquidBubble sent text="One step at a time" style={{ bottom: '20%', left: '8%', animationName: 'ciBubbleFloat3', animationDuration: '6.5s', opacity: 0.28 }} />

      {/* Central glass card — Apple vision-style */}
      <div className="ci-center-card">

        {/* Logo ring */}
        <div className="ci-logo-wrap">
          <div className="ci-logo-ring ci-logo-ring-outer" />
          <div className="ci-logo-ring ci-logo-ring-inner" />
          <div className="ci-logo-container">
            <EchoMark size={52} />
          </div>
        </div>

        {/* Brand name */}
        <div className="ci-brand">echo</div>

        {/* Tagline */}
        <p className="ci-tagline">{modeLabel}</p>
        <p className="ci-subtitle">
          {helperText}
        </p>

        <div className="ci-steps">
          {steps.map((step, index) => (
            <div key={step} className="ci-step">
              <span className="ci-step-index">0{index + 1}</span>
              <span>{step}</span>
            </div>
          ))}
        </div>

        <div className="ci-pills">
          <FeaturePill icon="💬" label="Real-time chat" delay="0s" />
          <FeaturePill icon="🎙️" label="Voice notes" delay="0.08s" />
          <FeaturePill icon="🖼️" label="Image sharing" delay="0.16s" />
          <FeaturePill icon="🔒" label="Encrypted" delay="0.24s" />
        </div>

        {/* Separator */}
        <div className="ci-sep">
          <div className="ci-sep-line" />
          <span className="ci-sep-text">echo · conversations that resonate</span>
          <div className="ci-sep-line" />
        </div>
      </div>
    </div>
  );
};

export default ChatIllustration;
