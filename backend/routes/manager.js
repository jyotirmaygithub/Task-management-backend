const express = require("express");
const router = express.Router();
const fetchUserId = require("../middleware/fetchUserId");
const User = require("../models/User");
const Task = require("../models/Task");
const loginLimiter = require("../middleware/loginLimiter");
const { checkBlacklist } = require("../middleware/tokenBlockList");
require("dotenv").config();

router.get("/manager", checkBlacklist, fetchUserId, async (req, res) => {

    try {
        let managerDocument = await User
            .findById({ _id: req.userId })
            .select("-password");

        if (!managerDocument) {
            return res.status(404).json({ msg: "User not found" });
        }

        if (managerDocument.role !== "manager") {
            console.error(`Unauthorized role: User role ${managerDocument.role} does not match required role ${role}`);
            return res.status(401).json({ msg: "You are not an authorized manager to get the data" });
        }

        // Fetch all employees under the manager
        const employeesUnderManager = await User.find({ manager_id: managerDocument.employee_id });
        const tasksUnderManager = await Task.find({ manager_id: managerDocument.employee_id });

        res.json({ employeesUnderManager, tasksUnderManager });
    } catch (error) {
        console.error("Error during manager data access", error.message);
        res.status(500).send("Internal server error");
    }
});

router.put("/updateUser/:userId", checkBlacklist, fetchUserId, async (req, res) => {
    const { userId } = req.params;
    const { employeeRole, manager_id } = req.body; // Fields the manager is allowed to update

    console.log("Request to update user:", userId);  // Log the user ID for the update request

    try {
        // Fetch the user to be updated
        const userToUpdate = await User.findById(userId).select("-password");
        let managerDocument = await User
            .findById({ _id: req.userId })
            .select("-password");

        // Check if the user exists
        if (!userToUpdate) {
            console.log("User not found:", userId);
            return res.status(404).json({ message: "User not found" });
        }

        if (!managerDocument) {
            console.log("manager not found:", managerDocument);
            return res.status(404).json({ message: "manager not found" });
        }

        console.log("User found:", userToUpdate);
        console.log("manager document = ", managerDocument);

        console.log("role = ", managerDocument.role);
        if (managerDocument.role !== "manager") {
            console.log("Unauthorized update attempt by user:", managerDocument.role);
            return res.status(403).json({ message: "You are not authorized to update this user" });
        }

        console.log('manage id =', manager_id);
        console.log('manage id =', managerDocument.employee_id);

        if (managerDocument.employee_id !== manager_id) {
            console.log("Unauthorized update attempt by user:", manager_id);
            return res.status(403).json({ message: "You are not authorized to update this user" });
        }

        // Check if the manager_id is provided and is valid
        if (manager_id && isNaN(manager_id)) {
            console.log("Invalid manager_id provided:", manager_id);
            return res.status(400).json({ message: "Manager ID must be a number" });
        }

        // Update only the allowed fields
        const updatedFields = {};
        if (role) updatedFields.role = employeeRole;
        if (manager_id) updatedFields.manager_id = manager_id;

        console.log("Fields to update:", updatedFields);

        // Update the user document with new values
        const updatedUser = await User.findByIdAndUpdate(userId, updatedFields, { new: true });

        console.log("Updated user:", updatedUser);

        res.json(updatedUser);
    } catch (error) {
        console.error("Error updating user:", error.message);
        res.status(500).send("Internal server error");
    }
});


router.put("/assignTask/:taskId", checkBlacklist, fetchUserId, async (req, res) => {
    try {
        const { taskId } = req.params
        const { employeeId } = req.body;
        const manager = await User.findById(req.userId).select("-password");


        if (!manager) {
            return res.status(404).send("Manager not found");
        }

        if (manager.role !== "manager") {
            return res.status(403).send("Access denied. Only managers can assign tasks.");
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
