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

module.exports = router;
