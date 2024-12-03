// checkBlacklist.js
let tokenBlacklist = [];

const checkBlacklist = (req, res, next) => {
  const token = req.header("auth-token");
  if (tokenBlacklist.includes(token)) {
    return res.status(401).send("Token has been logged out");
  }
  next();
};

module.exports = { checkBlacklist, tokenBlacklist };
