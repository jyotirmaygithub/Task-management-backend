let tokenBlacklist = [];

const checkBlacklist = (req, res, next) => {
  const token = req.header("auth-token");
  console.log("Token in request:", token); 
  if (tokenBlacklist.includes(token)) {
    console.log("Token is blacklisted:", token);
    return res.status(401).send("Token has been logged out");
  }
  next();
};

module.exports = { checkBlacklist, tokenBlacklist };
