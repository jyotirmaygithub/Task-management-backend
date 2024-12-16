const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const { checkBlacklist } = require("../middleware/tokenBlockList");
const fetchUserId = require("../middleware/fetchUserId");


/**
 * @swagger
 * /search-tasks:
 *   post:
 *     summary: Search tasks by title, description, status, tag, or assigned username.
 *     tags: [Task]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               q:
 *                 type: string
 *                 example: "Project"
 *     responses:
 *       200:
 *         description: List of tasks matching the search query.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     example: "60e6a5by564tr80011256e7c"
 *                   title:
 *                     type: string
 *                     example: "Complete Project A"
 *                   description:
 *                     type: string
 *                     example: "Complete the final review and submission of Project A."
 *                   tag:
 *                     type: string
 *                     example: "Report"
 *                   status:
 *                     type: string
 *                     example: "in-progress"
 *                   dueDate:
 *                     type: string
 *                     example: "2024-12-31T23:59:59Z"
 *                   manager_id:
 *                     type: number
 *                     example: 10001
 *                   assigned_to_id:
 *                     type: number
 *                     example: 54321
 *                   assigned_to_username:
 *                     type: string
 *                     example: "Jane Smith"
 *       400:
 *         description: Search query is required
 *       500:
 *         description: Internal server error
 */

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
