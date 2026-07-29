import Workspace from '../models/Workspace.js';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import crypto from 'crypto';
import cloudinary from '../config/cloudinary.js';
import { parseFile, uploadToCloudinary } from '../middleware/upload.js';
import { emitToSocketOrRoom } from '../utils/socketEmit.js';

// Helper to generate a unique random workspace share link code
const generateUniqueCode = async () => {
    let isUnique = false;
    let code = '';
    while (!isUnique) {
        code = crypto.randomBytes(4).toString('hex').toUpperCase();
        const existing = await Workspace.findOne({ code });
        if (!existing) isUnique = true;
    }
    return code;
};

// ─── POST /workspace ──────────────────────────────────────────────────────────
export const createWorkspace = async (c) => {
    try {
        const { body, file } = await parseFile(c, 'avatar');
        const { name, description } = body;
        const currentUser = c.get('user');

        if (!name || name.trim().length < 3) {
            return c.json({ message: 'Workspace name must be at least 3 characters.' }, 400);
        }

        const code = await generateUniqueCode();
        let avatarUrl = '';

        if (file) {
            const uploadRes = await uploadToCloudinary(file.buffer, {
                folder: 'echo/workspaces',
                transformation: [{ width: 250, height: 250, crop: 'fill' }],
            });
            avatarUrl = uploadRes.secure_url;
        }

        const workspace = await Workspace.create({
            name: name.trim(),
            description: (description || '').trim(),
            owner: currentUser._id,
            members: [currentUser._id],
            code,
            avatar: avatarUrl,
        });

        // Automatically create a default General channel for the workspace
        const firstChannel = await Conversation.create({
            isGroup: true,
            name: 'general',
            workspace: workspace._id,
            participants: [currentUser._id],
        });

        return c.json({
            message: 'Workspace created successfully.',
            workspace,
            defaultChannel: firstChannel,
        }, 201);
    } catch (err) {
        console.error('Create workspace error:', err);
        return c.json({ message: 'Server error.' }, 500);
    }
};

// ─── GET /workspace ───────────────────────────────────────────────────────────
export const getWorkspaces = async (c) => {
    try {
        const currentUser = c.get('user');
        const workspaces = await Workspace.find({ members: currentUser._id })
            .populate('owner', '_id username avatar')
            .populate('members', '_id username avatar')
            .sort({ createdAt: -1 });

        return c.json(workspaces, 200);
    } catch (err) {
        console.error('Get workspaces error:', err);
        return c.json({ message: 'Server error.' }, 500);
    }
};

// ─── GET /workspace/:workspaceId ──────────────────────────────────────────────
export const getWorkspaceById = async (c) => {
    try {
        const workspaceId = c.req.param('workspaceId');
        const currentUser = c.get('user');

        const workspace = await Workspace.findById(workspaceId)
            .populate('owner', '_id username avatar bio')
            .populate('members', '_id username avatar bio');

        if (!workspace) return c.json({ message: 'Workspace not found.' }, 404);

        const isMember = workspace.members.some((m) => m._id.toString() === currentUser._id.toString());
        if (!isMember) return c.json({ message: 'Access denied.' }, 403);

        return c.json(workspace, 200);
    } catch (err) {
        console.error('Get workspace error:', err);
        return c.json({ message: 'Server error.' }, 500);
    }
};

// ─── POST /workspace/:workspaceId/member ──────────────────────────────────────
export const addMemberToWorkspace = async (c) => {
    try {
        const workspaceId = c.req.param('workspaceId');
        const { userId } = await c.req.json();
        const currentUser = c.get('user');

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) return c.json({ message: 'Workspace not found.' }, 404);

        // Only workspace owner can invite members directly
        if (workspace.owner.toString() !== currentUser._id.toString()) {
            return c.json({ message: 'Only the workspace owner can add members.' }, 403);
        }

        if (workspace.members.includes(userId)) {
            return c.json({ message: 'User is already a member.' }, 400);
        }

        workspace.members.push(userId);
        await workspace.save();

        // Automatically add the new workspace member to all existing public group chats/channels in this workspace
        const channels = await Conversation.find({ workspace: workspaceId });
        for (const channel of channels) {
            if (!channel.participants.includes(userId)) {
                channel.participants.push(userId);
                await channel.save();
                emitToSocketOrRoom(c, `user_${userId}`, 'new-channel', channel);
            }
        }

        const updated = await Workspace.findById(workspaceId)
            .populate('owner', '_id username avatar')
            .populate('members', '_id username avatar');

        emitToSocketOrRoom(c, `workspace_${workspaceId}`, 'new-member', { workspace: updated, invitedUserId: userId });

        return c.json({ message: 'Member added successfully.', workspace: updated }, 200);
    } catch (err) {
        console.error('Add workspace member error:', err);
        return c.json({ message: 'Server error.' }, 500);
    }
};

// ─── POST /workspace/join ─────────────────────────────────────────────────────
export const joinWorkspaceByCode = async (c) => {
    try {
        const { code } = await c.req.json();
        const currentUser = c.get('user');

        if (!code) return c.json({ message: 'Workspace invitation code is required.' }, 400);

        const workspace = await Workspace.findOne({ code: code.trim().toUpperCase() });
        if (!workspace) return c.json({ message: 'Invalid invitation code.' }, 404);

        if (workspace.members.includes(currentUser._id)) {
            return c.json({ message: 'You are already a member of this workspace.', workspace }, 200);
        }

        workspace.members.push(currentUser._id);
        await workspace.save();

        // Automatically add the user to all workspace channels
        const channels = await Conversation.find({ workspace: workspace._id });
        for (const channel of channels) {
            if (!channel.participants.includes(currentUser._id)) {
                channel.participants.push(currentUser._id);
                await channel.save();
            }
        }

        const updated = await Workspace.findById(workspace._id)
            .populate('owner', '_id username avatar')
            .populate('members', '_id username avatar');

        emitToSocketOrRoom(c, `workspace_${workspace._id}`, 'new-member', { workspace: updated, invitedUserId: currentUser._id });

        return c.json({ message: 'Successfully joined workspace.', workspace: updated }, 200);
    } catch (err) {
        console.error('Join workspace by code error:', err);
        return c.json({ message: 'Server error.' }, 500);
    }
};

// ─── POST /workspace/:workspaceId/channels ────────────────────────────────────
export const createChannel = async (c) => {
    try {
        const workspaceId = c.req.param('workspaceId');
        const { name } = await c.req.json();
        const currentUser = c.get('user');

        if (!name || name.trim().length < 3) {
            return c.json({ message: 'Channel name must be at least 3 characters.' }, 400);
        }

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) return c.json({ message: 'Workspace not found.' }, 404);

        const isMember = workspace.members.some((m) => m._id.toString() === currentUser._id.toString());
        if (!isMember) return c.json({ message: 'Access denied.' }, 403);

        // Channels contain all existing workspace members by default
        const channel = await Conversation.create({
            isGroup: true,
            name: name.trim().toLowerCase(),
            workspace: workspaceId,
            participants: workspace.members,
        });

        await channel.populate('participants', '_id username nickname avatar isOnline lastSeen');

        workspace.members.forEach((userId) => {
            emitToSocketOrRoom(c, `user_${userId}`, 'new-channel', channel);
        });

        return c.json({ message: 'Channel created successfully.', channel }, 201);
    } catch (err) {
        console.error('Create channel error:', err);
        return c.json({ message: 'Server error.' }, 500);
    }
};

// ─── GET /workspace/:workspaceId/channels ─────────────────────────────────────
export const getWorkspaceChannels = async (c) => {
    try {
        const workspaceId = c.req.param('workspaceId');
        const currentUser = c.get('user');

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) return c.json({ message: 'Workspace not found.' }, 404);

        const isMember = workspace.members.some((m) => m._id.toString() === currentUser._id.toString());
        if (!isMember) return c.json({ message: 'Access denied.' }, 403);

        const channels = await Conversation.find({ workspace: workspaceId })
            .populate('participants', '_id username nickname avatar isOnline lastSeen')
            .populate('lastMessage')
            .sort({ lastMessageAt: -1 });

        return c.json(channels, 200);
    } catch (err) {
        console.error('Get workspace channels error:', err);
        return c.json({ message: 'Server error.' }, 500);
    }
};

// ─── DELETE /workspace/:workspaceId ───────────────────────────────────────────
export const deleteWorkspace = async (c) => {
    try {
        const workspaceId = c.req.param('workspaceId');
        const currentUser = c.get('user');

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) return c.json({ message: 'Workspace not found.' }, 404);

        if (workspace.owner.toString() === currentUser._id.toString()) {
            await Conversation.deleteMany({ workspace: workspaceId });
            await Workspace.findByIdAndDelete(workspaceId);
            return c.json({ message: 'Workspace deleted successfully.' }, 200);
        } else {
            workspace.members = workspace.members.filter(
                (mId) => mId.toString() !== currentUser._id.toString()
            );
            await workspace.save();

            const channels = await Conversation.find({ workspace: workspaceId });
            for (const channel of channels) {
                channel.participants = channel.participants.filter(
                    (pId) => pId.toString() !== currentUser._id.toString()
                );
                await channel.save();
            }

            return c.json({ message: 'Left workspace successfully.' }, 200);
        }
    } catch (err) {
        console.error('Delete/Leave workspace error:', err);
        return c.json({ message: 'Server error.' }, 500);
    }
};
