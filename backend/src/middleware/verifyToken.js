import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Hono middleware: Verifies JWT Bearer token.
 * Sets c.set('user', user) for downstream handlers.
 */
export const verifyToken = async (c, next) => {
    try {
        const authHeader = c.req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return c.json({ message: 'No token provided.' }, 401);
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, c.env.JWT_SECRET);

        const user = await User.findById(decoded.userId).select('-passwordHash');
        if (!user) return c.json({ message: 'User not found.' }, 401);
        if (user.isBanned) return c.json({ message: 'Account is banned.' }, 403);

        c.set('user', user);
        await next();
    } catch (err) {
        return c.json({ message: 'Invalid or expired token.' }, 401);
    }
};

/**
 * Hono middleware: Verifies user is admin.
 * Must be used after verifyToken.
 */
export const verifyAdmin = async (c, next) => {
    const user = c.get('user');
    if (!user?.isAdmin) {
        return c.json({ message: 'Admin access required.' }, 403);
    }
    await next();
};
