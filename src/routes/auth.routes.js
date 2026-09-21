import express from 'express';
import { loginUser, registerUser, logoutUser, autoLoginUser, setUserAddress, forgotUser } from '../controllers/auth.controller.js';
import { authenticateUser } from '../middlewares/authMiddleware.js';

const Router = express.Router();

Router.get('/', autoLoginUser);
Router.post('/register', registerUser);
Router.post('/login', loginUser);
Router.post('/logout', logoutUser);

// Router.post('/forget', forgotUser);
// Router.patch('/set-address',authenticateUser, setUserAddress);
export default Router;