const express = require("express");
const router = express.Router();
const fetchUserId = require("../middleware/fetchUserId");
const Task = require("../models/Task");
const User = require("../models/User");
const { checkBlacklist } = require("../middleware/tokenBlockList");

// Route: Fetch existing tasks.
router.get("/tasks", checkBlacklist, fetchUserId, async (req, res) => {
  try {
    const fetchingTask = await Task.find();
    res.send(fetchingTask);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Error related to fetch tasks");
  }
});

// Route: Create task.
router.post("/createTask", checkBlacklist, fetchUserId, async (req, res) => {
  try {
    console.log("function is running")
    const { assigned_to_id, title, description, tag } = req.body;

    // Fetch the user creating the task
    const userCreatingTask = await User.findById(req.userId).select("-password");
    const employeeDocument = await User.find({ employee_id: assigned_to_id }).select("-password");
    if (!userCreatingTask) {
      return res.status(401).json({ msg: "User does not exist!" });
    }

    console.log("user = ", userCreatingTask);
    console.log("employee = ", employeeDocument);

    if (assigned_to_id && !employeeDocument) {
      return res.status(401).json({ msg: "employee does not exist!" });
    }

    if (assigned_to_id && userCreatingTask.role !== "manager") {
      return res.status(401).json({ msg: "You are not an authorized manager" });
    }


    console.log("userCreatingTask = ", userCreatingTask)

    // Create the task
    const creatingTask = await Task.create({
      owner: req.userId,
      username: userCreatingTask.name,
      manager_id: userCreatingTask.employee_id,
      assigned_to_id: assigned_to_id,
      title,
      description,
      tag,
    });

    res.send(creatingTask);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
});


// Route: Update existing Task.
router.put("/updateTask/:id", checkBlacklist, fetchUserId, async (req, res) => {
  try {
    const { employee_id, title, description, tag, status } = req.body;
    const newTask = {};

    if (status) {
      newTask.status = status;
    }

    const foundTask = await Task.findById(req.params.id);
    if (!foundTask) {
      return res.status(404).send("The Task is not available");
    }

    // Check if the user is the manager or the task owner
    const isManager = foundTask.manager_id === employee_id;
    const isEmployee = foundTask.assigned_to_id === employee_id;

    if (!isManager && !isEmployee) {
      return res.status(401).send("You are not authorized to update this task");
    }

    // Allow managers to update all fields, but task owners can only update the status
    if (isManager) {
      if (title) {
        newTask.title = title;
      }
      if (description) {
        newTask.description = description;
      }
      if (tag) {
        newTask.tag = tag;
      }
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

// Route: Delete existing Task.
router.delete("/deleteTask/:id", checkBlacklist, fetchUserId, async (req, res) => {
  try {
    const foundTask = await Task.findById(req.params.id);
    if (!foundTask) {
      return res.status(404).send("The Task is not available");
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ success: "Task has been deleted", foundTask: foundTask });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
});

module.exports = router;
