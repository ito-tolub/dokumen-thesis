import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    educatorNip: {
      type: String,
      required: true,
      index: true,
    },

    pertemuan: {
      type: Number,
      required: true,
      min: 1,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    deadline: {
      type: Date,
      default: null,
    },

    attachmentUrl: {
      type: String,
      default: "",
    },

    attachmentName: {
      type: String,
      default: "",
    },

    attachmentType: {
      type: String,
      default: "",
    },

    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

assignmentSchema.index({
  courseId: 1,
  pertemuan: 1,
});

const Assignment = mongoose.model(
  "Assignment",
  assignmentSchema,
);

export default Assignment;