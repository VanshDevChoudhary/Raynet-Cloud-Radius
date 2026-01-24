import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
  error?: string;
}

// Sliding window rate limiter backed by Redis sorted sets
export class RateLimiter {
  private prefix: string;
  private limit: number;
  private window: number; // in seconds

  constructor(prefix: string, limit: number, windowSeconds: number) {
    this.prefix = prefix;
    this.limit = limit;
    this.window = windowSeconds;
  }

  async check(identifier: string): Promise<RateLimitResult> {
    try {
      const key = `${this.prefix}:${identifier}`;
      const now = Date.now();
      const windowStart = now - this.window * 1000;

      // Remove old entries
      await redis.zremrangebyscore(key, 0, windowStart);

      // Count current requests
      const count = await redis.zcount(key, windowStart, now);

      if (count >= this.limit) {
        // Get the oldest request timestamp to calculate reset time
        const oldest = await redis.zrange(key, 0, 0, "WITHSCORES");
        const resetTime = oldest.length > 1
          ? parseInt(oldest[1]) + this.window * 1000
          : now + this.window * 1000;

        return {
          success: false,
          remaining: 0,
          reset: resetTime,
          error: `Rate limit exceeded. Try again in ${Math.ceil((resetTime - now) / 1000)} seconds`,
        };
      }

      // Add current request
      await redis.zadd(key, now, `${now}`);

      // Set expiry on the key
      await redis.expire(key, this.window);

      return {
        success: true,
        remaining: this.limit - count - 1,
        reset: now + this.window * 1000,
      };
    } catch (error) {
      console.error("[Rate Limiter] Error:", error);
      // Fail open - allow the request if Redis is down
      return {
        success: true,
        remaining: this.limit,
        reset: Date.now() + this.window * 1000,
      };
    }
  }

  async reset(identifier: string): Promise<void> {
    try {
      const key = `${this.prefix}:${identifier}`;
      await redis.del(key);
    } catch (error) {
      console.error("[Rate Limiter] Reset error:", error);
    }
  }
}

// Pre-configured rate limiters
export const otpSendLimiter = new RateLimiter("otp:send", 3, 300); // 3 OTPs per 5 minutes
export const otpVerifyLimiter = new RateLimiter("otp:verify", 5, 600); // 5 verifications per 10 minutes
export const apiLimiter = new RateLimiter("api:general", 100, 60); // 100 requests per minute
