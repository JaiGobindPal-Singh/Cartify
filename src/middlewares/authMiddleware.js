import User from '../models/user.model.js';
import { decryptToken, generateToken } from '../utils/jwt.utils.js'

const refreshTokenAndSetCookie = (decodedPrevToken, res, timeout) => {
    try {
        
        //skip refreshing token if the previous token is still valid for more than 1 day
        if (decodedPrevToken && decodedPrevToken.exp) {
            const currentTimeInSeconds = Math.floor(Date.now() / 1000);
            const timeRemaining = decodedPrevToken.exp - currentTimeInSeconds;
            const oneDayInSeconds = 24 * 60 * 60; // 86,400 seconds

            if (timeRemaining > oneDayInSeconds) {
                return;
            }
        }
    } catch {
        // If the previous token is invalid, we can ignore it and generate a new one
    }

    //generating new token and setting it as cookie
    const tokenRef = generateToken({ id: decodedPrevToken.id, role: decodedPrevToken.role });
    res.cookie('alpha', tokenRef, {
        httpOnly: true,
        sameSite: 'none', // Allows cross-origin cookie sharing
        secure: true,     // Required for sameSite: 'none'
        maxAge: timeout
    });
}

/**
 * Authenticates a user based on their JWT token and attaches the user object to the request if valid.
 * If the token is missing or invalid, it responds with a 401 Unauthorized status.
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
export const authenticateUser = async (req, res, next) => {
    try {
        const token = req.cookies.alpha;
        //authenticate user using JWT token from cookies
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const decodedToken = decryptToken(token);
        req.user = decodedToken; // Attach the decoded token to the request object for further use
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({ error: 'Unauthorized' });
    }
}

/**
 * Authorizes a user based on their role and updates their authentication token.
 * If the user is not authenticated or does not have the required role, it responds with a 401 Unauthorized status.
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
export const authorizeUser = async (req, res, next) => {
    try {
        //refreshing token
        refreshTokenAndSetCookie(req.user, res, 7 * 24 * 60 * 60 * 1000); //7D timeout for user
        next();
    } catch (error) {
        console.error('Authorization error:', error);
        return res.status(401).json({ error: 'Unauthorized' });
    }
}

/**
 * Authorizes an admin user and updates their authentication token.
 * If the user is not authenticated or does not have the required role, it responds with a 401 Unauthorized status.
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
export const authorizeAdmin = async (req, res, next) => {
    try {
        const decodedToken = req.user;

        //validating if the user has admin role
        if (decodedToken.role !== 'ADMIN') {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        //refreshing token and set cookie for admin
        refreshTokenAndSetCookie(req.user, res, 24 * 60 * 60 * 1000); //1D timeout for admin

        next();
    } catch (error) {
        console.error('Admin Authorization error:', error);
        return res.status(401).json({ error: 'Unauthorized' });
    }
}

