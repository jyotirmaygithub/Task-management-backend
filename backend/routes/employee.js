const express = require("express");
const router = express.Router();
const fetchUserId = require("../middleware/fetchUserId");
const User = require("../models/User");
const Task = require("../models/Task");
const { checkBlacklist } = require("../middleware/tokenBlockList");
require("dotenv").config();


router.get("/employee", checkBlacklist, fetchUserId, async (req, res) => {
    console.log("is it working or not")
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
        // throw errors.
        console.error(error.message);
        res.status(500).send("Internal server Error Occured");
    }
});


router.put("/employeeUpdateTask/:id", checkBlacklist, fetchUserId, async (req, res) => {
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
        console.log(foundTask.assigned_to_id)
        if (foundTask.assigned_to_id !== employeeDocument.employee_id) {
            return res.status(403).send("You are not authorized to update this task");
        }

        console.log("status =",status)
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
// route to update itself.


router.put("/employeeUpdate", checkBlacklist, fetchUserId, async (req, res) => {
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
