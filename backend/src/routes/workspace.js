import { Hono } from 'hono';
import { verifyToken } from '../middleware/verifyToken.js';
import {
    createWorkspace, getWorkspaces, getWorkspaceById,
    addMemberToWorkspace, joinWorkspaceByCode,
    createChannel, getWorkspaceChannels,
} from '../controllers/workspaceController.js';

const workspace = new Hono();

// All workspace routes require auth
workspace.use('*', verifyToken);

workspace.post('/', createWorkspace);
workspace.get('/', getWorkspaces);
workspace.post('/join', joinWorkspaceByCode);
workspace.get('/:workspaceId', getWorkspaceById);
workspace.post('/:workspaceId/member', addMemberToWorkspace);
workspace.post('/:workspaceId/channels', createChannel);
workspace.get('/:workspaceId/channels', getWorkspaceChannels);

export default workspace;
