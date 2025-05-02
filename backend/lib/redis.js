import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

// Use local Redis in Docker, fallback to Upstash in production
const redisURL =
  process.env.NODE_ENV === "production"
    ? process.env.UPSTASH_REDIS_URL
    : "redis://redis:6379";

export const redis = new Redis(redisURL);