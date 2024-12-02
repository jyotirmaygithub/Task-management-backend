const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const taskSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  username: {
    type: String,
    required: true,
  },
  assignedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "assignedUser",
  },
  assignedTo: {
    type: String,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  tag: {
    type: String,
    default: "General",
  },
  date: {
    type: Date,
    default: Date.now,
  },
});
const Task = mongoose.model("task", taskSchema);
module.exports = Task;
