import mongoose from 'mongoose';

const echoRequestSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'declined'],
            default: 'pending',
        },
    },
    { timestamps: true }
);

echoRequestSchema.index({ sender: 1, receiver: 1 }, { unique: true });

export default mongoose.model('EchoRequest', echoRequestSchema);
