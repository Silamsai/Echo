/**
 * Safe Socket.io emit helper.
 * If io is present in the Hono context (e.g. during Node.js local dev), it emits the event.
 * Otherwise (e.g. in Cloudflare Worker environment), it safely logs the mock event.
 */
export const emitToSocketOrRoom = (c, target, event, data) => {
    const io = c.get('io');
    if (io) {
        try {
            io.to(target).emit(event, data);
        } catch (err) {
            console.error(`[Socket] Emit error for event "${event}" to "${target}":`, err);
        }
    } else {
        console.log(`[Socket Mock] Event "${event}" simulated to "${target}" with:`, JSON.stringify(data));
    }
};

export const getIO = (c) => {
    return c.get('io') || null;
};
