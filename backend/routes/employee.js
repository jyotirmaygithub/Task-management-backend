const express = require("express");
const router = express.Router();
const fetchUserId = require("../middleware/fetchUserId");
const User = require("../models/User");
const Task = require("../models/Task");
const { checkBlacklist } = require("../middleware/tokenBlockList");
const { employeeLimiter } = require("../middleware/loginLimiter")
require("dotenv").config();


/**
 * @swagger
 * tags:
 *   name: Employee
 *   description: Employee related operations
 */


/**
 * @swagger
 * /api/employee/employee:
 *   get:
 *     summary: Get employee profile and their assigned tasks.
 *     tags: [Employee]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Employee profile and assigned tasks retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user_data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "605c72ef155t401f14a203"
 *                     email:
 *                       type: string
 *                       example: "henry@company.com"
 *                     name:
 *                       type: string
 *                       example: "henry Smith"
 *                     role:
 *                       type: string
 *                       example: "intern"
 *                     employee_id:
 *                       type: number
 *                       example: 1789
 *                     manager_id:
 *                       type: number
 *                       example: 10001
 *                 userTasks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "60e6a5by564tr80011256e7c"
 *                       title:
 *                         type: string
 *                         example: "Excel sheet need to complete"
 *                       description:
 *                         type: string
 *                         example: "collaberate with the manager to complete it."
 *                       tag:
 *                         type: string
 *                         example: "Excel"  
 *                       manager_id:
 *                         type: number
 *                         example: 10001
 *                       assigned_to_id:
 *                         type: number
 *                         example: 1789
 *                       assigned_to_username:
 *                         type: string
 *                         example: "henry Smith"
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Internal server error
 */

// to get their profile and assigned tasks.
router.get("/employee", employeeLimiter, checkBlacklist, fetchUserId, async (req, res) => {

    try {
        let employeeDocument = await User
            .findById({ _id: req.userId })
            .select("-password");

        if (!employeeDocument) {
            return res.status(404).send("Employee not found");
        }

        let taskDocument = await Task.find({ assigned_to_id: employeeDocument.employee_id })
        res.json({ user_data: employeeDocument, userTasks: taskDocument });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server Error Occured");
    }
});



/**
 * @swagger
 * /api/employee/employeeUpdateTask/{id}:
 *   put:
 *     summary: Update the status of a task by the assigned employee.
 *     tags: [Employee]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the task to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: "completed"
 *     responses:
 *       200:
 *         description: Task status updated successfully.
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
 *                   example: "collaborate with the manager to complete it."
 *                 tag:
 *                   type: string
 *                   example: "Excel"
 *                 status:
 *                   type: string
 *                   example: "completed"
 *                 manager_id:
 *                   type: number
 *                   example: 10001
 *                 assigned_to_id:
 *                   type: number
 *                   example: 1789
 *                 assigned_to_username:
 *                   type: string
 *                   example: "henry Smith"
 *       400:
 *         description: Invalid status
 *       403:
 *         description: Unauthorized to update this task
 *       404:
 *         description: Task or employee not found
 *       500:
 *         description: Internal server error
 */
// to update status of the task by the assigned employee.
router.put("/employeeUpdateTask/:id", employeeLimiter, checkBlacklist, fetchUserId, async (req, res) => {
    try {
        const { status } = req.body;
        const newTask = {};

        let employeeDocument = await User
            .findById({ _id: req.userId })
            .select("-password");

        if (!employeeDocument) {
            console.error(`Employee with ID not found`);
            return res.status(404).json({ msg: "Employee not found" });
        }

        const foundTask = await Task.findById(req.params.id);
        if (!foundTask) {
            return res.status(404).send("The Task is not available");
        }
        if (foundTask.assigned_to_id !== employeeDocument.employee_id) {
            return res.status(403).send("You are not authorized to update this task");
        }
        if (status !== "completed" && status !== "ongoing") {
            return res.status(400).send("Invalid status");
        }
        if (status) {
            newTask.status = status;
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
 * /api/employee/employeeUpdate:
 *   put:
 *     summary: Update employee profile with restricted fields.
 *     tags: [Employee]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Henry Gupta"
 *               aboutSelf:
 *                 type: string
 *                 example: "I am a dedicated employee with a passion for data analysis."
 *     responses:
 *       200:
 *         description: Employee profile updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: "605c72ef155t401f14a203"
 *                 email:
 *                   type: string
 *                   example: "henry@company.com"
 *                 name:
 *                   type: string
 *                   example: "Henry Gupta"
 *                 role:
 *                   type: string
 *                   example: "intern"
 *                 employee_id:
 *                   type: number
 *                   example: 1789
 *                 manager_id:
 *                   type: number
 *                   example: 10001
 *                 aboutSelf:
 *                   type: string
 *                   example: "I am a dedicated employee with a passion for data analysis."
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Internal server error
 */

// employee to update itself with restricted fields.
router.put("/employeeUpdate", employeeLimiter, checkBlacklist, fetchUserId, async (req, res) => {
    try {
        const { name, aboutself } = req.body;
        const userDetails = {};

        let employeeDocument = await User
            .findById({ _id: req.userId })
            .select("-password");

        if (!employeeDocument) {
            console.error(`Employee with ID not found`);
            return res.status(404).json({ msg: "Employee not found" });
        }

        if (name) {
            userDetails.name = name;
        }
        if (aboutself) {
            userDetails.aboutSelf = aboutself;
        }
        const userupdate = await Task.findByIdAndUpdate(
            req.userId,
            { $set: userDetails },
            { new: true }
        );

        res.json(userupdate);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server error");
    }
});

module.exports = router;
