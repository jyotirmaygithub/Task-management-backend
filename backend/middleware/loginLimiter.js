const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 15, 
    message: "Too many login attempts from this IP, please try again after 10 minutes",
    headers: true,
});

module.exports = loginLimiter;