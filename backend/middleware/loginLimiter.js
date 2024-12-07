const rateLimit = require('express-rate-limit');

// Authentication rate limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5,
  message: "Too many login attempts from this IP, please try again after 15 minutes.",
});

// Admin rate limiter
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 50, 
  message: "Too many requests from this IP, please try again after 15 minutes.",
});

// Manager rate limiter
const managerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  message: "Too many requests from this IP, please try again after 15 minutes.",
});

// Employee rate limiter
const employeeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 200, 
  message: "Too many requests from this IP, please try again after 15 minutes.",
});

// Analytics rate limiter
const analyticsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 20, 
  message: "Too many requests for analytics from this IP, please try again after an hour.",
});

module.exports = { authLimiter, adminLimiter, managerLimiter, employeeLimiter, analyticsLimiter };
