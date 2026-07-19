import Redis from 'ioredis';

let redis;

export const connectRedis = (env) => {
    if (redis) return redis;

    redis = new Redis(env.REDIS_URL || 'redis://localhost:6379', {
        maxRetriesPerRequest: null,
        lazyConnect: true,
        tls: env.REDIS_URL?.startsWith('rediss://') ? {} : undefined,
    });

    redis.on('connect', () => console.log('✅ Redis Connected'));
    redis.on('error', (err) => console.error('❌ Redis Error:', err.message));

    return redis;
};

export const getRedis = () => {
    if (!redis) throw new Error('Redis not initialized. Call connectRedis() first.');
    return redis;
};
