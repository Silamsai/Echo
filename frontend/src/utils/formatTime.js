import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

export const formatMessageTime = (date) => {
  const d = new Date(date);
  return format(d, 'HH:mm');
};

export const formatLastSeen = (date) => {
  if (!date) return 'Long time ago';
  const d = new Date(date);
  if (isToday(d)) return `Today at ${format(d, 'HH:mm')}`;
  if (isYesterday(d)) return `Yesterday at ${format(d, 'HH:mm')}`;
  return format(d, 'dd MMM yyyy, HH:mm');
};

export const formatConversationTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'dd/MM/yy');
};

export const formatRelativeTime = (date) => {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};
