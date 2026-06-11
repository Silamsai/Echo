import { useEffect, useState } from 'react';
import { Check, X, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../utils/axiosInstance';
import useNotificationStore from '../store/notificationStore';
import useChatStore from '../store/chatStore';
import { getSocket } from '../socket/socket';
import { formatRelativeTime } from '../utils/formatTime';

const Notifications = () => {
  const { echoRequests, setEchoRequests, removeEchoRequest } = useNotificationStore();
  const { addOrUpdateConversation } = useChatStore();
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    axiosInstance.get('/echo/pending').then(({ data }) => setEchoRequests(data)).catch(() => {});
  }, [setEchoRequests]);

  const getAvatar = (u) =>
    u?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u?.username}`;

  const handleAccept = async (req) => {
    setLoadingId(req._id);
    try {
      const { data } = await axiosInstance.post('/echo/accept', { requestId: req._id });
      removeEchoRequest(req._id);
      if (data.conversation) addOrUpdateConversation(data.conversation);

      // Notify via socket
      const socket = getSocket();
      socket?.emit('echo-accept', {
        requestId: req._id,
        senderId: req.sender._id,
        conversationId: data.conversation?._id,
      });

      toast.success(`Connected with ${req.sender.username}! 🎉`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleDecline = async (req) => {
    setLoadingId(req._id);
    try {
      await axiosInstance.post('/echo/decline', { requestId: req._id });
      removeEchoRequest(req._id);

      const socket = getSocket();
      socket?.emit('echo-decline', { senderId: req.sender._id });

      toast('Request declined.', { icon: '👋' });
    } catch {
      toast.error('Failed to decline.');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)' }}>
            <Bell size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-pri">Echo Requests</h1>
            <p className="text-slate-400 text-sm">{echoRequests.length} pending</p>
          </div>
        </div>

        {echoRequests.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-lg">No pending requests</p>
            <p className="text-sm mt-2">When someone sends you an Echo, it appears here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {echoRequests.map((req) => (
              <div key={req._id} className="glass rounded-2xl p-4 flex items-center gap-4 fade-in">
                <img
                  src={getAvatar(req.sender)}
                  alt={req.sender?.username}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-pri">@{req.sender?.username}</p>
                  {req.sender?.bio && (
                    <p className="text-slate-400 text-sm truncate">{req.sender.bio}</p>
                  )}
                  <p className="text-slate-500 text-xs mt-0.5">
                    {formatRelativeTime(req.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    id={`accept-${req._id}`}
                    onClick={() => handleAccept(req)}
                    disabled={loadingId === req._id}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                    style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}
                    title="Accept"
                  >
                    <Check size={16} className="text-green-400" />
                  </button>
                  <button
                    id={`decline-${req._id}`}
                    onClick={() => handleDecline(req)}
                    disabled={loadingId === req._id}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
                    title="Decline"
                  >
                    <X size={16} className="text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
