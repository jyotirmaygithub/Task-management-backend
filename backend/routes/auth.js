const express = require("express");
const router = express.Router();
const fetchUserId = require("../middleware/fetchUserId");
const validator = require('validator');
const user = require("../models/User");
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
const {authLimiter} = require("../middleware/loginLimiter")
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

/**
 * @swagger
 * /api/auth/newuser:
 *   post:
 *     description: Create a new user account.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - employee_id
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 example: henry gupta
 *               email:
 *                 type: string
 *                 example: henrygupta@example.com
 *               password:
 *                 type: string
 *                 example: Password123!
 *               employee_id:
 *                 type: integer
 *                 example: 1947
 *               role:
 *                 type: string
 *                 example: "employee"
 *               aboutSelf:
 *                 type: string
 *                 example: "Interested software developer."
 *     responses:
 *       200:
 *         description: Successfully created a new user and returned the authentication token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 auth_token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ..."
 *       400:
 *         description: Bad request (e.g. missing required fields or invalid data).
 *       500:
 *         description: Internal server error.
 */
router.post("/newuser", authLimiter, async (req, res) => {
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

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     description: User login to obtain an authentication token.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: henrygupta@example.com
 *               password:
 *                 type: string
 *                 example: Password123!
 *     responses:
 *       200:
 *         description: Successfully logged in and returned the authentication token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 auth_token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ..."
 *       400:
 *         description: Missing required fields (email, password).
 *       401:
 *         description: Invalid credentials.
 *       500:
 *         description: Server error.
 */
router.post("/login", authLimiter, async (req, res) => {
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

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     description: Log out the user by invalidating their session token.
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []  # This route requires authentication (Bearer token).
 *     responses:
 *       200:
 *         description: Successfully logged out.
 *       401:
 *         description: Unauthorized (missing or invalid token).
 *       500:
 *         description: Server error.
 */
router.post("/logout", fetchUserId, checkBlacklist, (req, res) => {
  const token = req.header("auth-token");
  tokenBlacklist.push(token);
  res.send("Logged out successfully");
});

module.exports = router;
