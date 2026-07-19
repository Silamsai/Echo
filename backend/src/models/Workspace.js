import mongoose from 'mongoose';

const workspaceSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 50,
        },
        description: {
            type: String,
            default: '',
            maxlength: 250,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        code: {
            type: String,
            unique: true,
            required: true,
        },
        avatar: {
            type: String,
            default: '',
        },
    },
    { timestamps: true }
);

export default mongoose.model('Workspace', workspaceSchema);
