const Redis = require('ioredis');

let redis;

const connectRedis = () => {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    lazyConnect: true,
  });

  redis.on('connect', () => console.log('✅ Redis Connected'));
  redis.on('error', (err) => console.error('❌ Redis Error:', err.message));

  return redis;
};

const getRedis = () => {
  if (!redis) throw new Error('Redis not initialized. Call connectRedis() first.');
  return redis;
};

module.exports = { connectRedis, getRedis };
