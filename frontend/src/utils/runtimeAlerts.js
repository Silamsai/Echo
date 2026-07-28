const canUseAudioContext = () =>
  typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);

export const playUiChime = () => {
  if (!canUseAudioContext()) return;

  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const context = new AudioCtx();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(660, context.currentTime + 0.15);

    gainNode.gain.setValueAtTime(0.0001, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.05, context.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.18);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.2);
    oscillator.onended = () => context.close().catch(() => {});
  } catch {
    // Ignore browsers that block autoplay or audio initialization.
  }
};

export const showDesktopNotification = ({ title, body, icon, tag }) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const notification = new Notification(title, { body, icon, tag });
    notification.onclick = () => window.focus();
  } catch {
    // Ignore browsers that do not allow notifications in this context.
  }
};
