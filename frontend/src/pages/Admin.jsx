import { useEffect, useState } from 'react';
import { 
  Shield, Users, MessageSquare, Activity, Ban, Trash2, 
  Star, Search, ChevronLeft, ChevronRight, Upload, Image as ImageIcon 
} from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../utils/axiosInstance';
import { formatRelativeTime } from '../utils/formatTime';
import useConfigStore from '../store/configStore';
import { getUserAvatar } from '../utils/avatar';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="glass rounded-2xl p-5 flex items-center gap-4">
    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: color }}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-slate-400 text-xs">{label}</p>
      <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
    </div>
  </div>
);

const Admin = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('users');
  const [messages, setMessages] = useState([]);
  const [loadingId, setLoadingId] = useState(null);

  // Configuration management
  const { config, updateConfig, uploadLogo } = useConfigStore();
  const [logoPreview, setLogoPreview] = useState(config?.logoUrl || '');
  const [iconPreviews, setIconPreviews] = useState({
    chats: config?.sidebarIcons?.chats || '',
    search: config?.sidebarIcons?.search || '',
    requests: config?.sidebarIcons?.requests || '',
    profile: config?.sidebarIcons?.profile || '',
    settings: config?.sidebarIcons?.settings || '',
  });

  useEffect(() => {
    axiosInstance.get('/admin/stats').then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (config) {
      setLogoPreview(config.logoUrl || '');
      setIconPreviews({
        chats: config.sidebarIcons?.chats || '',
        search: config.sidebarIcons?.search || '',
        requests: config.sidebarIcons?.requests || '',
        profile: config.sidebarIcons?.profile || '',
        settings: config.sidebarIcons?.settings || '',
      });
    }
  }, [config]);

  useEffect(() => {
    if (tab !== 'users') return;
    axiosInstance.get(`/admin/users?page=${page}&limit=10&search=${search}`)
      .then(({ data }) => { setUsers(data.users); setTotal(data.total); })
      .catch(() => {});
  }, [page, search, tab]);

  useEffect(() => {
    if (tab !== 'messages') return;
    axiosInstance.get('/admin/messages').then(({ data }) => setMessages(data.messages)).catch(() => {});
  }, [tab]);

  const handleBan = async (userId, username, isBanned) => {
    setLoadingId(userId);
    try {
      await axiosInstance.put(`/admin/user/${userId}/ban`);
      setUsers((u) => u.map((x) => x._id === userId ? { ...x, isBanned: !x.isBanned } : x));
      toast.success(isBanned ? `${username} unbanned.` : `${username} banned.`);
    } catch { toast.error('Failed.'); }
    setLoadingId(null);
  };

  const handleDelete = async (userId, username) => {
    if (!confirm(`Delete ${username}? This is irreversible.`)) return;
    setLoadingId(userId);
    try {
      await axiosInstance.delete(`/admin/user/${userId}`);
      setUsers((u) => u.filter((x) => x._id !== userId));
      setTotal((t) => t - 1);
      toast.success(`${username} deleted.`);
    } catch { toast.error('Failed.'); }
    setLoadingId(null);
  };

  const handleMakeAdmin = async (userId, username) => {
    setLoadingId(userId);
    try {
      await axiosInstance.put(`/admin/user/${userId}/make-admin`);
      setUsers((u) => u.map((x) => x._id === userId ? { ...x, isAdmin: true } : x));
      toast.success(`${username} is now admin.`);
    } catch { toast.error('Failed.'); }
    setLoadingId(null);
  };

  const handleDeleteMessage = async (msgId) => {
    try {
      await axiosInstance.delete(`/admin/message/${msgId}`);
      setMessages((m) => m.filter((x) => x._id !== msgId));
      toast.success('Message deleted.');
    } catch { toast.error('Failed.'); }
  };

  const handleToggleFeature = async (featureKey) => {
    if (!config) return;
    const updatedFeatures = {
      ...config.features,
      [featureKey]: !config.features[featureKey]
    };
    const res = await updateConfig({ features: updatedFeatures });
    if (res.success) {
      toast.success('Feature toggled successfully! ✅');
    } else {
      toast.error(res.message);
    }
  };

  const handleLogoUpload = async (e, iconKey = 'logo') => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('File must be under 5MB.');

    const uploadToast = toast.loading('Uploading branding asset...');
    const res = await uploadLogo(file);
    toast.dismiss(uploadToast);

    if (res.success) {
      if (iconKey === 'logo') {
        const updateRes = await updateConfig({ logoUrl: res.url });
        if (updateRes.success) {
          setLogoPreview(res.url);
          toast.success('App logo updated! ✅');
        } else {
          toast.error(updateRes.message);
        }
      } else {
        const updatedIcons = {
          ...config.sidebarIcons,
          [iconKey]: res.url
        };
        const updateRes = await updateConfig({ sidebarIcons: updatedIcons });
        if (updateRes.success) {
          setIconPreviews(prev => ({ ...prev, [iconKey]: res.url }));
          toast.success(`Sidebar ${iconKey} icon updated! ✅`);
        } else {
          toast.error(updateRes.message);
        }
      }
    } else {
      toast.error(res.message);
    }
  };

  const getAvatar = (u) => getUserAvatar(u);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}>
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
            <p className="text-slate-400 text-sm">Manage ECHO Settings, Features & Users</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard icon={Users} label="Total Users" value={stats?.totalUsers} color="linear-gradient(135deg,#6366f1,#a855f7)" />
          <StatCard icon={MessageSquare} label="Messages" value={stats?.totalMessages} color="linear-gradient(135deg,#06b6d4,#3b82f6)" />
          <StatCard icon={Activity} label="Online Now" value={stats?.onlineNow} color="linear-gradient(135deg,#22c55e,#16a34a)" />
          <StatCard icon={MessageSquare} label="Conversations" value={stats?.totalConversations} color="linear-gradient(135deg,#f59e0b,#f97316)" />
          <StatCard icon={Activity} label="Pending Requests" value={stats?.pendingRequests} color="linear-gradient(135deg,#ec4899,#ef4444)" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['users', 'messages', 'system'].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all capitalize cursor-pointer ${tab === t ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/40' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
              {t === 'system' ? 'System Config' : t}
            </button>
          ))}
        </div>

        {/* Users tab */}
        {tab === 'users' && (
          <>
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input type="text" className="input-field pl-9 text-sm py-2" placeholder="Search users..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
              </div>
            </div>
            <div className="space-y-2">
              {users.map((u) => (
                <div key={u._id} className="glass rounded-xl px-4 py-3 flex items-center gap-3">
                  <img src={getAvatar(u)} alt="" className="w-9 h-9 rounded-full object-cover" referrerPolicy="no-referrer" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-white">@{u.username}</span>
                      {u.isAdmin && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(234,179,8,0.15)', color: '#fbbf24' }}>Admin</span>}
                      {u.isBanned && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>Banned</span>}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{u.email} · {formatRelativeTime(u.createdAt)}</p>
                  </div>
                  <div className="flex gap-2">
                    {!u.isAdmin && (
                      <button onClick={() => handleMakeAdmin(u._id, u.username)} disabled={loadingId === u._id}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-yellow-500 hover:bg-yellow-500/10 transition-all cursor-pointer" title="Make Admin">
                        <Star size={14} />
                      </button>
                    )}
                    <button onClick={() => handleBan(u._id, u.username, u.isBanned)} disabled={loadingId === u._id || u.isAdmin}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${u.isBanned ? 'text-green-400 hover:bg-green-500/10' : 'text-orange-400 hover:bg-orange-500/10'}`} title={u.isBanned ? 'Unban' : 'Ban'}>
                      <Ban size={14} />
                    </button>
                    <button onClick={() => handleDelete(u._id, u.username)} disabled={loadingId === u._id || u.isAdmin}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-all cursor-pointer" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <span className="text-slate-500 text-sm">{total} total users</span>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost px-3 py-1.5 text-sm flex items-center gap-1">
                  <ChevronLeft size={14} /> Prev
                </button>
                <button onClick={() => setPage((p) => p + 1)} disabled={page * 10 >= total} className="btn-ghost px-3 py-1.5 text-sm flex items-center gap-1">
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Messages tab */}
        {tab === 'messages' && (
          <div className="space-y-2">
            {messages.map((m) => (
              <div key={m._id} className="glass rounded-xl px-4 py-3 flex items-start gap-3">
                <img src={getAvatar(m.sender)} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5" referrerPolicy="no-referrer" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-white">@{m.sender?.username}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>{m.type}</span>
                    <span className="text-xs text-slate-500">{formatRelativeTime(m.createdAt)}</span>
                  </div>
                  {m.type === 'text' && <p className="text-sm text-slate-400 truncate">{m.content}</p>}
                  {m.type === 'image' && <span className="text-xs text-slate-500">📷 Image</span>}
                  {m.type === 'voice' && <span className="text-xs text-slate-500">🎙️ Voice note</span>}
                </div>
                <button onClick={() => handleDeleteMessage(m._id)} className="text-red-400 hover:bg-red-500/10 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* System Configuration Tab */}
        {tab === 'system' && (
          <div className="space-y-6">
            
            {/* Feature Toggles */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-base font-bold text-white mb-4">Toggle App Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'voiceCalls', label: 'Voice Calling', desc: 'Allows users to hold WebRTC audio calls.' },
                  { key: 'videoCalls', label: 'Video Calling', desc: 'Allows users to hold WebRTC video calls.' },
                  { key: 'imageSharing', label: 'Image Sharing', desc: 'Allows attachment of images in messages.' },
                  { key: 'voiceNotes', label: 'Voice Notes', desc: 'Allows recording and sending audio clips.' },
                  { key: 'otpVerification', label: 'Email OTP Verification', desc: 'Enforces 6-digit OTP codes for new registrations.' },
                ].map((feat) => {
                  const isActive = config?.features?.[feat.key] !== false;
                  return (
                    <div key={feat.key} className="flex items-center justify-between p-4 bg-[#14141c]/50 rounded-xl border border-white/5">
                      <div>
                        <p className="text-sm font-bold text-slate-200">{feat.label}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{feat.desc}</p>
                      </div>
                      <button
                        onClick={() => handleToggleFeature(feat.key)}
                        className={`w-12 h-6 rounded-full p-1 transition-all duration-200 cursor-pointer flex items-center ${
                          isActive ? 'bg-[#7b6ef6] justify-end' : 'bg-slate-700 justify-start'
                        }`}
                      >
                        <span className="w-4 h-4 bg-white rounded-full shadow-md" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Branding Logs Upload */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-base font-bold text-white mb-1">Custom Workspace Branding</h2>
              <p className="text-slate-500 text-xs mb-5">Upload customized images or logos to personalize your workspace (max 5MB).</p>
              
              <div className="space-y-5">
                {/* Main App Logo */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#14141c]/50 rounded-xl border border-white/5 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                      {logoPreview ? (
                        <img src={logoPreview} alt="App Logo" className="w-full h-full object-contain" />
                      ) : (
                        <ImageIcon size={24} className="text-slate-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-200">Main Application Logo</p>
                      <p className="text-[10px] text-slate-500">Replaces the default gradient Echo wordmark on navbar.</p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 px-4 py-2 bg-[#7b6ef6] hover:bg-[#6057e8] active:scale-[0.98] text-white text-xs font-semibold rounded-xl cursor-pointer transition-all">
                    <Upload size={14} /> Upload Image
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e, 'logo')} />
                  </label>
                </div>

                {/* Sidebar Icons Customization */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: 'chats', label: 'Chats Tab Icon', desc: 'Custom icon for active chat thread.' },
                    { key: 'search', label: 'Search Tab Icon', desc: 'Custom icon for workspace searching.' },
                    { key: 'requests', label: 'Requests Tab Icon', desc: 'Custom icon for friend notifications.' },
                    { key: 'profile', label: 'Profile Tab Icon', desc: 'Custom icon for user profile settings.' },
                    { key: 'settings', label: 'Settings Tab Icon', desc: 'Custom icon for global system preferences.' },
                  ].map((icon) => (
                    <div key={icon.key} className="flex items-center justify-between p-3.5 bg-[#14141c]/50 rounded-xl border border-white/5 gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                          {iconPreviews[icon.key] ? (
                            <img src={iconPreviews[icon.key]} alt="" className="w-full h-full object-contain" />
                          ) : (
                            <ImageIcon size={18} className="text-slate-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-200">{icon.label}</p>
                          <p className="text-[9px] text-slate-500 leading-normal">{icon.desc}</p>
                        </div>
                      </div>
                      <label className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 active:scale-95 cursor-pointer transition-all flex-shrink-0">
                        <Upload size={13} />
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e, icon.key)} />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
