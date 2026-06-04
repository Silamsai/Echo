import { useState, useRef } from 'react';
import { Camera, Save, User, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../utils/axiosInstance';
import useAuthStore from '../store/authStore';

const Profile = () => {
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState({ username: user?.username || '', bio: user?.bio || '', nickname: user?.nickname || '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [isLoading, setIsLoading] = useState(false);
  const fileRef = useRef();

  const getAvatar = () =>
    avatarPreview || user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`;

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be under 5MB.');
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      if (form.username !== user?.username) formData.append('username', form.username);
      if (form.bio !== user?.bio) formData.append('bio', form.bio);
      if (form.nickname !== user?.nickname) formData.append('nickname', form.nickname);
      if (avatarFile) formData.append('avatar', avatarFile);

      const { data } = await axiosInstance.put('/user/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser(data);
      setAvatarFile(null);
      toast.success('Profile updated! ✅');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-white mb-8">Your Profile</h1>

        <div className="glass rounded-2xl p-8">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              <img
                src={getAvatar()}
                alt="avatar"
                className="w-28 h-28 rounded-full object-cover border-4 border-indigo-500/30"
              />
              <button
                id="change-avatar-btn"
                onClick={() => fileRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <Camera size={24} className="text-white" />
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            <button
              onClick={() => fileRef.current?.click()}
              className="mt-3 text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <Edit3 size={14} /> Change photo
            </button>
            {avatarFile && (
              <span className="text-xs text-green-400 mt-1">New photo selected ✓</span>
            )}
          </div>

          {/* Form */}
          <div className="space-y-5">
            <div>
              <label className="text-sm text-slate-400 mb-2 flex items-center gap-2">
                <User size={14} /> Username
              </label>
              <input
                id="profile-username"
                type="text"
                className="input-field"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="yourname"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-2 flex items-center gap-2">
                <User size={14} /> Nickname
              </label>
              <input
                id="profile-nickname"
                type="text"
                className="input-field"
                value={form.nickname || ''}
                onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                placeholder="Enter nickname"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-2 block">Email</label>
              <input
                type="email"
                className="input-field opacity-50 cursor-not-allowed"
                value={user?.email || ''}
                disabled
              />
              <p className="text-xs text-slate-600 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-2 block">Bio</label>
              <textarea
                id="profile-bio"
                className="input-field resize-none"
                rows={3}
                placeholder="Tell people about yourself..."
                maxLength={160}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
              <p className="text-xs text-slate-600 mt-1 text-right">{form.bio.length}/160</p>
            </div>

            <div className="pt-2">
              <div className="text-xs text-slate-500 mb-1">Account type</div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}>
                  {user?.provider === 'google' ? '🔵 Google Account' : '📧 Local Account'}
                </span>
                {user?.isAdmin && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{ background: 'rgba(234,179,8,0.15)', color: '#fbbf24', border: '1px solid rgba(234,179,8,0.3)' }}>
                    ⭐ Admin
                  </span>
                )}
              </div>
            </div>

            <button
              id="profile-save-btn"
              onClick={handleSave}
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Save size={16} />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
