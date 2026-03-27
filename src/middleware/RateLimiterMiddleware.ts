import rateLimit, { type RateLimitRequestHandler } from "express-rate-limit";

export const rateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) =>
    res.status(429).json({
      status: 429,
      success: false,
      message: "Too many requests. Please try again later.",
    }),
});
