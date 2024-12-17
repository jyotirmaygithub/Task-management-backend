const JWT = require("jsonwebtoken");
require("dotenv").config();

const JWT_secret = process.env.JWT_SECRET;

function fetchUserId(req, res, next) {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    console.log("no id")
    return res.status(401).json({ msg: "No Token Provided" });
  }

  try {
    const data = JWT.verify(token, JWT_secret);
    req.userId = data.newUser.id; // Assuming the decoded token contains `newUser.id`
    next();
  } catch (error) {
    return res.status(401).json({ msg: "Invalid Token" });
  }
}


module.exports = fetchUserId
