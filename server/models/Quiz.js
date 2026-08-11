import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (v) => v.length === 4,
        message: "Setiap soal harus memiliki 4 pilihan jawaban",
      },
    },
    correctAnswer: {
      type: Number, // 0,1,2,3
      required: true,
      min: 0,
      max: 3,
    },
  },
  { _id: false },
);

const quizSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    pertemuan: {
      type: Number,
      enum: [3, 4, 5, 6, 7],
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    duration: {
      type: Number,
      default: 15,
    },

    questions: {
      type: [questionSchema],
      validate: {
        validator: (v) => v.length === 10,
        message: "Setiap kuis harus memiliki tepat 10 soal",
      },
    },

    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

quizSchema.index(
  { courseId: 1, pertemuan: 1 },
  { unique: true },
);

export default mongoose.model("Quiz", quizSchema);