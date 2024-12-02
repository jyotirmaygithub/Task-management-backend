const express = require("express");
const router = express.Router();
const fetchUserId = require("../middleware/fetchUserId");
const User = require("../models/User");
const Task = require("../models/Task");
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
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

// Middleware to protect from brute-force attacks
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login requests per window
    message: "Too many login attempts from this IP, please try again after 15 minutes",
    headers: true,
});

// Route: Update or edit user profile.
router.post("/admin", fetchUserId, loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        // Basic validation
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        try {
            // Check if the user exists
            const existingUser = await User.findOne({ email });
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

            if (email !== process.env.MYEMAIL) {
                return res.status(401).json({ msg: "You are not a admin to proceed further" });
            }

            const fetchingTask = await Task.find();
            const allUsers = await User.find();

            // Generate JWT token
            const data = idObject(existingUser);
            const auth_token = jwt.sign(data, JWT_secret);
            res.json({ auth_token, fetchingTask, allUsers });
        } catch (error) {
            console.error(error.message);
            res.status(500).send("Server Error Occurred");
        }
    } catch (error) {
        // Log the error for debugging
        console.error("Error updating user profile:", error);
        res.status(500).send("Internal server error");
    }
});

// Route: Update or edit user profile.
router.post("/manager", fetchUserId, loginLimiter, async (req, res) => {
    try {
        const { email, password, employee_id, role } = req.body;

        // Basic validation
        if (!email || !password || !employee_id || !role) {
            return res.status(400).json({ message: "Email, password, employee id and role are required" });
        }

        try {
            // Check if the user exists
            const existingUser = await User.findOne({ email });
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

            if (email !== process.env.MYEMAIL) {
                return res.status(401).json({ msg: "You are not a admin to proceed further" });
            }

            const fetchingTask = await Task.find();
            const allUsers = await User.find();

            // Generate JWT token
            const data = idObject(existingUser);
            const auth_token = jwt.sign(data, JWT_secret);
            res.json({ auth_token, fetchingTask, allUsers });
        } catch (error) {
            console.error(error.message);
            res.status(500).send("Server Error Occurred");
        }
    } catch (error) {
        // Log the error for debugging
        console.error("Error updating user profile:", error);
        res.status(500).send("Internal server error");
    }
});

module.exports = router;
