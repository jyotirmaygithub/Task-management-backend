const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userDetails = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  employee_id: {
    type: Number,
    required: true,
  },
  manager_id: {
    type: Number,
  },
  role: {
    type: String,
    required: true,
  },
  aboutSelf: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});
const User = mongoose.model("user", userDetails);
module.exports = User;
