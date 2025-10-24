const fs = require('fs/promises');
const path = require('path');
const { logger } = require('@logger');
const flog = logger.child({ fileContext: 'save_avatar.js' });

// Base directory for storing avatars (relative to the backend root)
// This must match the 'root' used in the @fastify/static configuration in server.js
const AVATAR_BASE_DIR = 'public';
const AVATAR_SUB_DIR = 'avatars';

// IMPORTANT FIX: Assuming this file is in 'backend/routes/profile/', the backend root is two levels up:
// we need to step up only twice: ../../
const BACKEND_ROOT = path.join(__dirname, '..', '..');
const AVATAR_FULL_PATH = path.join(BACKEND_ROOT, AVATAR_BASE_DIR, AVATAR_SUB_DIR);

// Base URL prefix served by @fastify/static
const AVATAR_URL_PREFIX = '/api/avatars/';

/**
 * Deletes the old avatar file from the disk if it exists.
 * @param {string} oldAvatarUrl - The previous avatar URL stored in the database.
 */
async function deleteOldAvatar(oldAvatarUrl) {
	if (!oldAvatarUrl || oldAvatarUrl === AVATAR_URL_PREFIX) {
		return; // No old avatar to delete
	}

	try {
		// Extract the filename from the URL
		const oldFileName = path.basename(oldAvatarUrl);
		const oldFilePath = path.join(AVATAR_FULL_PATH, oldFileName);

		await fs.unlink(oldFilePath);
		flog.info({ path: oldFilePath }, 'Successfully deleted old avatar file.');
	} catch (error) {
		if (error.code !== 'ENOENT') { // Ignore "File not found" errors
			flog.error({ err: error, oldAvatarUrl }, 'Failed to delete old avatar file.');
		}
	}
}


/**
 * Saves the uploaded file buffer to the local disk and returns the public URL.
 * * NOTE: Using file.toBuffer() is simpler than piping for small files like avatars,
 * but only do this after passing the Fastify limits check to prevent OOM errors.
 * * @param {object} file - The file object returned by fastify-multipart's request.file().
 * @param {number} userId - The ID of the user uploading the avatar.
 * @returns {Promise<string>} The public URL of the saved avatar.
 */
async function saveAndGetAvatarUrl(file, userId) {
	// 1. Ensure the avatar directory exists
	await fs.mkdir(AVATAR_FULL_PATH, { recursive: true });

	// 2. Determine file extension and final path
	// We create a unique name based on userId and a timestamp to prevent overwriting
	const fileExtension = path.extname(file.filename) || '.png';
	const uniqueFileName = `${userId}_${Date.now()}${fileExtension}`;
	const filePath = path.join(AVATAR_FULL_PATH, uniqueFileName);

	// 3. Save the file content stream to disk
	// file.toBuffer() reads the entire stream into memory, which is safe for 2MB limit
	await fs.writeFile(filePath, await file.toBuffer());
	
	flog.info({ path: filePath, url: `${AVATAR_URL_PREFIX}${uniqueFileName}` }, 'Avatar file successfully saved to disk.');

	// 4. Construct the public URL that the frontend will use to display the image
	const publicUrl = `${AVATAR_URL_PREFIX}${uniqueFileName}`;

	return publicUrl;
}

module.exports = { saveAndGetAvatarUrl, deleteOldAvatar };
