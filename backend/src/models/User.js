import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 3,
            maxlength: 30,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        passwordHash: {
            type: String,
            default: null,
        },
        avatar: {
            type: String,
            default: '',
        },
        avatarPublicId: {
            type: String,
            default: '',
        },
        provider: {
            type: String,
            enum: ['local', 'google'],
            default: 'local',
        },
        googleId: {
            type: String,
            default: null,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        isOnline: {
            type: Boolean,
            default: false,
        },
        lastSeen: {
            type: Date,
            default: null,
        },
        isAdmin: {
            type: Boolean,
            default: false,
        },
        isBanned: {
            type: Boolean,
            default: false,
        },
        bio: {
            type: String,
            default: '',
            maxlength: 160,
        },
        nickname: {
            type: String,
            default: '',
            maxlength: 30,
        },
        blockedUsers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        mutedConversations: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Conversation',
            },
        ],
    },
    { timestamps: true }
);

userSchema.index({ username: 'text' });

export default mongoose.model('User', userSchema);
