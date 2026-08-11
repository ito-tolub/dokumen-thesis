import { getAuth } from "@clerk/express";
import Quiz from "../models/Quiz.js";
import QuizAttempt from "../models/QuizAttempt.js";
import User from "../models/User.js";

// ======================================================
// GET DAFTAR KUIS BERDASARKAN COURSE
// ======================================================

export const getCourseQuizzes = async (req, res) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const quizzes = await Quiz.find({
      courseId: req.params.courseId,
      isPublished: true,
    })
      .sort({ pertemuan: 1 })
      .lean();

    // Ambil kuis yang sudah pernah dikerjakan praja
    const attempts = await QuizAttempt.find({
      courseId: req.params.courseId,
      userId,
    }).lean();

    const attemptMap = new Map(
      attempts.map((attempt) => [
        String(attempt.quizId),
        attempt,
      ]),
    );

    const data = quizzes.map((quiz) => {
      const attempt = attemptMap.get(
        String(quiz._id),
      );

      return {
        _id: quiz._id,
        title: quiz.title,
        pertemuan: quiz.pertemuan,
        duration: quiz.duration,

        questionCount:
          quiz.questions?.length || 0,

        completed: !!attempt,

        score:
          attempt?.score ?? null,
      };
    });

    return res.json({
      success: true,
      quizzes: data,
    });
  } catch (error) {
    console.error(
      "Get Course Quizzes Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Gagal mengambil daftar kuis",
    });
  }
};

// ======================================================
// GET DETAIL KUIS
// ======================================================

export const getQuiz = async (req, res) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const quiz = await Quiz.findById(
      req.params.quizId,
    ).lean();

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Kuis tidak ditemukan",
      });
    }

    if (!quiz.isPublished) {
      return res.status(403).json({
        success: false,
        message: "Kuis belum tersedia",
      });
    }

    // Cek apakah sudah pernah dikerjakan
    const existingAttempt =
      await QuizAttempt.findOne({
        quizId: quiz._id,
        userId,
      }).lean();

    if (existingAttempt) {
      return res.status(400).json({
        success: false,
        message:
          "Kuis ini sudah pernah dikerjakan",
        result: {
          score: existingAttempt.score,
          correctCount:
            existingAttempt.correctCount,
          wrongCount:
            existingAttempt.wrongCount,
        },
      });
    }

    // Jangan kirim correctAnswer ke frontend
    const questions = quiz.questions.map(
      (question, index) => ({
        number: index + 1,
        question: question.question,
        options: question.options,
      }),
    );

    return res.json({
      success: true,

      quiz: {
        _id: quiz._id,
        courseId: quiz.courseId,
        title: quiz.title,
        pertemuan: quiz.pertemuan,
        duration: quiz.duration,
        questions,
      },
    });
  } catch (error) {
    console.error("Get Quiz Error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Gagal mengambil kuis",
    });
  }
};

// ======================================================
// SUBMIT KUIS
// ======================================================

export const submitQuiz = async (req, res) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Agar tidak error jika req.body undefined
    const { answers } = req.body || {};

    // ================================
    // CARI QUIZ
    // ================================

    const quiz = await Quiz.findById(
      req.params.quizId,
    );

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Kuis tidak ditemukan",
      });
    }

    if (!quiz.isPublished) {
      return res.status(403).json({
        success: false,
        message: "Kuis belum tersedia",
      });
    }

    // ================================
    // VALIDASI JAWABAN
    // ================================

    if (!Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message:
          "Data jawaban tidak ditemukan",
      });
    }

    if (
      answers.length !==
      quiz.questions.length
    ) {
      return res.status(400).json({
        success: false,
        message: `Semua ${quiz.questions.length} soal harus dijawab`,
      });
    }

    // ================================
    // CEK SUDAH PERNAH MENGERJAKAN
    // ================================

    const existing =
      await QuizAttempt.findOne({
        quizId: quiz._id,
        userId,
      });

    if (existing) {
      return res.status(400).json({
        success: false,
        message:
          "Kuis ini sudah pernah dikerjakan",
      });
    }

    // ================================
    // AMBIL DATA USER
    // ================================

    const user =
      await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "Data pengguna tidak ditemukan",
      });
    }

    if (!user.npp) {
      return res.status(400).json({
        success: false,
        message:
          "NPP praja tidak ditemukan",
      });
    }

    // ================================
    // HITUNG JAWABAN BENAR
    // ================================

    let correctCount = 0;

    quiz.questions.forEach(
      (question, index) => {
        const studentAnswer = Number(
          answers[index],
        );

        const correctAnswer = Number(
          question.correctAnswer,
        );

        if (
          studentAnswer === correctAnswer
        ) {
          correctCount++;
        }
      },
    );

    // ================================
    // HITUNG HASIL
    // ================================

    const totalQuestions =
      quiz.questions.length;

    const wrongCount =
      totalQuestions - correctCount;

    const score = Math.round(
      (correctCount / totalQuestions) *
        100,
    );

    // ================================
    // SIMPAN ATTEMPT
    // ================================

    const attempt =
      await QuizAttempt.create({
        quizId: quiz._id,
        courseId: quiz.courseId,

        userId,
        npp: user.npp,

        pertemuan: quiz.pertemuan,

        answers,

        correctCount,
        wrongCount,
        score,

        submittedAt: new Date(),
      });

    // ================================
    // RESPONSE
    // ================================

    return res.status(201).json({
      success: true,

      message:
        "Kuis berhasil dikumpulkan",

      result: {
        attemptId: attempt._id,

        totalQuestions,

        correctCount,

        wrongCount,

        score,
      },
    });
  } catch (error) {
    console.error(
      "Submit Quiz Error:",
      error,
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Gagal mengumpulkan kuis",
    });
  }
};