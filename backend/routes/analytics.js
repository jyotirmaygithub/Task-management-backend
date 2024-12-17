const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const User = require("../models/User");
const { checkBlacklist } = require("../middleware/tokenBlockList");
const { analyticsLimiter } = require("../middleware/loginLimiter");
const fetchUserId = require("../middleware/fetchUserId");

/**
 * @swagger
 * tags:
 *   name: Analysis
 *   description: Analysis related operations
 */

/**
 * Fetch user document middleware
 */
async function fetchUser(req, res, next) {
    try {
        const userDocument = await User.findById(req.userId).select("-password");
        if (!userDocument) {
            return res.status(404).json({ msg: "User not found" });
        }
        req.userDocument = userDocument;
        next();
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server error");
    }
}

/**
 * @swagger
 * /analytics/employee:
 *   get:
 *     summary: Get task statistics by employee
 *     description: Fetch the task statistics for an employee (completed, pending, and overdue tasks).
 *     tags:
 *       - Analysis
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Task statistics for employee
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 completedTasks:
 *                   type: integer
 *                   description: The number of completed tasks
 *                 pendingTasks:
 *                   type: integer
 *                   description: The number of pending tasks
 *                 overdueTasks:
 *                   type: integer
 *                   description: The number of overdue tasks
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

router.get("/employee", analyticsLimiter, checkBlacklist, fetchUserId, fetchUser, async (req, res) => {
    try {
        const { userDocument } = req;
        const employeeId = userDocument.employee_id;
        
        const completedTasks = await Task.countDocuments({ assigned_to_id: employeeId, status: "completed" });
        const pendingTasks = await Task.countDocuments({ assigned_to_id: employeeId, status: "ongoing" });
        const today = new Date();
        const overdueTasks = await Task.countDocuments({ 
            assigned_to_id: employeeId, 
            status: "ongoing", 
            dueDate: { $lte: today } 
        });

        res.json({ completedTasks, pendingTasks, overdueTasks });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server error");
    }
});

/**
 * @swagger
 * /analytics/manager:
 *   get:
 *     summary: Get task statistics by manager
 *     description: Fetch the task statistics for a manager (completed, pending, and overdue tasks).
 *     tags:
 *       - Analysis
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Task statistics for manager
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 completedTasks:
 *                   type: integer
 *                   description: The number of completed tasks
 *                 pendingTasks:
 *                   type: integer
 *                   description: The number of pending tasks
 *                 overdueTasks:
 *                   type: integer
 *                   description: The number of overdue tasks
 *       404:
 *         description: Manager not found
 *       401:
 *         description: Unauthorized (not a manager)
 *       500:
 *         description: Internal server error
 */

router.get("/manager", analyticsLimiter, checkBlacklist, fetchUserId, fetchUser, async (req, res) => {
    try {
        const { userDocument } = req;

        if (userDocument.role !== "manager") {
            return res.status(401).json({ msg: "Unauthorized access, not a manager" });
        }

        const managerId = userDocument.employee_id;
        const completedTasks = await Task.countDocuments({ manager_id: managerId, status: "completed" });
        const pendingTasks = await Task.countDocuments({ manager_id: managerId, status: "ongoing" });
        const today = new Date();
        const overdueTasks = await Task.countDocuments({ 
            manager_id: managerId, 
            status: "ongoing", 
            dueDate: { $lte: today } 
        });

        res.json({ completedTasks, pendingTasks, overdueTasks });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server error");
    }
});

/**
 * @swagger
 * /analytics/employee/completed-tasks:
 *   get:
 *     summary: Get completed tasks for employee
 *     description: Fetch the completed tasks for an employee.
 *     tags:
 *       - Analysis
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of completed tasks
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
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

router.get("/employee/completed-tasks", analyticsLimiter, checkBlacklist, fetchUserId, fetchUser, async (req, res) => {
    try {
        const { userDocument } = req;
        const completedTasks = await Task.find({ 
            assigned_to_id: userDocument.employee_id, 
            status: "completed" 
        });
        res.json(completedTasks);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server error");
    }
});

/**
 * @swagger
 * /analytics/employee/pending-tasks:
 *   get:
 *     summary: Get pending tasks for employee
 *     description: Fetch the pending tasks for an employee.
 *     tags:
 *       - Analysis
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

router.get("/employee/pending-tasks", analyticsLimiter, checkBlacklist, fetchUserId, fetchUser, async (req, res) => {
    try {
        const { userDocument } = req;
        const pendingTasks = await Task.find({ 
            assigned_to_id: userDocument.employee_id, 
            status: "ongoing" 
        });
        res.json(pendingTasks);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server error");
    }
});

/**
 * @swagger
 * /analytics/employee/overdue-tasks:
 *   get:
 *     summary: Get overdue tasks for employee
 *     description: Fetch the overdue tasks for an employee.
 *     tags:
 *       - Analysis
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of overdue tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

router.get("/employee/overdue-tasks", analyticsLimiter, checkBlacklist, fetchUserId, fetchUser, async (req, res) => {
    try {
        const { userDocument } = req;
        const today = new Date();
        const overdueTasks = await Task.find({ 
            assigned_to_id: userDocument.employee_id, 
            status: "ongoing", 
            dueDate: { $lte: today } 
        });
        res.json(overdueTasks);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server error");
    }
});

/**
 * @swagger
 * /analytics/manager/completed-tasks:
 *   get:
 *     summary: Get completed tasks for manager
 *     description: Fetch the completed tasks for a manager.
 *     tags:
 *       - Analysis
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of completed tasks
 *         content:
 *           application/json:
 *             schema:
 *                type: object
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
 *       404:
 *         description: Manager not found
 *       401:
 *         description: Unauthorized (not a manager)
 *       500:
 *         description: Internal server error
 */

router.get("/manager/completed-tasks", analyticsLimiter, checkBlacklist, fetchUserId, fetchUser, async (req, res) => {
    try {
        const { userDocument } = req;

        if (userDocument.role !== "manager") {
            return res.status(401).json({ msg: "Unauthorized access, not a manager" });
        }

        const completedTasks = await Task.find({ manager_id: userDocument.employee_id, status: "completed" });
        res.json(completedTasks);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server error");
    }
});

/**
 * @swagger
 * /analytics/manager/pending-tasks:
 *   get:
 *     summary: Get pending tasks for manager
 *     description: Fetch the pending tasks for a manager.
 *     tags:
 *       - Analysis
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 *       404:
 *         description: Manager not found
 *       401:
 *         description: Unauthorized (not a manager)
 *       500:
 *         description: Internal server error
 */

router.get("/manager/pending-tasks", analyticsLimiter, checkBlacklist, fetchUserId, fetchUser, async (req, res) => {
    try {
        const { userDocument } = req;

        if (userDocument.role !== "manager") {
            return res.status(401).json({ msg: "Unauthorized access, not a manager" });
        }

        const pendingTasks = await Task.find({ manager_id: userDocument.employee_id, status: "ongoing" });
        res.json(pendingTasks);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server error");
    }
});

/**
 * @swagger
 * /analytics/manager/overdue-tasks:
 *   get:
 *     summary: Get overdue tasks for manager
 *     description: Fetch the overdue tasks for a manager.
 *     tags:
 *       - Analysis
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of overdue tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 *       404:
 *         description: Manager not found
 *       401:
 *         description: Unauthorized (not a manager)
 *       500:
 *         description: Internal server error
 */

router.get("/manager/overdue-tasks", analyticsLimiter, checkBlacklist, fetchUserId, fetchUser, async (req, res) => {
    try {
        const { userDocument } = req;

        if (userDocument.role !== "manager") {
            return res.status(401).json({ msg: "Unauthorized access, not a manager" });
        }

        const today = new Date();
        const overdueTasks = await Task.find({ 
            manager_id: userDocument.employee_id, 
            status: "ongoing", 
            dueDate: { $lte: today } 
        });
        res.json(overdueTasks);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server error");
    }
});

module.exports = router;
