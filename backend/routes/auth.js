const express = require("express");
const router = express.Router();
const fetchUserId = require("../middleware/fetchUserId");
const validator = require('validator');
const user = require("../models/User");
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
const loginLimiter = require("../middleware/loginLimiter")
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

//check password strength
const isStrongPassword = (password) => {
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return strongPasswordRegex.test(password);
};

//creating an new user account.
router.post("/newuser", loginLimiter, async (req, res) => {
  const { name, email, password, employee_id, manager_id, role, aboutSelf } = req.body;

  // Basic validation using destructuring
  if (!name || !email || !password || !employee_id || !role) {
    return res
      .status(400)
      .json({ message: "Name, email, password, employee_id and role are required" });
  }

  let employeeExist = await user.find({
    $or: [
      { employee_id: employee_id },
      { role: "admin" }
    ]
  }).select("-password");

  if (isNaN(employee_id)) {
    return res.status(400).json({ message: "Employee ID must be numbers" });
  }
  if (employeeExist.length > 0) {
    if (employeeExist[0].employee_id === employee_id) {
      return res.status(400).json({ message: "Employee ID already exists" });
    }

    if (employeeExist[0].role === role) {
      return res.status(400).json({ message: "Admin already exists" });
    }
  }
  if (manager_id && isNaN(manager_id)) {
    return res.status(400).json({ message: "Manager ID must be numbers" });
  }
  if (typeof name !== 'string') {
    return res.status(400).json({ message: "Name must be strings" });
  }
  if (aboutSelf && typeof aboutSelf !== 'string') {
    return res.status(400).json({ message: "AboutSelf must be strings" });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({
      message: "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character"
    });
  }

  try {
    let existingUser = await user.findOne({ email });
    if (existingUser) {
      console.log("email", email);
      return res.status(400).json({ message: "User already exists" });
    }
  } catch (error) {
    console.error(error.message);
    return res.status(500).send("Internal server error");
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await user.create({
      name,
      email,
      password: hashedPassword,
      employee_id,
      manager_id,
      role,
      aboutSelf
    });

    const data = idObject(newUser);
    const auth_token = jwt.sign(data, JWT_secret);
    res.json({ auth_token });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server Error Occurred");
  }
});

// user login.
router.post("/login", loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const existingUser = await user.findOne({ email });
    if (!existingUser) {
      return res.status(401).json({ msg: "User does not exist!" });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      existingUser.password
    );
    if (!isPasswordValid) {
      return res.status(401).json({ msg: "Invalid Credentials" });
    }

    const data = idObject(existingUser);
    const auth_token = jwt.sign(data, JWT_secret);
    res.json({ auth_token });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error Occurred");
  }
});

// Logout user.
router.post("/logout", fetchUserId, checkBlacklist, (req, res) => {
  const token = req.header("auth-token");
  tokenBlacklist.push(token);
  res.send("Logged out successfully");
});

module.exports = router;
