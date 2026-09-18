import jwt from 'jsonwebtoken';
import { env } from '../configs/env.js';

/**
 * 
 * @param {Any} payload the data to convert to token
 * @param {Object} options additional options to the token generation
 * @returns {string} - The generated token
 */
export function generateToken(payload, options = {}) {
	return jwt.sign(payload, env.jwtSecret, {...options});
}

/**
 * 
 * @param {String} token the encrypted token
 * @returns data encrypted in token
 * @throw error if invalid token or token is expired
 */
export function decryptToken(token) {
	return jwt.verify(token, env.jwtSecret);
}


