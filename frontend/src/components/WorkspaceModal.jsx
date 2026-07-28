import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import useWorkspaceStore from '../store/workspaceStore';

const WorkspaceModal = ({ open, onClose, initialTab = 'join', onSuccess }) => {
  const { createWorkspace, joinWorkspace } = useWorkspaceStore();
  const [tab, setTab] = useState(initialTab);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setTab(initialTab);
    }
  }, [initialTab, open]);

  if (!open) return null;

  const resetAndClose = () => {
    setName('');
    setDescription('');
    setCode('');
    onClose();
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Workspace name is required');

    try {
      setIsSubmitting(true);
      const result = await createWorkspace(name.trim(), description.trim());
      toast.success('Workspace created successfully.');
      resetAndClose();
      onSuccess?.(result);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create workspace.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinWorkspace = async (e) => {
    e.preventDefault();
    if (!code.trim()) return toast.error('Invite code is required');

    try {
      setIsSubmitting(true);
      const result = await joinWorkspace(code.trim());
      toast.success(`Joined workspace: ${result.workspace?.name || 'Workspace'}.`);
      resetAndClose();
      onSuccess?.(result);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired invite code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-primary)',
          borderRadius: '18px',
          width: '90%',
          maxWidth: '420px',
          padding: '24px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          position: 'relative',
        }}
      >
        <button
          onClick={resetAndClose}
          type="button"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          <X size={18} />
        </button>

        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Workspace Access
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '18px' }}>
          Create a new workspace for your team or join an existing one with an invite code.
        </p>

        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-primary)', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => setTab('join')}
            style={{
              flex: 1,
              padding: '10px 0',
              background: 'transparent',
              border: 'none',
              color: tab === 'join' ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: tab === 'join' ? '2px solid var(--accent)' : 'none',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Join Workspace
          </button>
          <button
            type="button"
            onClick={() => setTab('create')}
            style={{
              flex: 1,
              padding: '10px 0',
              background: 'transparent',
              border: 'none',
              color: tab === 'create' ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: tab === 'create' ? '2px solid var(--accent)' : 'none',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Create Workspace
          </button>
        </div>

        {tab === 'join' ? (
          <form onSubmit={handleJoinWorkspace} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Invite Code
              </label>
              <input
                type="text"
                required
                placeholder="Enter an 8-character invite code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'var(--bg-panel)',
                  border: '1px solid var(--border-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{ padding: '10px', fontSize: '13px', fontWeight: 600 }}
            >
              {isSubmitting ? 'Joining...' : 'Join Workspace'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCreateWorkspace} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Workspace Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Acme Corp"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'var(--bg-panel)',
                  border: '1px solid var(--border-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Description
              </label>
              <textarea
                placeholder="Brief description of your team"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'var(--bg-panel)',
                  border: '1px solid var(--border-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none',
                  resize: 'none',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{ padding: '10px', fontSize: '13px', fontWeight: 600 }}
            >
              {isSubmitting ? 'Creating...' : 'Create Workspace'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default WorkspaceModal;
