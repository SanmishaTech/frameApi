const express = require("express");
const router = express.Router();
const {
  getAllStates,
  getMemberState,
} = require("../controllers/stateController");
const auth = require("../middleware/auth");
const acl = require("../middleware/acl");

/**
 * @swagger
 * tags:
 *   name: States
 *   description: State management endpoints
 */

/**
 * @swagger
 * /states/all:
 *   get:
 *     summary: Get all states
 *     tags: [States]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all states
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *                 example: "California"
 *       500:
 *         description: Failed to fetch states
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Failed to fetch states"
 *                     details:
 *                       type: string
 *                       example: "Error details here"
 */
router.get("/all", getAllStates);

router.get("/member", auth, getMemberState);

module.exports = router;
