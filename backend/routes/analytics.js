const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const User = require("../models/User");
const { checkBlacklist } = require("../middleware/tokenBlockList");
const fetchUserId = require("../middleware/fetchUserId");

//  Get task statistics by employee.
router.get("/employee", checkBlacklist, fetchUserId, async (req, res) => {
    try {

        let employeeDocument = await User
            .findById({ _id: req.userId })
            .select("-password");

            console.log("employee =",employeeDocument)
        if (!employeeDocument) {
            return res.status(404).json({ msg: "User not found" });
        }
        console.log('employeee id =',employeeDocument.employee_id)
        let fetchingTask = await Task.find({assigned_to_id: employeeDocument.employee_id});
        console.log("tasks =",fetchingTask)

        const completedTasks = await Task.countDocuments({ assigned_to_id: employeeDocument.employee_id, status: "completed" });
        const pendingTasks = await Task.countDocuments({ assigned_to_id: employeeDocument.employee_id, status: "ongoing" });
        const today = new Date();
        const overdueTasks = await Task.countDocuments({ 
            assigned_to_id: employeeDocument.employee_id, 
            status: "ongoing", 
            dueDate: { $lte: today } 
        });

        res.json({ completedTasks, pendingTasks, overdueTasks });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server error");
    }
});

// Get task statistics by manager
router.get("/manager", checkBlacklist, fetchUserId, async (req, res) => {
    try {

        let managerDocument = await User
            .findById({ _id: req.userId })
            .select("-password");

        if (!managerDocument) {
            return res.status(404).json({ msg: "manager not found" });
        }
        if (managerDocument.role !== "manager") {
            console.error(`Unauthorized access not a manager`);
            return res.status(401).json({ msg: "You are not authorized to proceed further" });
        }

        const completedTasks = await Task.countDocuments({ manager_id: managerDocument.employee_id, status: "completed" });
        const pendingTasks = await Task.countDocuments({ manager_id: managerDocument.employee_id, status: "ongoing" });
        const today = new Date();
        const overdueTasks = await Task.countDocuments({ 
            manager_id: managerDocument.employee_id, 
            status: "ongoing", 
            dueDate: { $lte: today } 
        });

        res.json({ completedTasks, pendingTasks, overdueTasks });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server error");
    }
});

// Get completed tasks for employee.
router.get("/employee/completed-tasks", checkBlacklist, fetchUserId, async (req, res) => {
    try {
        let employeeDocument = await User
            .findById({ _id: req.userId })
            .select("-password");

        if (!employeeDocument) {
            return res.status(404).json({ msg: "User not found" });
        }

        const completedTasks = await Task.find({ 
            assigned_to_id: employeeDocument.employee_id, 
            status: "completed" 
        });

        res.json(completedTasks);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server error");
    }
});

// Get pending tasks for employee.
router.get("/employee/pending-tasks", checkBlacklist, fetchUserId, async (req, res) => {
    try {
        let employeeDocument = await User
            .findById({ _id: req.userId })
            .select("-password");

        if (!employeeDocument) {
            return res.status(404).json({ msg: "User not found" });
        }

        const pendingTasks = await Task.find({ 
            assigned_to_id: employeeDocument.employee_id, 
            status: "ongoing" 
        });

        res.json(pendingTasks);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server error");
    }
});

// Get overdue tasks for employee.
router.get("/employee/overdue-tasks", checkBlacklist, fetchUserId, async (req, res) => {
    try {
        let employeeDocument = await User
            .findById({ _id: req.userId })
            .select("-password");

        if (!employeeDocument) {
            return res.status(404).json({ msg: "User not found" });
        }

        const today = new Date();
        const overdueTasks = await Task.find({ 
            assigned_to_id: employeeDocument.employee_id, 
            status: "ongoing", 
            dueDate: { $lte: today } 
        });

        res.json(overdueTasks);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server error");
    }
});

// Get completed tasks for manager.
router.get("/manager/completed-tasks", checkBlacklist, fetchUserId, async (req, res) => {
    try {
        let managerDocument = await User
            .findById({ _id: req.userId })
            .select("-password");

        if (!managerDocument) {
            return res.status(404).json({ msg: "manager not found" });
        }

        if (managerDocument.role !== "manager") {
            console.error(`Unauthorized access not a manager`);
            return res.status(401).json({ msg: "You are not authorized to proceed further" });
        }

        const completedTasks = await Task.find({ 
            manager_id: managerDocument.employee_id, 
            status: "completed" 
        });

        res.json(completedTasks);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server error");
    }
});

// Get pending tasks for manager.
router.get("/manager/pending-tasks", checkBlacklist, fetchUserId, async (req, res) => {
    try {
        let managerDocument = await User
            .findById({ _id: req.userId })
            .select("-password");

        if (!managerDocument) {
            return res.status(404).json({ msg: "manager not found" });
        }

        if (managerDocument.role !== "manager") {
            console.error(`Unauthorized access not a manager`);
            return res.status(401).json({ msg: "You are not authorized to proceed further" });
        }

        const pendingTasks = await Task.find({ 
            manager_id: managerDocument.employee_id, 
            status: "ongoing" 
        });

        res.json(pendingTasks);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server error");
    }
});

// Get overdue tasks for manager.
router.get("/manager/overdue-tasks", checkBlacklist, fetchUserId, async (req, res) => {
    try {
        let managerDocument = await User
            .findById({ _id: req.userId })
            .select("-password");

        if (!managerDocument) {
            return res.status(404).json({ msg: "manager not found" });
        }

        if (managerDocument.role !== "manager") {
            console.error(`Unauthorized access not a manager`);
            return res.status(401).json({ msg: "You are not authorized to proceed further" });
        }

        const today = new Date();
        const overdueTasks = await Task.find({ 
            manager_id: managerDocument.employee_id, 
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
