const express = require("express");
const router = express.Router();
const fetchUserId = require("../middleware/fetchUserId");
const User = require("../models/User");
const Task = require("../models/Task");
const { checkBlacklist } = require("../middleware/tokenBlockList");
const { managerLimiter } = require("../middleware/loginLimiter");
require("dotenv").config();

// route to get tasks and employee specfic to the manager.
router.get("/manager", managerLimiter, checkBlacklist, fetchUserId, async (req, res) => {

    try {
        let managerDocument = await User
            .findById({ _id: req.userId })
            .select("-password");

        if (!managerDocument) {
            return res.status(404).json({ msg: "Manager not found" });
        }
        if (managerDocument.role !== "manager") {
            console.error(`Unauthorized role: User role ${managerDocument.role} does not match required role`);
            return res.status(401).json({ msg: "You are not an authorized manager to get the data" });
        }

        const employeesUnderManager = await User.find({ manager_id: managerDocument.employee_id });
        const tasksUnderManager = await Task.find({ manager_id: managerDocument.employee_id });

        res.json({ employeesUnderManager, tasksUnderManager });
    } catch (error) {
        console.error("Error during manager data access", error.message);
        res.status(500).send("Internal server error");
    }
});

// manager to update or change employee role.
router.put("/updateEmployee/:employeeId", managerLimiter, checkBlacklist, fetchUserId, async (req, res) => {
    const { employeeId } = req.params;
    const { employeeRole } = req.body;

    try {
        const employeeToUpdate = await User.findById(employeeId).select("-password");
        let managerDocument = await User
            .findById({ _id: req.userId })
            .select("-password");

        if (!employeeToUpdate) {
            console.log("Employee not found:");
            return res.status(404).json({ message: "Employee not found" });
        }
        if (!managerDocument) {
            console.log("manager not found:", managerDocument);
            return res.status(404).json({ message: "manager not found" });
        }

        if (managerDocument.role !== "manager") {
            console.log("Unauthorized update attempt by user:", managerDocument.role);
            return res.status(403).json({ message: "You are not authorized to update this user not a manager" });
        }
        if (managerDocument.employee_id == employeeToUpdate.employee_id) {
            console.log("Unauthorized update attempt by user:");
            return res.status(403).json({ message: "You are not authorized to update this user" });
        }

        const updatedFields = {};
        if (employeeRole) updatedFields.role = employeeRole;

        const updatedUser = await User.findByIdAndUpdate(employeeId, { $set: updatedFields }, { new: true });
        res.json(updatedUser);
    } catch (error) {
        console.error("Error updating user:", error.message);
        res.status(500).send("Internal server error");
    }
});

// manager to update the task.
router.put("/managerUpdateTask/:id", managerLimiter, checkBlacklist, fetchUserId, async (req, res) => {
    try {
        const { title, description, tag, status, dueDate } = req.body;
        const newTask = {};

        let managerDocument = await User
            .findById({ _id: req.userId })
            .select("-password");

        if (!managerDocument) {
            console.error(`Manager with ID not found`);
            return res.status(404).json({ msg: "Manager not found" });
        }

        if (managerDocument.role !== "manager") {
            console.error(`Unauthorized access not a manager`);
            return res.status(401).json({ msg: "You are not authorized to proceed further as a manager" });
        }

        const foundTask = await Task.findById(req.params.id);
        if (!foundTask) {
            return res.status(404).send("The Task is not available");
        }
        if (!foundTask.manager_id) {
            return res.status(404).send("This Task can not be updated");
        }
        if (foundTask.manager_id && foundTask.manager_id !== managerDocument.employee_id) {
            return res.status(404).send("This manager is not authorized to update this task");
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
        if (dueDate) {
            newTask.dueDate = dueDate;
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

// manager to assign task to the employee.
router.put("/assignTask/:taskId", managerLimiter, checkBlacklist, fetchUserId, async (req, res) => {
    try {
        const { taskId } = req.params;
        const { employeeId } = req.body;

        const manager = await User.findById(req.userId).select("-password");

        if (!manager) {
            return res.status(404).send("Manager not found");
        }
        if (manager.role !== "manager") {
            return res.status(403).send("Access denied. Only managers can assign tasks.");
        }

        const employee = await User.findOne({ employee_id: employeeId }).select("-password");
        if (!employee) {
            return res.status(404).send("Employee not found");
        }

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).send("Task not found");
        }
        if (task.manager_id && task.manager_id !== manager.employee_id) {
            return res.status(403).send("You are not authorized to update this task.");
        }

        task.manager_id = manager.employee_id;
        task.assigned_to_id = employeeId;
        task.assigned_to_username = employee.name;

        await task.save();
        res.json(task);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server error");
    }
});

module.exports = router;
