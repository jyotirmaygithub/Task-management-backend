const express = require("express");
const router = express.Router();
const fetchUserId = require("../middleware/fetchUserId");
const User = require("../models/User");
const Task = require("../models/Task");
const { checkBlacklist } = require("../middleware/tokenBlockList");
require("dotenv").config();

router.get("/manager", checkBlacklist, fetchUserId, async (req, res) => {

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

        // Fetch all employees under the manager
        const employeesUnderManager = await User.find({ manager_id: managerDocument.employee_id });
        const tasksUnderManager = await Task.find({ manager_id: managerDocument.employee_id });

        res.json({ employeesUnderManager, tasksUnderManager });
    } catch (error) {
        console.error("Error during manager data access", error.message);
        res.status(500).send("Internal server error");
    }
});


router.put("/updateEmployee/:employeeId", checkBlacklist, fetchUserId, async (req, res) => {
    const { employeeId } = req.params;
    const { employeeRole } = req.body; // Fields the manager is allowed to update

    console.log("Request to update user:", employeeId);  // Log the user ID for the update request

    try {
        // Fetch the user to be updated
        const employeeToUpdate = await User.findById(employeeId).select("-password");
        let managerDocument = await User
            .findById({ _id: req.userId })
            .select("-password");

        // Check if the user exists
        if (!employeeToUpdate) {
            console.log("Employee not found:");
            return res.status(404).json({ message: "Employee not found" });
        }

        if (!managerDocument) {
            console.log("manager not found:", managerDocument);
            return res.status(404).json({ message: "manager not found" });
        }

        console.log("manager document = ", managerDocument);

        console.log("role = ", managerDocument.role);
        if (managerDocument.role !== "manager") {
            console.log("Unauthorized update attempt by user:", managerDocument.role);
            return res.status(403).json({ message: "You are not authorized to update this user not a manager" });
        }
        console.log('manage id =', managerDocument);
        console.log("employee = ", employeeToUpdate)

        if (managerDocument.employee_id == employeeToUpdate.employee_id) {
            console.log("Unauthorized update attempt by user:");
            return res.status(403).json({ message: "You are not authorized to update this user" });
        }


        const updatedFields = {};
        console.log(updatedFields)
        if (employeeRole) updatedFields.role = employeeRole;
        console.log("Fields to update:", updatedFields);

        // Update the user document with new values
        const updatedUser = await User.findByIdAndUpdate(employeeId, { $set: updatedFields }, { new: true });

        console.log("Updated user:", updatedUser);

        res.json(updatedUser);
    } catch (error) {
        console.error("Error updating user:", error.message);
        res.status(500).send("Internal server error");
    }
});

router.put("/managerUpdateTask/:id", checkBlacklist, fetchUserId, async (req, res) => {
    try {
        const { title, description, tag, status, due_date } = req.body;
        const newTask = {};

        let managerDocument = await User
            .findById({ _id: req.userId })
            .select("-password");

        if (!managerDocument) {
            console.error(`Manager with ID not found`);
            return res.status(404).json({ msg: "Manager not found" });
        }

        // Check if the user's email matches the admin email
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
        if (due_date) {
            newTask.dueDate = due_date;
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

router.put("/assignTask/:taskId", checkBlacklist, fetchUserId, async (req, res) => {
    try {
        const { taskId } = req.params;
        const { employeeId } = req.body;
        
        // Fetch the manager making the request
        const manager = await User.findById(req.userId).select("-password");

        if (!manager) {
            return res.status(404).send("Manager not found");
        }

        if (manager.role !== "manager") {
            return res.status(403).send("Access denied. Only managers can assign tasks.");
        }

        // Find the employee by employeeId
        const employee = await User.findOne({ employee_id: employeeId }).select("-password");
        console.log("empty =",employee)
        if (!employee) {
            return res.status(404).send("Employee not found");
        }

        // Fetch the task to be updated
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).send("Task not found");
        }
        console.log("task =",task.manager_id);
        console.log("mana = ",manager.employee_id)

        // Check if the task has an existing manager and if the manager_id matches
        if (task.manager_id && task.manager_id !== manager.employee_id) {
            return res.status(403).send("You are not authorized to update this task.");
        }

        // Update the task with assigned user and username
        task.manager_id = manager.employee_id;
        task.assigned_to_id = employeeId;
        task.assigned_to_username = employee.name;
        
        // Save the updated task
        await task.save();

        // Respond with the updated task
        res.json(task);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server error");
    }
});




module.exports = router;
