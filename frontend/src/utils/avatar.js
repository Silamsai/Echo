/**
 * Resolve a user/group avatar URL.
 * Prefer stored photo (Google / Cloudinary); never invent letter-only tiles here.
 */
export const getUserAvatar = (user, { seed } = {}) => {
  const photo = typeof user === 'string' ? user : user?.avatar;
  if (photo && String(photo).trim()) return String(photo).trim();

  const nameSeed =
    seed ||
    (typeof user === 'object' && user
      ? user.nickname || user.username || user.email || user._id || 'user'
      : 'user');

  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(String(nameSeed))}`;
};

export const getGroupAvatar = (conversation) => {
  if (conversation?.groupAvatar) return conversation.groupAvatar;
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(conversation?.name || 'Group')}`;
};
