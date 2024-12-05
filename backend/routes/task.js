const express = require("express");
const router = express.Router();
const fetchUserId = require("../middleware/fetchUserId");
const Task = require("../models/Task");
const User = require("../models/User");
const { checkBlacklist } = require("../middleware/tokenBlockList");

// get the tasks by using the filters and sorting.
router.get("/tasks", checkBlacklist, fetchUserId, async (req, res) => {
  try {
    const { status, sortBy, order } = req.body;

    const query = {};
    if (status) {
      if (status === 'completed') {
        query.status = 'completed';
      } else if (status === 'ongoing') {
        query.status = 'ongoing';
      } else if (status === 'overdue') {
        query.status = 'ongoing'; 
        query.dueDate = { $lt: new Date() };
      }
    }

    const sortOptions = {};
    if (sortBy) {
      sortOptions[sortBy] = order === 'desc' ? -1 : 1; 
    }

    const tasks = await Task.find(query).sort(sortOptions);

    res.json(tasks);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Error related to fetch tasks");
  }
});

// create tasks.
router.post("/createTask", checkBlacklist, fetchUserId, async (req, res) => {
  try {
    const { assigned_to_id, title, description, tag, due_date } = req.body;

    const userCreatingTask = await User.findById(req.userId).select("-password");
    if (!userCreatingTask) {
      return res.status(401).json({ msg: "User does not exist!" });
    }

    let employeeDocument = null;
    if (assigned_to_id) {
      employeeDocument = await User.findOne({ employee_id: assigned_to_id }).select("-password");
      if (!employeeDocument) {
        return res.status(401).json({ msg: "Employee does not exist!" });
      }

      if (userCreatingTask.role !== "manager" && userCreatingTask.role !== "admin") {
        return res.status(401).json({ msg: "You are not an authorized manager" });
      }
    }

    const taskData = {
      owner: req.userId,
      username: userCreatingTask.name,
      title,
      description,
      tag,
    };

    if (assigned_to_id) {
      taskData.manager_id = userCreatingTask.employee_id;
      taskData.assigned_to_id = assigned_to_id;
      taskData.assigned_to_username = employeeDocument.name;
    }

    if (due_date) {
      taskData.dueDate = due_date;
    }

    const creatingTask = await Task.create(taskData);

    res.send(creatingTask);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
});

// delete task
router.delete("/deleteTask/:id", checkBlacklist, fetchUserId, async (req, res) => {
  try {

    const document = await User.findById(req.userId).select("-password");
    if (!document) {
      return res.status(401).json({ msg: "User does not exist!" });
    }

    if (document.role !== "manager" && document.role !== "admin") {
      return res.status(401).json({ msg: "You are not an authorized to delete" });
    }
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
