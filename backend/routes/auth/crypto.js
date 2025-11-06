const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_MATERIAL = process.env.ENCRYPTION_KEY || 'placeholder_secret';

if (!KEY_MATERIAL) {
    throw new Error('ENCRYPTION_KEY is not set in environment variables!');
}

const KEY = crypto.createHash('sha256').update(String(KEY_MATERIAL)).digest();

/**
 * Encrypts a plain text string.
 * @param {string} text - The plain text to encrypt.
 * @returns {string} - A combined string in format "iv:encrypted:authTag"
 */
function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
}

/**
 * Decrypts a combined "iv:encrypted:authTag" string.
 * @param {string} combined - The combined string from the encrypt function.
 * @returns {string} - The decrypted plain text.
 */
function decrypt(combined) {
    try {
        const [ivHex, encryptedText, authTagHex] = combined.split(':');

        if (!ivHex || !encryptedText || !authTagHex) {
            throw new Error('Invalid encrypted string format.');
        }

        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');

        const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
        
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (err) {
        // this will fail if the key is wrong or data is tampered with
        flog.error({ function: 'decrypt', error: err }, "Decryption failed. Data may be tampered or key is wrong.");
        throw new Error('Decryption failed.');
    }
}

module.exports = { encrypt, decrypt };
