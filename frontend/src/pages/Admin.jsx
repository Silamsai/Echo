import { useEffect, useState } from 'react';
import { Shield, Users, MessageSquare, Activity, Ban, Trash2, Star, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../utils/axiosInstance';
import { formatRelativeTime } from '../utils/formatTime';

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

  useEffect(() => {
    axiosInstance.get('/admin/stats').then(({ data }) => setStats(data)).catch(() => {});
  }, []);

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

  const getAvatar = (u) => u?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u?.username}`;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}>
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
            <p className="text-slate-400 text-sm">Manage ECHO</p>
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
          {['users', 'messages'].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all capitalize ${tab === t ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/40' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
              {t}
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
                  <img src={getAvatar(u)} alt="" className="w-9 h-9 rounded-full object-cover" />
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
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-yellow-500 hover:bg-yellow-500/10 transition-all" title="Make Admin">
                        <Star size={14} />
                      </button>
                    )}
                    <button onClick={() => handleBan(u._id, u.username, u.isBanned)} disabled={loadingId === u._id || u.isAdmin}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${u.isBanned ? 'text-green-400 hover:bg-green-500/10' : 'text-orange-400 hover:bg-orange-500/10'}`} title={u.isBanned ? 'Unban' : 'Ban'}>
                      <Ban size={14} />
                    </button>
                    <button onClick={() => handleDelete(u._id, u.username)} disabled={loadingId === u._id || u.isAdmin}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-all" title="Delete">
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
                <img src={getAvatar(m.sender)} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5" />
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
                <button onClick={() => handleDeleteMessage(m._id)} className="text-red-400 hover:bg-red-500/10 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
