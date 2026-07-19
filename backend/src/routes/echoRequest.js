import { Hono } from 'hono';
import { verifyToken } from '../middleware/verifyToken.js';
import {
    sendEchoRequest, acceptEchoRequest, declineEchoRequest,
    getPendingRequests, getSentRequests,
} from '../controllers/echoRequestController.js';

const echo = new Hono();

echo.post('/send', verifyToken, sendEchoRequest);
echo.post('/accept', verifyToken, acceptEchoRequest);
echo.post('/decline', verifyToken, declineEchoRequest);
echo.get('/pending', verifyToken, getPendingRequests);
echo.get('/sent', verifyToken, getSentRequests);

export default echo;
