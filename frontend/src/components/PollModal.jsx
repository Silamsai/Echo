import { useState } from 'react';
import { X, Plus, Trash2, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../utils/axiosInstance';

const PollModal = ({ open, onClose, conversationId, onSuccess }) => {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!open) return null;

    const handleAddOption = () => {
        if (options.length >= 6) {
            return toast.error('A poll can have at most 6 options.');
        }
        setOptions([...options, '']);
    };

    const handleRemoveOption = (index) => {
        if (options.length <= 2) {
            return toast.error('A poll must have at least 2 options.');
        }
        setOptions(options.filter((_, idx) => idx !== index));
    };

    const handleOptionChange = (value, index) => {
        const updated = [...options];
        updated[index] = value;
        setOptions(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!question.trim()) return toast.error('Poll question is required.');

        const cleanOptions = options.map((opt) => opt.trim()).filter(Boolean);
        if (cleanOptions.length < 2) {
            return toast.error('Please submit at least 2 non-empty options.');
        }

        try {
            setIsSubmitting(true);
            const response = await axiosInstance.post('/message', {
                conversationId,
                type: 'poll',
                pollQuestion: question.trim(),
                pollOptions: cleanOptions,
            });

            toast.success('Poll created successfully!');
            onSuccess?.(response.data);
            handleClose();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to create poll.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setQuestion('');
        setOptions(['', '']);
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={handleClose}
        >
            <div
                className="w-full max-w-md rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl animate-scale-in"
                style={{
                    background: 'rgba(15, 15, 22, 0.98)',
                    borderColor: 'var(--border-primary)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-white tracking-wide">
                            CREATE LIVE POLL
                        </span>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5 text-left">
                        <label className="text-[10px] font-mono tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
                            Poll Question
                        </label>
                        <input
                            type="text"
                            placeholder="Ask a question..."
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            className="w-full bg-input rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500/50 transition-colors"
                            style={{
                                background: 'var(--bg-input)',
                                border: '1px solid var(--border-primary)',
                                color: 'var(--text-primary)',
                            }}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="flex flex-col gap-2.5 text-left">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-mono tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
                                Options
                            </label>
                            {options.length < 6 && (
                                <button
                                    type="button"
                                    onClick={handleAddOption}
                                    className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                                >
                                    <Plus size={12} /> Add Choice
                                </button>
                            )}
                        </div>

                        <div className="flex flex-col gap-2 max-h-[170px] overflow-y-auto pr-1 no-scrollbar">
                            {options.map((option, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder={`Option ${idx + 1}`}
                                        value={option}
                                        onChange={(e) => handleOptionChange(e.target.value, idx)}
                                        className="flex-1 bg-input rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500/50 transition-colors"
                                        style={{
                                            background: 'var(--bg-input)',
                                            border: '1px solid var(--border-primary)',
                                            color: 'var(--text-primary)',
                                        }}
                                        required
                                    />
                                    {options.length > 2 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveOption(idx)}
                                            className="p-2.5 rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition cursor-pointer flex-shrink-0"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full mt-2 btn-primary py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                        style={{
                            background: 'linear-gradient(135deg, var(--accent), #fa6d9b)',
                        }}
                    >
                        <Send size={12} />
                        {isSubmitting ? 'Creating Poll…' : 'Share Poll'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PollModal;
