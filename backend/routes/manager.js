const express = require("express");
const router = express.Router();
const fetchUserId = require("../middleware/fetchUserId");
const User = require("../models/User");
const Task = require("../models/Task");
const { checkBlacklist } = require("../middleware/tokenBlockList");
const { managerLimiter } = require("../middleware/loginLimiter");
require("dotenv").config();


/**
 * @swagger
 * tags:
 *   name: Manager
 *   description: Manager related operations
 */

/**
 * @swagger
 * /api/manager/manager:
 *   get:
 *     summary: Get tasks and employees specific to the manager.
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of employees and tasks under the manager.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 employeesUnderManager:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "605c72ef153207001f14a203"
 *                       email:
 *                         type: string
 *                         example: "employee@company.com"
 *                       name:
 *                         type: string
 *                         example: "Jane Smith"
 *                       role:
 *                         type: string
 *                         example: "employee"
 *                       employee_id:
 *                         type: number
 *                         example: 54321
 *                       manager_id:
 *                         type: number
 *                         example: 10001
 *                 tasksUnderManager:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "60e6a5b5d9c1f80011256e7c"
 *                       title:
 *                         type: string
 *                         example: "Updated Task Title"
 *                       description:
 *                         type: string
 *                         example: "Updated task description"
 *                       tag:
 *                         type: string
 *                         example: "Report"
 *                       status:
 *                         type: string
 *                         example: "Completed"
 *                       dueDate:
 *                         type: string
 *                         example: "2024-12-20T23:59:59Z"
 *                       manager_id:
 *                         type: number
 *                         example: 10001
 *                       assigned_to_id:
 *                         type: number
 *                         example: 54321
 *                       assigned_to_username:
 *                         type: string
 *                         example: "Jane Smith"
 *       401:
 *         description: Unauthorized access
 *       404:
 *         description: Manager not found
 *       500:
 *         description: Internal server error
 */

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



/**
 * @swagger
 * /api/manager/updateEmployee/{employeeId}:
 *   put:
 *     summary: Manager to update or change employee role.
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: employeeId
 *         in: path
 *         required: true
 *         description: ID of the employee to be updated
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 example: "intern"
 *     responses:
 *       200:
 *         description: Employee updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: "605c72ef155t401f14a203"
 *                 name:
 *                   type: string
 *                   example: "Henry Smith"
 *                 email:
 *                   type: string
 *                   example: "henry@company.com"
 *                 role:
 *                   type: string
 *                   example: "intern"
 *                 employee_id:
 *                   type: number
 *                   example: 1789
 *                 manager_id:
 *                   type: number
 *                   example: 10001
 *       403:
 *         description: Unauthorized update attempt
 *       404:
 *         description: Employee or manager not found
 *       500:
 *         description: Internal server error
 */

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


/**
 * @swagger
 * /api/manager/managerUpdateTask/{id}:
 *   put:
 *     summary: Manager to update the task.
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the task to be updated
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Complete Project A"
 *               description:
 *                 type: string
 *                 example: "Complete the final review and submission of Project A."
 *               status:
 *                 type: string
 *                 example: "in-progress"
 *               dueDate:
 *                 type: string
 *                 example: "2024-12-31"
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: "60e6a5b5d9c1f80011256e7c"
 *                 title:
 *                   type: string
 *                   example: "Complete Project A"
 *                 description:
 *                   type: string
 *                   example: "Complete the final review and submission of Project A."
 *                 tag:
 *                   type: string
 *                   example: "Report"
 *                 status:
 *                   type: string
 *                   example: "in-progress"
 *                 dueDate:
 *                   type: string
 *                   example: "2024-12-31T23:59:59Z"
 *                 manager_id:
 *                   type: number
 *                   example: 10001
 *                 assigned_to_id:
 *                   type: number
 *                   example: 54321
 *                 assigned_to_username:
 *                   type: string
 *                   example: "Jane Smith"
 *       403:
 *         description: Unauthorized access
 *       404:
 *         description: Task not found
 *       500:
 *         description: Internal server error
 */

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


/**
 * @swagger
 * /api/manager/assignTask/{taskId}:
 *   put:
 *     summary: Manager to assign task to an employee.
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: taskId
 *         in: path
 *         required: true
 *         description: ID of the task to be assigned
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               employee_id:
 *                 type: number
 *                 example: 1789
 *     responses:
 *       200:
 *         description: Task assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: "60e6a5by564tr80011256e7c"
 *                 title:
 *                   type: string
 *                   example: "Excel sheet need to complete"
 *                 description:
 *                   type: string
 *                   example: "collaberate with the manager to complete it."
 *                 tag:
 *                   type: string
 *                   example: "Excel"
 *                 manager_id:
 *                   type: number
 *                   example: 10001
 *                 assigned_to_id:
 *                   type: number
 *                   example: 1789
 *                 assigned_to_username:
 *                   type: string
 *                   example: "henry Smith"
 *       403:
 *         description: Unauthorized access
 *       404:
 *         description: Task, manager, or employee not found
 *       500:
 *         description: Internal server error
 */

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
