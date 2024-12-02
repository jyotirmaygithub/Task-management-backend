const express = require("express");
const router = express.Router();
const fetchUserId = require("../middleware/fetchUserId");
const Task = require("../models/Task");
const User = require("../models/User");

// Route: Fetch existing tasks.
router.get("/tasks", fetchUserId, async (req, res) => {
  try {
    const fetchingTask = await Task.find();
    res.send(fetchingTask);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Error related to fetch tasks");
  }
});

// Route: Create task.
router.post("/addtask", fetchUserId, async (req, res) => {
  try {
    const username = await User.findById(req.userId).select("-password");

    const creatingTask = await Task.create({
      user: req.userId,
      username: username.name,
      title: req.body.title,
      description: req.body.description,
      tag: req.body.tag,
    });

    res.send(creatingTask);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
});

// Route: Update existing Task.
router.put("/updateTask/:id", fetchUserId, async (req, res) => {
  try {
    const { title, description, tag } = req.body;
    const newTask = {};
    if (title) {
      newTask.title = title;
    }
    if (description) {
      newTask.description = description;
    }
    if (tag) {
      newTask.tag = tag;
    }

    const foundTask = await Task.findById(req.params.id);
    if (!foundTask) {
      return res.status(404).send("The Task is not available");
    }

    if (foundTask.user.toString() !== req.userId) {
      return res.status(401).send("You are not authorized to");
    }

    await Task.findByIdAndUpdate(
      req.params.id,
      { $set: newTask },
      { new: true }
    );
    res.json(newTask);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
});

// Route: Delete existing Task.
router.delete("/deleteTask/:id", fetchUserId, async (req, res) => {
  try {
    const foundTask = await Task.findById(req.params.id);
    if (!foundTask) {
      return res.status(404).send("The Task is not available");
    }

    if (foundTask.user.toString() !== req.userId) {
      return res.status(401).send("You are not authorized to");
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ Success: "Task has been deleted ", foundTask: foundTask });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
});

// Route : To assign task to the users.
router.put("/assignTask/:id", fetchUserId, async (req, res) => {
  try {
    const userDocument = await User.findById(req.userId).select("-password");

    // Update the task with assigned user and username
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { assignedUser: req.userId, assignedTo: userDocument.name },
      { new: true }
    );
    // Respond with the updated task
    res.json(updatedTask);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
});

module.exports = router;
