const rateLimit = require("express-rate-limit");

// Middleware to protect from brute-force attacks
const loginLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 10, // Limit each IP to 10 login requests per window
    message: "Too many login attempts from this IP, please try again after 15 minutes",
    headers: true,
});

module.exports = loginLimiter;