const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const taskSchema = new Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  username: {
    type: String,
    required: true,
  },
  manager_id: {
    type: Number,
  },
  assigned_to_id: {
    type: Number,
  },
  assigned_to_username:{
    type: String,
  },
  status: {
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
  dueDate:{
    type: Date,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});
const Task = mongoose.model("task", taskSchema);
module.exports = Task;
