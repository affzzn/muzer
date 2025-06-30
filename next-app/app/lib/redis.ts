// app/lib/redis.ts
import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = createClient({ url: redisUrl });

redis.on("error", (err) => console.error("Redis Client Error", err));

if (!redis.isOpen) {
  await redis.connect();
}

redis.on("connect", () => {
  console.log("Connected to Redis");
});
redis.on("reconnecting", () => {
  console.log("Reconnecting to Redis...");
});

redis.on("end", () => {
  console.log("Redis connection closed");
});
