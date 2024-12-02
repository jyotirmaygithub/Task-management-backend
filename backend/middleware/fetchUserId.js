const JWT = require("jsonwebtoken");
require("dotenv").config();

const JWT_secret = process.env.JWT_SECRET;

function fetchUserId(req, res, next) {
  const token = req.header("auth-token");
  if (!token) {
    return res.status(401).json({ msg: "No Token Provided" });
  }
  try {
    const data = JWT.verify(token, JWT_secret);
    // storing id to use in future requests.
    req.userId = data.newUser.id
    next()
  } catch (error) {
    return res.status(401).send({ msg: "Invalid Token" });
  }
}

module.exports = fetchUserId
