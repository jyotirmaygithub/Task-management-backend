const connectToMongo = require("./config/db");
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerJSDoc = require("swagger-jsdoc");

connectToMongo();

const app = express();

// Port number
const port = 5000;

app.use(cors());
app.use(express.json());

// Swagger setup
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Task Management API',
    version: '1.0.0',
    description: 'API documentation for managing tasks, employees, and more',
  },
  servers: [
    {
      url: `https://task-management-backend-m4qj.onrender.com`,
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
};

// Options for swagger-jsdoc
const options = {
  swaggerDefinition,
  apis: ['./routes/*.js'], // Path to the API routes for automatic docs generation
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options);

// Serve Swagger UI documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Available routes in the project
app.use("/api/auth", require("./routes/auth"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/manager", require("./routes/manager"));
app.use("/api/employee", require("./routes/employee"));
app.use("/api/task", require("./routes/task"));
app.use("/api/analytics", require("./routes/analytics"));
app.use("/api/searching", require("./routes/searching"));

app.listen(port, () => {
  console.log(`task-backend is working on port number: ${port}`);
});
