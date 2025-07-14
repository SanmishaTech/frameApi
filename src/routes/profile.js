const express = require("express");
const profileController = require("../controllers/profileController");
const auth = require("../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Get logged-in user's profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get("/", auth, profileController.getProfile);

/**
 * @swagger
 * /profile:
 *   post:
 *     summary: Update logged-in user's profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *       400:
 *         description: Bad request (e.g., email already exists)
 *       401:
 *         description: Unauthorized
 */
router.post("/", auth, profileController.updateProfile);

/**
 * @swagger
 * /profile/change-password:
 *   post:
 *     summary: Change logged-in user's password
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Unauthorized or incorrect current password
 *       404:
 *         description: User not found
 */
router.post("/change-password", auth, profileController.changePassword);

module.exports = router;
