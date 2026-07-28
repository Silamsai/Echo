export const preferenceKeys = {
  sound: 'setting_sound',
  desktopNotifications: 'setting_desktop_notif',
  showTyping: 'setting_show_typing',
};

export const getBooleanPreference = (key, fallback = true) => {
  const value = localStorage.getItem(key);
  if (value === null) return fallback;
  return value === 'true';
};

export const setBooleanPreference = (key, value) => {
  localStorage.setItem(key, String(value));
};

export const isSoundEnabled = () => getBooleanPreference(preferenceKeys.sound, true);
export const isDesktopNotificationsEnabled = () =>
  getBooleanPreference(preferenceKeys.desktopNotifications, true);
export const isTypingIndicatorsEnabled = () =>
  getBooleanPreference(preferenceKeys.showTyping, true);

export const requestDesktopNotificationPermission = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { granted: false, supported: false, permission: 'unsupported' };
  }

  if (Notification.permission === 'granted') {
    return { granted: true, supported: true, permission: Notification.permission };
  }

  if (Notification.permission === 'denied') {
    return { granted: false, supported: true, permission: Notification.permission };
  }

  const permission = await Notification.requestPermission();
  return { granted: permission === 'granted', supported: true, permission };
};
