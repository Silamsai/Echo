import { useState } from 'react';
import { Search as SearchIcon, UserPlus, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../utils/axiosInstance';
import { getSocket } from '../socket/socket';
import Avatar from '../components/Avatar';

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sentRequests, setSentRequests] = useState(new Set());


  const handleSearch = async (e) => {
    e.preventDefault();
    if (query.trim().length < 2) return toast.error('Type at least 2 characters.');
    setIsLoading(true);
    try {
      const { data } = await axiosInstance.get(`/user/search?q=${query.trim()}`);
      setResults(data);
      if (data.length === 0) toast('No users found.', { icon: '🔍' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Search failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const sendEchoRequest = async (toUserId, username) => {
    try {
      await axiosInstance.post('/echo/send', { toUserId });
      setSentRequests((s) => new Set([...s, toUserId]));
      // Also emit via socket for real-time delivery
      const socket = getSocket();
      socket?.emit('echo-request', { toUserId });
      toast.success(`Connection request sent to ${username}.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request.');
    }
  };



  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-pri mb-1">Find People</h1>
          <p className="text-slate-400 text-sm">Search for users to connect with</p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              id="search-input"
              type="text"
              className="input-field"
              style={{ paddingLeft: '2.75rem' }}
              placeholder="Search by username..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button id="search-btn" type="submit" disabled={isLoading} className="btn-primary px-6">
            {isLoading ? '...' : 'Search'}
          </button>
        </form>

        {/* Results */}
        <div className="space-y-3">
          {results.map((u) => (
            <div key={u._id} className="glass rounded-2xl p-4 flex items-center gap-4 fade-in">
              <Avatar
                src={u.avatar}
                name={u.nickname || u.username}
                sizeClass="w-12 h-12"
                borderRadiusClass="rounded-full"
                isOnline={u.isOnline}
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-pri">@{u.username}</p>
                {u.bio && <p className="text-slate-400 text-sm truncate">{u.bio}</p>}
                {!u.bio && (
                  <p className="text-slate-500 text-sm">
                    {u.isOnline ? '🟢 Online' : '⚫ Offline'}
                  </p>
                )}
              </div>
              <button
                id={`echo-btn-${u._id}`}
                onClick={() => sendEchoRequest(u._id, u.username)}
                disabled={sentRequests.has(u._id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${sentRequests.has(u._id)
                    ? 'bg-green-500/10 text-green-400 border border-green-500/30 cursor-not-allowed'
                    : 'btn-primary'
                  }`}
              >
                {sentRequests.has(u._id) ? (
                  <><Check size={15} /> Sent</>
                ) : (
                  <><UserPlus size={15} /> Connect</>
                )}
              </button>
            </div>
          ))}

          {results.length === 0 && query && !isLoading && (
            <div className="text-center py-16 text-slate-500">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-lg">No users found for "{query}"</p>
              <p className="text-sm mt-2">Try a different username</p>
            </div>
          )}

          {results.length === 0 && !query && (
            <div className="text-center py-16 text-slate-500">
              <div className="text-5xl mb-4">📡</div>
              <p className="text-lg">Search for people to connect</p>
              <p className="text-sm mt-2">Find people and send them a connection request</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
