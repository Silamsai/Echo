import Redis from 'ioredis';

let redis;

class MockRedis {
    async get() { return null; }
    async set() { return 'OK'; }
    async del() { return 0; }
    async keys() { return []; }
    on() { return this; }
    once() { return this; }
    off() { return this; }
}

export const connectRedis = (env) => {
    if (redis) return redis;

    const redisUrl = env?.REDIS_URL;
    // ioredis uses Node net sockets and can crash Cloudflare Worker isolates (Error 1101).
    // Always use MockRedis inside Workers; real Redis is for the Node socket server.
    const isCloudflareWorker =
        typeof WebSocketPair !== 'undefined' ||
        (typeof caches !== 'undefined' && typeof caches.default !== 'undefined');

    if (!redisUrl || isCloudflareWorker) {
        if (!redisUrl) {
            console.log('⚠️ No REDIS_URL provided; using MockRedis fallback.');
        } else {
            console.log('⚠️ Cloudflare Worker detected; using MockRedis (skip ioredis).');
        }
        redis = new MockRedis();
        return redis;
    }

    try {
        redis = new Redis(redisUrl, {
            maxRetriesPerRequest: 3, // Fail fast to avoid exceeding Workers request limit
            connectTimeout: 3000,    // 3 seconds timeout
            lazyConnect: true,
            tls: redisUrl.startsWith('rediss://') ? {} : undefined,
        });

        redis.on('connect', () => console.log('✅ Redis Connected'));
        redis.on('error', (err) => console.error('❌ Redis Error:', err.message));
    } catch (err) {
        console.error('❌ Redis Connection Failed:', err.message);
        redis = new MockRedis();
    }

    return redis;
};

export const getRedis = () => {
    if (!redis) {
        console.log('⚠️ Redis requested before connect; using MockRedis fallback.');
        redis = new MockRedis();
    }
    return redis;
};
