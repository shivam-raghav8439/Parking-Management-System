import Redis from 'ioredis';

let redisClient = null;
let isRedisReady = false;

// Initialize Redis Client with resilient timeouts
export const connectRedis = () => {
  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  
  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000, // Timeout after 2s to not stall server startup
      retryStrategy: (times) => {
        if (times > 3) {
          console.warn('⚠️  [REDIS WARNING] Connection failed 3 times. Caching is disabled.');
          isRedisReady = false;
          return null; // Stop reconnecting
        }
        return Math.min(times * 100, 2000);
      }
    });

    redisClient.on('error', (err) => {
      // Gracefully log connection error without throwing process-level errors
      console.warn(`🔌 [REDIS ERROR] Connection failed: ${err.message}`);
      isRedisReady = false;
    });

    redisClient.on('connect', () => {
      console.log('🚀 [REDIS] Connected successfully. Cache is active.');
      isRedisReady = true;
    });
    
    redisClient.on('end', () => {
      isRedisReady = false;
    });
  } catch (err) {
    console.warn(`🔌 [REDIS ERROR] Initialization error: ${err.message}`);
    isRedisReady = false;
  }
};

// Express cache middleware
export const cacheMiddleware = (durationInSeconds, cacheKey = '') => {
  return async (req, res, next) => {
    // Gracefully bypass if Redis is not connected/ready
    if (!redisClient || !isRedisReady) {
      return next();
    }

    try {
      const key = cacheKey || `cache:${req.originalUrl}`;
      const cachedData = await redisClient.get(key);

      if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
      }

      // Intercept and cache res.json calls
      const originalJson = res.json;
      res.json = function (body) {
        if (res.statusCode === 200 && body && body.success !== false) {
          redisClient.setex(key, durationInSeconds, JSON.stringify(body))
            .catch(err => console.warn(`🔌 [REDIS WARN] Failed to set cache for ${key}: ${err.message}`));
        }
        return originalJson.call(this, body);
      };

      next();
    } catch (err) {
      console.warn(`🔌 [REDIS WARN] Cache middleware failed: ${err.message}`);
      next();
    }
  };
};

// Clear cache keys matching a pattern
export const clearCachePattern = async (pattern) => {
  if (!redisClient || !isRedisReady) {
    return;
  }
  try {
    const keys = await redisClient.keys(pattern);
    if (keys && keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (err) {
    console.warn(`🔌 [REDIS WARN] Failed to clear pattern ${pattern}: ${err.message}`);
  }
};

// Evict slots & stats caches on entries/exits
export const clearParkingCaches = async () => {
  await clearCachePattern('cache:/api/stats*');
  await clearCachePattern('cache:/api/slots*');
};

export default { connectRedis, cacheMiddleware, clearCachePattern, clearParkingCaches };
