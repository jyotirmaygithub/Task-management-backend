const connectToMongo = require("./config/db");
const express = require("express");
const cors = require("cors");

// connect with database
connectToMongo();

const app = express();

// port number.
const port = 5000;

app.use(cors());
// we are using middleware to convert raw json data into js object. 
app.use(express.json());

// available routes in the project
app.use("/api/auth", require("./routes/auth"));
app.use("/api/task", require("./routes/task"));
app.use("/api/role", require("./routes/role"));
app.use("/api/editProfile" , require("./routes/editProfile"))

app.listen(port, () => {
  console.log(`task-backend is working on port number :  ${port}`);
});
