const express = require("express");

const router = express.Router();
const auth = require("../middleware/auth");
const acl = require("../middleware/acl");
const { doctorReport } = require("../controllers/reportController");
/**
 * @swagger
 * /api/reports/doctors:
 *   post:
 *     summary: Generate a doctor report based on date range and state
 *     tags: [Reports]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fromDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-01"
 *                 description: Start date for filtering uploaded doctors
 *               toDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-12-31"
 *                 description: End date for filtering uploaded doctors
 *               state:
 *                 type: string
 *                 example: "Maharashtra"
 *                 description: State to filter doctors by
 *     responses:
 *       200:
 *         description: Doctor report generated successfully
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
 *                       email:
 *                         type: string
 *                       mobile:
 *                         type: string
 *                       degree:
 *                         type: string
 *                       uploadedAt:
 *                         type: string
 *                         format: date-time
 *                       state:
 *                         type: string
 *       500:
 *         description: Failed to generate doctor report
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

router.post("/doctors", auth, acl("reports.read"), doctorReport);

module.exports = router;
