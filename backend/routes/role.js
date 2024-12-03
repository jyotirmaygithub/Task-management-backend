const express = require("express");
const router = express.Router();
const fetchUserId = require("../middleware/fetchUserId");
const User = require("../models/User");
const Task = require("../models/Task");
const loginLimiter = require("../middleware/loginLimiter");
const { checkBlacklist } = require("../middleware/tokenBlockList");
require("dotenv").config();

// Route: Update or edit user profile.
router.get("/admin", checkBlacklist, fetchUserId, loginLimiter, async (req, res) => {

    try {

        let userDocument = await User
            .findById({ _id: req.userId })
            .select("-password");

        if (!userDocument) {
            console.error(`User with ID ${req.userId} not found`);
            return res.status(404).json({ msg: "User not found" });
        }

        console.log("user document = ", userDocument);

        // Check if the user's email matches the admin email
        if (userDocument.email !== process.env.MYEMAIL) {
            console.error(`Unauthorized access: User email ${userDocument.email} does not match admin email ${process.env.MYEMAIL}`);
            return res.status(401).json({ msg: "You are not authorized to proceed further" });
        }

        const fetchingTask = await Task.find();
        const allUsers = await User.find();

        res.json({ fetchingTask, allUsers });
    } catch (error) {
        console.error("Error during admin data access:", error.message);
        res.status(500).send("Internal server error");
    }
});

// Route: Update or edit user profile.
router.get("/manager", checkBlacklist, fetchUserId, loginLimiter, async (req, res) => {

    try {

        const { employee_id, role } = req.body;
        let userDocument = await User
            .findById({ _id: req.userId })
            .select("-password");

        if (!userDocument) {
            console.error(`User with ID ${req.userId} not found`);
            return res.status(404).json({ msg: "User not found" });
        }

        if (userDocument.role !== role) {
            console.error(`Unauthorized role: User role ${userDocument.role} does not match required role ${role}`);
            return res.status(401).json({ msg: "You are not an authorized manager to get the data" });
        }

        if (userDocument.employee_id !== employee_id) {
            console.error(`Unauthorized employee_id: User employee_id ${userDocument.employee_id} does not match required employee_id ${employee_id}`);
            return res.status(401).json({ msg: "You are not an authorized manager to get the data" });
        }

        // Fetch all employees under the manager
        const employeesUnderManager = await User.find({ employee_id: employee_id });

        res.json({ employeesUnderManager });
    } catch (error) {
        console.error("Error during manager data access", error.message);
        res.status(500).send("Internal server error");
    }
});


// Route 4 : to get entered user data.
router.get("/employee", checkBlacklist, fetchUserId, async (req, res) => {
    console.log("is it working or not")
    try {

        let userDocument = await User
            .findById({ _id: req.userId })
            .select("-password");
        res.json({ user_data: userDocument });
    } catch (error) {
        // throw errors.
        console.error(error.message);
        res.status(500).send("Internal server Error Occured");
    }
});

module.exports = router;
