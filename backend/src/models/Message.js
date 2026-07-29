import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
    {
        conversation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Conversation',
            required: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            enum: ['text', 'image', 'voice', 'poll'],
            default: 'text',
        },
        content: {
            type: String,
            default: '',
        },
        pollQuestion: {
            type: String,
            default: '',
        },
        pollOptions: [
            {
                text: { type: String, required: true },
                votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
            }
        ],
        linkPreview: {
            title: { type: String, default: '' },
            description: { type: String, default: '' },
            image: { type: String, default: '' },
            url: { type: String, default: '' }
        },
        fileUrl: {
            type: String,
            default: '',
        },
        filePublicId: {
            type: String,
            default: '',
        },
        seen: {
            type: Boolean,
            default: false,
        },
        seenAt: {
            type: Date,
            default: null,
        },
        deleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

export default mongoose.model('Message', messageSchema);
