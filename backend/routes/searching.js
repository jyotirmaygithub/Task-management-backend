const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const { checkBlacklist } = require("../middleware/tokenBlockList");
const fetchUserId = require("../middleware/fetchUserId");

// route to search.
router.post("/search-tasks", checkBlacklist, fetchUserId, async (req, res) => {
  try {
    const { q } = req.body;

    if (!q) {
      return res.status(400).json({ msg: "Search query is required" });
    }

    const searchQuery = {
      $or: [
        { title: { $regex: q, $options: "i" } },       
        { description: { $regex: q, $options: "i" } },  
        { status: { $regex: q, $options: "i" } },       
        { tag: { $regex: q, $options: "i" } },         
        { assigned_to_username: { $regex: q, $options: "i" } } 
      ]
    };

    const tasks = await Task.find(searchQuery);

    res.json(tasks);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
});

module.exports = router;
