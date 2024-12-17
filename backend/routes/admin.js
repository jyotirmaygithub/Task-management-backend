const express = require("express");
const router = express.Router();
const fetchUserId = require("../middleware/fetchUserId");
const User = require("../models/User");
const Task = require("../models/Task");
const { checkBlacklist } = require("../middleware/tokenBlockList");
const { adminLimiter } = require("../middleware/loginLimiter")
require("dotenv").config();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "605c72ef153207001f14a201"
 *         email:
 *           type: string
 *           example: "admin@company.com"
 *         name:
 *           type: string
 *           example: "John Doe"
 *         role:
 *           type: string
 *           example: "admin"
 *         employee_id:
 *           type: number
 *           example: 12345
 *         manager_id:
 *           type: number
 *           example: 10001
 *     Task:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "60e6a5b5d9c1f80011256e7c"
 *         title:
 *           type: string
 *           example: "Finish quarterly report"
 *         description:
 *           type: string
 *           example: "Complete the quarterly report for Q3 and share it with the team."
 *         tag:
 *           type: string
 *           example: "Report"
 *         status:
 *           type: string
 *           example: "In Progress"
 *         dueDate:
 *           type: string
 *           format: date-time
 *           example: "2024-12-15T23:59:59Z"
 *         manager_id:
 *           type: number
 *           example: 10001
 *         assigned_to_id:
 *           type: number
 *           example: 54321
 *         assigned_to_username:
 *           type: string
 *           example: "Jane Smith"
 */


/**
 * @swagger
 * /api/admin/admin:
 *   get:
 *     summary: Get all tasks and users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The list of tasks and users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fetchingTask:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *                   example:
 *                     - _id: "60e6a5b5d9c1f80011256e7c"
 *                       title: "Finish quarterly report"
 *                       description: "Complete the quarterly report for Q3 and share it with the team."
 *                       tag: "Report"
 *                     - _id: "60e6a5by564tr80011256e7c"
 *                       title: "Excel sheet need to complete"
 *                       description: "collaberate with the manager to complete it."
 *                       tag: "Excel"
 *                 allUsers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                   example:
 *                     - _id: "605c72ef153207001f14a201"
 *                       email: "admin@company.com"
 *                       name: "John Doe"
 *                       role: "admin"
 *                       employee_id: 12345
 *                     - _id: "605c72ef153207001f14a202"
 *                       email: "manager@company.com"
 *                       name: "Sarah Smith"
 *                       role: "manager"
 *                       employee_id: 10001
 *                       manager_id: 12345
 *                     - _id: "605c72ef153207001f14a203"
 *                       email: "employee@company.com"
 *                       name: "Jane Smith"
 *                       role: "employee"
 *                       employee_id: 54321
 *                     - _id: "605c72ef155t401f14a203"
 *                       email: "henry@company.com"
 *                       name: "henry Smith"
 *                       employee_id: 1789
 *       401:
 *         description: Unauthorized access
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Internal server error
 */


// admin route to get all tasks and users on the platform.
router.get("/admin", adminLimiter, checkBlacklist, fetchUserId, async (req, res) => {

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

/**
 * @swagger
 * /api/admin/adminAssignManager:
 *   put:
 *     summary: Assign manager to employee
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []  # This indicates that the token should be passed in the Authorization header
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               employee_id:
 *                 type: number
 *                 example: 1947
 *               manager_id:
 *                 type: number
 *                 example: 1789
 *     responses:
 *       200:
 *         description: Manager updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Manager updated successfully"
 *                 employee:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "605c72ef153207001f14a201"
 *                     email:
 *                       type: string
 *                       example: "employee@company.com"
 *                     name:
 *                       type: string
 *                       example: "Jane Smith"
 *                     role:
 *                       type: string
 *                       example: "employee"
 *                     employee_id:
 *                       type: number
 *                       example: 54321
 *                     manager_id:
 *                       type: number
 *                       example: 10001
 *       401:
 *         description: Unauthorized access
 *       404:
 *         description: Admin, employee, or manager not found
 *       500:
 *         description: Internal server error
 */

// admin route to assign manager to the employee. 
router.put("/adminAssignManager", adminLimiter, checkBlacklist, fetchUserId, async (req, res) => {

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


/**
 * @swagger
 * /api/admin/AdminAssignTask/{taskId}:
 *   put:
 *     summary: Assign task to employee
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: The task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               employeeId:
 *                 type: number
 *                 example: 54321
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
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 tag:
 *                   type: string
 *                 status:
 *                   type: string
 *                 dueDate:
 *                   type: string
 *                 manager_id:
 *                   type: number
 *                 assigned_to_id:
 *                   type: number
 *                 assigned_to_username:
 *                   type: string
 *               example:
 *                 _id: "60e6a5b5d9c1f80011256e7c"
 *                 title: "Finish quarterly report"
 *                 description: "Complete the quarterly report for Q3 and share it with the team."
 *                 tag: "Report"
 *                 status: "In Progress"
 *                 dueDate: "2024-12-15T23:59:59Z"
 *                 manager_id: 10001
 *                 assigned_to_id: 54321
 *                 assigned_to_username: "Jane Smith"
 *       401:
 *         description: Unauthorized access
 *       404:
 *         description: Admin, employee, or task not found
 *       500:
 *         description: Internal server error
 */

// admin route to assign tasks to the employees.
router.put("/AdminAssignTask/:taskId", adminLimiter, checkBlacklist, fetchUserId, async (req, res) => {
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


/**
 * @swagger
 * /api/admin/adminUpdateTask/{id}:
 *   put:
 *     summary: Update existing task
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Updated Task Title"
 *               description:
 *                 type: string
 *                 example: "Updated task description"
 *               status:
 *                 type: string
 *                 example: "Completed"
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-12-20T23:59:59Z"
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               example:
 *                 _id: "60e6a5b5d9c1f80011256e7c"
 *                 title: "Updated Task Title"
 *                 description: "Updated task description"
 *                 tag: "Report"
 *                 status: "Completed"
 *                 dueDate: "2024-12-20T23:59:59Z"
 *                 manager_id: 10001
 *                 assigned_to_id: 54321
 *                 assigned_to_username: "Jane Smith"
 *       401:
 *         description: Unauthorized access
 *       404:
 *         description: Admin or task not found
 *       500:
 *         description: Internal server error
 */
// admin route to update the existing tasks.
router.put("/adminUpdateTask/:id", adminLimiter, checkBlacklist, fetchUserId, async (req, res) => {
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
