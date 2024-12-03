const express = require("express");
const router = express.Router();
const fetchUserId = require("../middleware/fetchUserId");
const validator = require('validator');
const user = require("../models/User");
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
const loginLimiter = require("../middleware/loginLimiter")
//const { RateLimiterMemory } = require("rate-limiter-flexible");
const { checkBlacklist, tokenBlacklist } = require("../middleware/tokenBlockList")
require("dotenv").config();

const JWT_secret = process.env.JWT_SECRET;

// function : object which carries id of the user document.
function idObject(newUser) {
  const data = {
    newUser: {
      id: newUser.id,
    },
  };
  return data;
}

// Utility function to check password strength
const isStrongPassword = (password) => {
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return strongPasswordRegex.test(password);
};

//ROUTE 1 : creating an new user account.
router.post("/newuser", async (req, res) => {
  const { name, email, password, employee_id, manager_id, role, aboutSelf } = req.body;

  // Basic validation using destructuring
  if (!name || !email || !password || !employee_id || !role) {
    return res
      .status(400)
      .json({ message: "Name, email, password, employee_id and role are required" });
  }

  // Validate employee_id and manager_id to be numbers
  if (isNaN(employee_id)) {
    return res.status(400).json({ message: "Employee ID must be numbers" });
  }

  if (manager_id && isNaN(manager_id)) {
    return res.status(400).json({ message: "Manager ID must be numbers" });
  }

  // Validate name, aboutSelf to be strings
  if (typeof name !== 'string') {
    return res.status(400).json({ message: "Name must be strings" });
  }

  if (aboutSelf && typeof aboutSelf !== 'string') {
    return res.status(400).json({ message: "AboutSelf must be strings" });
  }

  // Email format validation
  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  // Password strength validation
  if (!isStrongPassword(password)) {
    return res.status(400).json({
      message: "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character"
    });
  }

  // Check if user already exists
  try {
    let existingUser = await user.findOne({ email });
    if (existingUser) {
      console.log("email", email);
      return res.status(400).json({ message: "User already exists" });
    }
    console.log("later one email", email);
  } catch (error) {
    console.error(error.message);
    return res.status(500).send("Internal server error");
  }


  // Hash the password
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = await user.create({
      name,
      email,
      password: hashedPassword,
      employee_id,
      manager_id,
      role,
      aboutSelf
    });

    // Generate JWT token
    const data = idObject(newUser);
    const auth_token = jwt.sign(data, JWT_secret);
    res.json({ auth_token });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server Error Occurred");
  }
});

// ROUTE 2 : Authenticate a user using.
router.post("/login", loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    // Check if the user exists
    const existingUser = await user.findOne({ email });
    if (!existingUser) {
      return res.status(401).json({ msg: "User does not exist!" });
    }

    // Check if the password is correct
    const isPasswordValid = await bcrypt.compare(
      password,
      existingUser.password
    );
    if (!isPasswordValid) {
      return res.status(401).json({ msg: "Invalid Credentials" });
    }

    // Generate JWT token
    const data = idObject(existingUser);
    const auth_token = jwt.sign(data, JWT_secret);
    res.json({ auth_token });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error Occurred");
  }
});

// Logout user
router.post("/logout", fetchUserId, checkBlacklist, (req, res) => {
  const token = req.header("auth-token");
  tokenBlacklist.push(token);
  res.send("Logged out successfully");
});

module.exports = router;
