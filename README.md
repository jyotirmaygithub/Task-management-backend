# Task Management System

## Introduction

This RESTful API, built with Node.js, offers a robust task management solution featuring user authentication, role-based access control, and task management capabilities.

## Tech Stack

- **Backend**: Node.js, Express.js, MongoDB

### Dependencies

- **bcrypt**: ^5.1.1
- **cors**: ^2.8.5
- **dotenv**: ^16.4.5
- **express**: ^4.19.2
- **express-validator**: ^7.0.1
- **jsonwebtoken**: ^9.0.2
- **mongoose**: ^8.3.2
- **express-rate-limit**: ^7.0.0

## Features

### Admin

The admin in this API provides essential functionalities to manage tasks and users effectively. They allow the admin to:

- **Retrieve all tasks and users**: Access comprehensive data about all tasks and users on the platform.
- **Assign managers to employees**: Designate specific managers to oversee employees, ensuring proper supervision and task allocation.
- **Assign tasks to employees**: Allocate tasks directly to employees, facilitating efficient workflow management.
- **Update existing tasks**: Modify task details such as title, description, status, tag, and due date to ensure they are up-to-date and accurately reflect the current requirements.

### Manager

The manager in this API allows managers to efficiently manage their employees and tasks. They provide functionalities to:

- **Retrieve tasks and employees under a manager**: Access comprehensive data about all tasks and employees under a manager's supervision.
- **Update or change an employee's role**: Modify an employee's role to ensure they have the appropriate permissions and responsibilities.
- **Update tasks**: Modify task details such as title, description, status, tag, and due date.
- **Assign tasks to employees**: Allocate tasks directly to employees under the manager's supervision.

### Employee

The employee in this API allows employees to manage their profiles and tasks effectively. They provide functionalities to:

- **Retrieve their profile and assigned tasks**: Access personal data and tasks that are assigned to them.
- **Update the status of assigned tasks**: Modify the status of tasks they are responsible for.
- **Update their profile with restricted fields**: Edit their personal information like name and about section.

### Analytics

- **Task Statistics**: View statistics for tasks assigned to an employee or manager, including the number of completed, pending, and overdue tasks.
- **Task Filtering**: Fetch lists of tasks based on their status (completed, pending, overdue) for employees and managers.
- **Role-based Access Control**: Different endpoints are available for employees and managers, with appropriate authorization checks.
- **Blacklist Check**: The API ensures that tokens are not blacklisted, providing additional security.
- **Task Due Date Management**: For employees, overdue tasks are filtered based on the current date.

### Searching

Search for tasks based on different criteria such as title, description, status, tag, and assigned username.

## Environment Variables

Create a `.env` file in the root of your project and define the following environment variables:

### backend/.env
- **JWT_SECRET**: "your_jwt_secret"
- **MYEMAIL**: "your_email"
- **APP_MONGO_URL**: "enter your mongodb url"

## API Endpoints

Here's an outline of the routes typically used in the Task Management System:

### Authentication

- **POST /api/auth/newuser**: Register a new user.
- **POST /api/auth/login**: Login user and generate JWT token.
- **POST /api/auth/logout**: Log out the user.

### Admin Management

- **GET /api/admin/admin**: Fetch all tasks and users on the platform (Admin only).
- **PUT /api/admin/adminAssignManager**: Assign a manager to an employee (Admin only).
- **PUT /api/admin/AdminAssignTask/:taskId**: Assign a task to an employee (Admin only).
- **PUT /api/admin/adminUpdateTask/:id**: Update an existing task (Admin only).

### Manager Management

- **GET api/manager/manager**: Fetch a list of employees and tasks assigned to them.
- **PUT api/manager/updateEmployee/:employeeId**: Update the role of an employee.
- **PUT api/manager/managerUpdateTask/:id**: Update a task assigned to an employee.
- **PUT api/manager/assignTask/:taskId**: Assign a task to an employee.

### Employee Management

- **GET api/employee/employee**: Fetch the profile details of the employee along with the tasks assigned to them.
- **PUT api/employee/employeeUpdate**: Update the employee's personal details such as name and about section.

### Analytics

- **GET /employee**: Fetches task statistics (completed, pending, and overdue tasks) for the logged-in employee.
- **GET /manager**: Fetches task statistics (completed, pending, and overdue tasks) for the logged-in manager.
- **GET /employee/completed-tasks**: Fetches all completed tasks assigned to the logged-in employee.
- **GET /employee/pending-tasks**: Fetches all pending tasks assigned to the logged-in employee.
- **GET /employee/overdue-tasks**: Fetches all overdue tasks assigned to the logged-in employee.
- **GET /manager/completed-tasks**: Fetches all completed tasks for the manager's team.
- **GET /manager/pending-tasks**: Fetches all pending tasks for the manager's team.
- **GET /manager/overdue-tasks**: Fetches all overdue tasks for the manager's team.

### Searching

-- **POST /searching/search-tasks**: Fetches data by searching.

## Render deployed link:
 ```bash
  https://task-management-backend-m4qj.onrender.com
```
## Installation

Follow these steps to set up and run the application locally:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/jyotirmaygithub/Task-management-backend
   cd backend
   npm install
   nodemon else node index.js
   
   
