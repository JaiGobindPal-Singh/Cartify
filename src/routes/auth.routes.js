import express from 'express';
import { loginUser, registerUser, logoutUser, autoLoginUser, forgotUser } from '../controllers/auth.controller.js';
import { authenticateUser } from '../middlewares/authMiddleware.js';

const Router = express.Router();

Router.get('/',authenticateUser, autoLoginUser);
Router.post('/register', registerUser);
Router.post('/login', loginUser);
Router.post('/logout', logoutUser);

// Router.post('/forget', forgotUser);

export default Router;