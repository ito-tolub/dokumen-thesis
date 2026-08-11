import mongoose from "mongoose";

const quizAttemptSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },

    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    userId: {
      type: String,
      ref: "User",
      required: true,
    },

    npp: {
      type: String,
      required: true,
    },

    pertemuan: {
      type: Number,
      required: true,
    },

    answers: {
      type: [Number],
      required: true,
    },

    correctCount: {
      type: Number,
      required: true,
    },

    wrongCount: {
      type: Number,
      required: true,
    },

    score: {
      type: Number,
      required: true,
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

// satu kali pengerjaan
quizAttemptSchema.index(
  { quizId: 1, userId: 1 },
  { unique: true },
);

export default mongoose.model("QuizAttempt", quizAttemptSchema);