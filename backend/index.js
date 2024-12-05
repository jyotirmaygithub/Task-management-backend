const connectToMongo = require("./config/db");
const express = require("express");
const cors = require("cors");

connectToMongo();

const app = express();

// port number.
const port = 5000;

app.use(cors());
app.use(express.json());

// available routes in the project
app.use("/api/auth", require("./routes/auth"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/manager", require("./routes/manager"));
app.use("/api/employee", require("./routes/employee"));
app.use("/api/task", require("./routes/task"));
app.use("/api/analytics", require("./routes/analytics"));
app.use("/api/searching", require("./routes/searching"));

app.listen(port, () => {
  console.log(`task-backend is working on port number :  ${port}`);
});
