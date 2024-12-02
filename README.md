# Task Management System

This project is a full-stack task management system developed using React, Express, Node.js, and MongoDB Atlas. The frontend is deployed on Netlify and built with Material UI and Tailwind CSS. It features user authentication with Google OAuth and JWT token authorization. Users can create tasks, view all tasks created by all users, and assign themselves to tasks. Additionally, there are routes for viewing archived tasks, tasks created by the user, and tasks assigned to the user.

## Features

- User authentication with Google OAuth
- JWT token authorization
- Create tasks
- View all tasks created by all users
- Assign oneself to tasks
- Routes for viewing archived tasks, tasks created by the user, and tasks assigned to the user

## Technologies Used

- React
- Express
- Node.js
- MongoDB Atlas
- Material UI
- Tailwind CSS
- Google OAuth

## Deployment
Frontend: Deployed on Netlify
Backend: Deploy your Node.js server to a hosting provider of your choice (e.g., Heroku, AWS, DigitalOcean)

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
Ensure you replace https://github.com/jyotirmaygithub/Task-Management-System with the actual URL of your project repository and fill in the appropriate values for the environment variables.

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/jyotirmaygithub/Task-Management-System

2. Install dependencies for both frontend and backend:

cd frontend
npm install

cd ../backend
npm install

3.Set up environment variables:

For frontend (React):
Create a .env file in the frontend directory.
Add the following variables to the .env file

REACT_APP_AUTH_CLIENT_ID=your_google_auth_client_id
REACT_APP_DEV_URL=your_frontend_dev_url

For backend (Node.js):
Create a .env file in the backend directory.
Add the following variables to the .env file

JWT_SECRET=your_preferable_jwt_secret
REACT_APP_MONGO_URL=your_mongodb_url_of_local_database
PASSWORD_STRING=random_string

4.Start the backend server:
cd backend
npm start

5.Start the frontend development server:
cd frontend
npm start

