const express = require("express");
const router = express.Router();
const fetchUserId = require("../middleware/fetchUserId");
const User = require("../models/User");
const Task = require("../models/Task");
const { checkBlacklist } = require("../middleware/tokenBlockList");
require("dotenv").config();

// admin route to get all tasks and users on the platform.
router.get("/admin", checkBlacklist, fetchUserId, async (req, res) => {

    try {
        let adminDocument = await User
            .findById({ _id: req.userId })
            .select("-password");

        if (!adminDocument) {
            console.error(`Admin with ID not found`);
            return res.status(404).json({ msg: "Admin not found" });
        }
        if (adminDocument.email !== process.env.MYEMAIL) {
            console.error(`Unauthorized access: User email ${adminDocument.email} does not match admin email`);
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

// admin route to assign manager to the employee. 
router.put("/adminAssignManager", checkBlacklist, fetchUserId, async (req, res) => {

    try {
        const { employee_id, manager_id } = req.body;

        let adminDocument = await User
            .findById({ _id: req.userId })
            .select("-password");

        if (!adminDocument) {
            console.error(`Admin with ID not found`);
            return res.status(404).json({ msg: "Admin not found" });
        }
        if (adminDocument.email !== process.env.MYEMAIL) {
            console.error(`Unauthorized access: User email ${adminDocument.email} does not match admin email`);
            return res.status(401).json({ msg: "You are not authorized to proceed further" });
        }

        let employeeDocument = await User
            .findOne({ employee_id: employee_id })
            .select("-password");

        if (!employeeDocument) {
            return res.status(404).json({ msg: "employee not found" });
        }

        let managerDocument = await User
            .findOne({ employee_id: manager_id })
            .select("-password");

        if (!managerDocument) {
            return res.status(404).json({ msg: "manager not found" });
        }
        if (managerDocument.role !== "manager") {
            return res.status(404).json({ msg: "you are not authorized to become manager of an employee" });
        }

        employeeDocument.manager_id = managerDocument.employee_id;
        await employeeDocument.save();

        res.json({ msg: "Manager updated successfully", employee: employeeDocument });
    } catch (error) {
        console.error("Error during admin data access:", error.message);
        res.status(500).send("Internal server error");
    }
});

// admin route to assign tasks to the employees.
router.put("/AdminAssignTask/:taskId", checkBlacklist, fetchUserId, async (req, res) => {
    try {
        const { taskId } = req.params
        const { employeeId } = req.body;
        const adminDocument = await User.findById(req.userId).select("-password");

        if (!adminDocument) {
            return res.status(404).send("Admin not found");
        }
        if (adminDocument.email !== process.env.MYEMAIL) {
            console.error(`Unauthorized access: User email ${adminDocument.email} does not match admin email`);
            return res.status(401).json({ msg: "You are not authorized to proceed further" });
        }

        const employee = await User.findOne({ employee_id: employeeId }).select("-password");

        if (!employee) {
            return res.status(404).send("Employee not found");
        }
        const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            { manager_id: adminDocument.employee_id, assigned_to_id: employeeId, assigned_to_username: employee.name },
            { new: true }
        );

        if (!updatedTask) {
            return res.status(404).send("Task not found");
        }
        res.json(updatedTask);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server error");
    }
});

// admin route to update the existing tasks.
router.put("/adminUpdateTask/:id", checkBlacklist, fetchUserId, async (req, res) => {
    try {
        const { title, description, tag, status, dueDate } = req.body;
        const newTask = {};

        let adminDocument = await User
            .findById({ _id: req.userId })
            .select("-password");

        if (!adminDocument) {
            console.error(`User with ID not found`);
            return res.status(404).json({ msg: "Admin not found" });
        }
        if (adminDocument.email !== process.env.MYEMAIL) {
            console.error(`Unauthorized access: User email ${adminDocument.email} does not match admin email`);
            return res.status(401).json({ msg: "You are not authorized to proceed further" });
        }

        const foundTask = await Task.findById(req.params.id);

        if (!foundTask) {
            return res.status(404).send("The Task is not available");
        }
        if (!foundTask.manager_id) {
            return res.status(404).send(" Not authorized to update this task");
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

module.exports = router;
