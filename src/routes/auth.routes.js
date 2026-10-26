import express from 'express';
import { loginUser, registerUser, logoutUser, autoLoginUser, forgotUser, resetPassword } from '../controllers/auth.controller.js';
import { authenticateUser } from '../middlewares/authMiddleware.js';

const Router = express.Router();

Router.get('/',authenticateUser, autoLoginUser);
Router.post('/register', registerUser);
Router.post('/login', loginUser);
Router.post('/logout', logoutUser);
Router.post("/forgot", forgotUser);
Router.post("/forgot/reset", resetPassword);


export default Router;