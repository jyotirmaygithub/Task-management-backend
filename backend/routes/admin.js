const express = require("express");
const router = express.Router();
const fetchUserId = require("../middleware/fetchUserId");
const User = require("../models/User");
const Task = require("../models/Task");
const loginLimiter = require("../middleware/loginLimiter");
const { checkBlacklist } = require("../middleware/tokenBlockList");
require("dotenv").config();

// Route: Update or edit user profile.
router.get("/admin", checkBlacklist, fetchUserId, async (req, res) => {

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
router.put("/admin-employee", checkBlacklist, fetchUserId, async (req, res) => {

    try {
        const { employee_id, manager_id } = req.body;

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

        let employeeDocument = await User
            .find({ employee_id: employee_id })
            .select("-password");

        if (!employeeDocument) {
            return res.status(404).json({ msg: "employee not found" });
        }

        let managerDocument = await User
            .find({ employee_id: manager_id })
            .select("-password");

        if (!managerDocument) {
            return res.status(404).json({ msg: "manager not found" });
        }

        // Update the employee's manager
        employeeDocument.manager_id = managerDocument._id;
        await employeeDocument.save();

        res.json({ msg: "Manager updated successfully", employee: employeeDocument });
    } catch (error) {
        console.error("Error during admin data access:", error.message);
        res.status(500).send("Internal server error");
    }
});

// Route: Update existing Task.
router.put("/adminUpdateTask/:id", checkBlacklist, fetchUserId, async (req, res) => {
    try {
        const { title, description, tag, status } = req.body;
        const newTask = {};

        const foundTask = await Task.findById(req.params.id);
        if (!foundTask) {
            return res.status(404).send("The Task is not available");
        }

        if (!foundTask.manager_id) {
            return res.status(404).send("This Task can not be updated");
        }

        if (status) {
            newTask.status = status;
        }
        if (title) {
            newTask.title = title;
        }
        if (description) {
            newTask.description = description;
        }
        if (tag) {
            newTask.tag = tag;
        }


        const updatedTask = await Task.findByIdAndUpdate(
            req.params.id,
            { $set: newTask },
            { new: true }
        );

        res.json(updatedTask);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server error");
    }
});

router.put("/AdminAssignTask/:taskId", checkBlacklist, fetchUserId, async (req, res) => {
    try {
        const { taskId } = req.params
        const { employeeId } = req.body;
        const Admin = await User.findById(req.userId).select("-password");


        if (!Admin) {
            return res.status(404).send("Admin not found");
        }

        if (Admin.role !== "admin") {
            return res.status(403).send("Access denied. Only admin can assign tasks.");
        }

        // Find the employee by employeeId
        const employee = await User.findById(employeeId).select("-password");

        if (!employee) {
            return res.status(404).send("Employee not found");
        }
        // Update the task with assigned user and username
        const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            { assigned_to_id: employeeId, username: employee.name },
            { new: true }
        );

        if (!updatedTask) {
            return res.status(404).send("Task not found");
        }
        // Respond with the updated task
        res.json(updatedTask);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server error");
    }
});


module.exports = router;
