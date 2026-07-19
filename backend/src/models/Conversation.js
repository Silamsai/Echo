import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
    {
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        lastMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message',
            default: null,
        },
        lastMessageAt: {
            type: Date,
            default: null,
        },
        isGroup: {
            type: Boolean,
            default: false,
        },
        name: {
            type: String,
            default: '',
        },
        groupAdmin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        groupAvatar: {
            type: String,
            default: '',
        },
        workspace: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Workspace',
            default: null,
        },
    },
    { timestamps: true }
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ workspace: 1 });

export default mongoose.model('Conversation', conversationSchema);
