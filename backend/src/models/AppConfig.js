import mongoose from 'mongoose';

const appConfigSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            default: 'main_config',
        },
        logoUrl: {
            type: String,
            default: '',
        },
        sidebarIcons: {
            chats: { type: String, default: '' },
            search: { type: String, default: '' },
            requests: { type: String, default: '' },
            profile: { type: String, default: '' },
            settings: { type: String, default: '' },
        },
        features: {
            voiceCalls: { type: Boolean, default: true },
            videoCalls: { type: Boolean, default: true },
            imageSharing: { type: Boolean, default: true },
            voiceNotes: { type: Boolean, default: true },
            otpVerification: { type: Boolean, default: true },
        },
    },
    { timestamps: true }
);

export default mongoose.model('AppConfig', appConfigSchema);
