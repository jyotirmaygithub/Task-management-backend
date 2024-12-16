const express = require("express");
const router = express.Router();
const fetchUserId = require("../middleware/fetchUserId");
const Task = require("../models/Task");
const User = require("../models/User");
const { checkBlacklist } = require("../middleware/tokenBlockList");


/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Get tasks based on filters (status, sortBy, order).
 *     tags: [Task]
 *     parameters:
 *       - in: query
 *         name: status
 *         required: false
 *         description: The status of the tasks to filter by.
 *         schema:
 *           type: string
 *           enum: [completed, ongoing, overdue]
 *       - in: query
 *         name: sortBy
 *         required: false
 *         description: The field to sort the tasks by.
 *         schema:
 *           type: string
 *           example: title
 *       - in: query
 *         name: order
 *         required: false
 *         description: The sort order for the results.
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: A list of tasks matching the filter and sort criteria.
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
 *                   status:
 *                     type: string
 *                     example: "in-progress"
 *                   dueDate:
 *                     type: string
 *                     example: "2024-12-31T23:59:59Z"
 *                   assigned_to_username:
 *                     type: string
 *                     example: "Jane Smith"
 *       400:
 *         description: Invalid query parameters.
 *       500:
 *         description: Internal server error.
 */
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


/**
 * @swagger
 * /createTask:
 *   post:
 *     summary: Create a new task.
 *     tags: [Task]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Company finance app"
 *               description:
 *                 type: string
 *                 example: "Bugs in the fiance application"
 *               tag:
 *                 type: string
 *                 example: "Bugs "
 *     responses:
 *       201:
 *         description: Task created successfully.
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
 *                   example: "Company finance app"
 *                 description:
 *                   type: string
 *                   example: "Bugs in the fiance application"
 *                 tag:
 *                   type: string
 *                   example: "Bugs"
 *       400:
 *         description: Invalid input or missing required fields.
 *       401:
 *         description: Unauthorized or insufficient permissions.
 *       500:
 *         description: Internal server error.
 */
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


/**
 * @swagger
 * /deleteTask/{id}:
 *   delete:
 *     summary: Delete a task by ID.
 *     tags: [Task]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the task to be deleted.
 *         schema:
 *           type: string
 *           example: "60e6a5by564tr80011256e7c"
 *     responses:
 *       200:
 *         description: Task deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: string
 *                   example: "Task has been deleted"
 *                 foundTask:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "60e6a5by564tr80011256e7c"
 *                     title:
 *                       type: string
 *                       example: "Company finance app"
 *       401:
 *         description: Unauthorized or insufficient permissions.
 *       404:
 *         description: Task not found.
 *       500:
 *         description: Internal server error.
 */
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
