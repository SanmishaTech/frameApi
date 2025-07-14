const express = require("express");
const multer = require("multer");

const router = express.Router();
const {
  getDoctors,
  createDoctor,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  getAllDoctors,
  sendDoctorEmail,
  fetchDoctorRecord,
  uploadDoctorVideo,
  DeleteDoctorVideo,
  finishDoctorVideo,
} = require("../controllers/doctorController");
const auth = require("../middleware/auth");
const acl = require("../middleware/acl");
const upload = require("../middleware/VideoUploadMiddleware");

// Custom middleware wrapper to handle multer errors
const handleMulterErrors = (req, res, next) => {
  upload.single("video")(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

/**
 * @swagger
 * tags:
 *   name: Doctors
 *   description: Doctor management endpoints
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/doctors:
 *   get:
 *     summary: Get all doctors with pagination, sorting, and search
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of doctors per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for doctor name, mobile, email, etc.
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: id
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of all doctors
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
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 totalDoctors:
 *                   type: integer
 *       500:
 *         description: Failed to fetch doctors
 */
router.get("/", auth, acl("doctors.read"), getDoctors);

/**
 * @swagger
 * /api/doctors:
 *   post:
 *     summary: Create a new doctor
 *     tags: [Doctors]
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
 *                 description: Name of the doctor
 *               mobile:
 *                 type: string
 *                 description: Mobile number of the doctor
 *               email:
 *                 type: string
 *                 description: Email of the doctor
 *               degree:
 *                 type: string
 *                 description: Degree of the doctor
 *               designation:
 *                 type: string
 *                 description: Designation of the doctor
 *               specialty:
 *                 type: string
 *                 description: Specialty of the doctor
 *               topic:
 *                 type: string
 *                 description: Topic of the doctor
 *     responses:
 *       201:
 *         description: Doctor created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Failed to create doctor
 */
router.post("/", auth, acl("doctors.write"), createDoctor);

/**
 * @swagger
 * /api/doctors/record/{uuid}/finish:
 *   post:
 *     summary: Finalize the video upload for a doctor
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID of the doctor
 *     responses:
 *       200:
 *         description: Video upload finalized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Video upload completed
 *       404:
 *         description: Doctor not found
 *       500:
 *         description: Failed to finalize video upload
 */
router.post("/record/:uuid/finish", finishDoctorVideo);

/**
 * @swagger
 * /api/doctors/video/{uuid}:
 *   post:
 *     summary: Upload a video chunk for a doctor
 *     tags: [Doctors]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID of the doctor
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Chunk uploaded successfully
 *       500:
 *         description: Failed to upload video chunk
 */
router.post("/record/:uuid", handleMulterErrors, uploadDoctorVideo);

/**
 * @swagger
 * /api/doctors/video/{uuid}/delete:
 *   delete:
 *     summary: Delete all uploaded video chunks for a doctor
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID of the doctor
 *     responses:
 *       200:
 *         description: Video deleted successfully
 *       500:
 *         description: Failed to delete video
 */
router.delete("/record/:uuid/delete", DeleteDoctorVideo);

/**
 * @swagger
 * /api/doctors/{doctorId}/send-email:
 *   post:
 *     summary: Send an email to a specific doctor
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the doctor to send email to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject:
 *                 type: string
 *                 description: Subject of the email
 *               message:
 *                 type: string
 *                 description: Body content of the email
 *             required:
 *               - subject
 *               - message
 *     responses:
 *       200:
 *         description: Email sent successfully
 *       400:
 *         description: Bad request (missing subject or message)
 *       404:
 *         description: Doctor not found
 *       500:
 *         description: Failed to send email
 */
router.post("/:doctorId/send-email", sendDoctorEmail);

/**
 * @swagger
 * /api/doctors/all:
 *   get:
 *     summary: Get all doctors without pagination, sorting, and search
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all doctors
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   mobile:
 *                     type: string
 *                   email:
 *                     type: string
 *                   degree:
 *                     type: string
 *                   designation:
 *                     type: string
 *                   specialty:
 *                     type: string
 *                   topic:
 *                     type: string
 *       500:
 *         description: Failed to fetch doctors
 */
router.get("/all", auth, acl("doctors.read"), getAllDoctors);

/**
 * @swagger
 * /api/doctors/record/{uuid}:
 *   get:
 *     summary: Get a doctor's full record by UUID
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: UUID of the doctor
 *     responses:
 *       200:
 *         description: Doctor record fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 uuid:
 *                   type: string
 *                   format: uuid
 *                 name:
 *                   type: string
 *                 mobile:
 *                   type: string
 *                 email:
 *                   type: string
 *                 degree:
 *                   type: string
 *                 designation:
 *                   type: string
 *                 specialty:
 *                   type: string
 *                 topic:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Doctor not found
 *       500:
 *         description: Failed to fetch doctor record
 */
router.get("/record/:uuid", fetchDoctorRecord);

/**
 * @swagger
 * /api/doctors/{id}:
 *   get:
 *     summary: Get doctor by ID
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Doctor ID
 *     responses:
 *       200:
 *         description: Doctor details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 mobile:
 *                   type: string
 *                 email:
 *                   type: string
 *                 degree:
 *                   type: string
 *                 designation:
 *                   type: string
 *                 specialty:
 *                   type: string
 *                 topic:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Doctor not found
 *       500:
 *         description: Failed to fetch doctor
 */
router.get("/:id", auth, acl("doctors.read"), getDoctorById);

/**
 * @swagger
 * /api/doctors/{id}:
 *   put:
 *     summary: Update doctor by ID
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Doctor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the doctor
 *               mobile:
 *                 type: string
 *                 description: Mobile number of the doctor
 *               email:
 *                 type: string
 *                 description: Email of the doctor
 *               degree:
 *                 type: string
 *                 description: Degree of the doctor
 *               designation:
 *                 type: string
 *                 description: Designation of the doctor
 *               specialty:
 *                 type: string
 *                 description: Specialty of the doctor
 *               topic:
 *                 type: string
 *                 description: Topic of the doctor
 *     responses:
 *       200:
 *         description: Doctor updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Doctor not found
 *       500:
 *         description: Failed to update doctor
 */
router.put("/:id", auth, acl("doctors.write"), updateDoctor);

/**
 * @swagger
 * /api/doctors/{id}:
 *   delete:
 *     summary: Delete doctor by ID
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Doctor ID
 *     responses:
 *       204:
 *         description: Doctor deleted successfully
 *       404:
 *         description: Doctor not found
 *       500:
 *         description: Failed to delete doctor
 */
router.delete("/:id", auth, acl("doctors.delete"), deleteDoctor);

module.exports = router;
