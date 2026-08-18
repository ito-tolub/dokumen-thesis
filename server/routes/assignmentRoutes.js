import express from "express";

import {
  createAssignment,
  deleteAssignment,
  getCourseAssignments,
  getEducatorAssignments,
  submitAssignment,
  getAssignmentSubmissions,
} from "../controllers/assignmentController.js";

import upload from "../configs/multer.js";
import assignmentUpload from "../configs/assignmentUpload.js";

import {
  protectDosen,
} from "../middlewares/authMiddleware.js";

const assignmentRouter = express.Router();

assignmentRouter.post(
  "/",
  protectDosen,
  upload.single("file"),
  createAssignment,
);
assignmentRouter.get(
  "/educator/:courseId",
  protectDosen,
  getEducatorAssignments,
);
assignmentRouter.delete(
  "/:assignmentId",
  protectDosen,
  deleteAssignment,
);
assignmentRouter.get(
  "/course/:courseId",
  getCourseAssignments,
);
assignmentRouter.post(
  "/:assignmentId/submit",
  assignmentUpload.single("file"),
  submitAssignment,
);
assignmentRouter.get(
  "/:assignmentId/submissions",
  protectDosen,
  getAssignmentSubmissions,
);

export default assignmentRouter;