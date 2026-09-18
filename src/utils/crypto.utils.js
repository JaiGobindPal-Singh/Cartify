import crypto from 'node:crypto';
import { env } from '../configs/env.js';
const ALGORITHM = 'aes-256-gcm';
const secretKey = env.encryptionKey; 
/**
 * 
 * @param {String} data data to encrypt
 * @param {String} key encryption key
 * @returns encrypted string
 */
export const encryptData = (data, key = secretKey) => {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let ciphertext = cipher.update(data, 'utf8', 'hex');
    ciphertext += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}.${ciphertext}.${authTag}`;
};

/**
 * 
 * @param {String} encryptedPacket the encrypted data packet
 * @param {String} key the decryption key
 * @returns decrypted string
 */
export const decryptData = (encryptedPacket, key = secretKey) => {
    const [ivHex, ciphertextHex, authTagHex] = encryptedPacket.split('.');

    if (!ivHex || !ciphertextHex || !authTagHex) {
        throw new Error('Invalid encrypted packet format.');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const ciphertext = Buffer.from(ciphertextHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
};
