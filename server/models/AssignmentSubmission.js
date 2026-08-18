import mongoose from "mongoose";

const assignmentSubmissionSchema =
  new mongoose.Schema(
    {
      assignmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Assignment",
        required: true,
        index: true,
      },

      courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true,
        index: true,
      },

      userId: {
        type: String,
        ref: "User",
        required: true,
        index: true,
      },

      npp: {
        type: String,
        required: true,
      },

      fileUrl: {
        type: String,
        required: true,
      },

      fileName: {
        type: String,
        required: true,
      },

      fileType: {
        type: String,
        default: "",
      },

      filePublicId: {
        type: String,
        default: "",
      },

      cloudinaryResourceType: {
        type: String,
        default: "raw",
      },

      submittedAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      timestamps: true,
    },
  );

// 1 praja hanya memiliki 1 submission aktif
// untuk setiap tugas.
assignmentSubmissionSchema.index(
  {
    assignmentId: 1,
    userId: 1,
  },
  {
    unique: true,
  },
);

const AssignmentSubmission =
  mongoose.model(
    "AssignmentSubmission",
    assignmentSubmissionSchema,
  );

export default AssignmentSubmission;