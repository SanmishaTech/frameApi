const express = require("express");

const router = express.Router();
const auth = require("../middleware/auth");
const acl = require("../middleware/acl");
const { getLatestVideos } = require("../controllers/dashboardController");

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard related endpoints
 */

/**
 * @swagger
 * /api/dashboard/latest-videos:
 *   get:
 *     summary: Get latest videos from doctors with limit, sorting
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of latest doctor videos to fetch
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: id
 *         description: Field to sort the doctors by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order of the doctors list
 *     responses:
 *       200:
 *         description: List of doctors with latest videos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 doctors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       mobile:
 *                         type: string
 *                       email:
 *                         type: string
 *                       degree:
 *                         type: string
 *                       designation:
 *                         type: string
 *                       specialty:
 *                         type: string
 *                       topic:
 *                         type: string
 *                       uploadedAt:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: Failed to fetch doctors
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
 *                     details:
 *                       type: string
 */
router.get("/latest-videos", auth, acl("dashboard.read"), getLatestVideos);

module.exports = router;
