import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

import { AppContext } from "../../context/AppContext";
import Loading from "../../components/student/Loading";

const formatTime = (seconds) => {
  const minute = Math.floor(seconds / 60);
  const second = seconds % 60;

  return `${String(minute).padStart(2, "0")}:${String(second).padStart(
    2,
    "0",
  )}`;
};

const QuizPage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const { backendUrl, getToken } = useContext(AppContext);

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const [timeLeft, setTimeLeft] = useState(0);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [result, setResult] = useState(null);

  // =============================
  // FETCH QUIZ
  // =============================

  const fetchQuiz = useCallback(async () => {
    try {
      setLoading(true);

      const token = await getToken();

      const { data } = await axios.get(
        `${backendUrl}/api/quiz/${quizId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!data.success) {
        toast.error(data.message || "Gagal mengambil kuis");
        return;
      }

      const quizData = data.quiz;

      setQuiz(quizData);

      setAnswers(
        new Array(quizData.questions?.length || 10).fill(null),
      );

      setTimeLeft((quizData.duration || 15) * 60);
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.message ||
          "Gagal mengambil data kuis",
      );
    } finally {
      setLoading(false);
    }
  }, [backendUrl, getToken, quizId]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  // =============================
  // ANSWER
  // =============================

  const handleAnswer = (optionIndex) => {
    setAnswers((prev) => {
      const updated = [...prev];

      updated[currentQuestion] = optionIndex;

      return updated;
    });
  };

  const answeredCount = useMemo(
    () => answers.filter((answer) => answer !== null).length,
    [answers],
  );

  // =============================
  // SUBMIT
  // =============================

  const submitQuiz = useCallback(
    async (autoSubmit = false) => {
      if (!quiz || submitting || result) return;

      // -1 berarti tidak dijawab
      const finalAnswers = answers.map((answer) =>
        answer === null ? -1 : answer,
      );

      if (!autoSubmit && finalAnswers.includes(-1)) {
        toast.warning(
          "Silakan jawab seluruh soal sebelum mengumpulkan kuis.",
        );
        return;
      }

      if (
        !autoSubmit &&
        !window.confirm(
          "Apakah Anda yakin ingin mengumpulkan jawaban?",
        )
      ) {
        return;
      }

      try {
        setSubmitting(true);

        const token = await getToken();

        const { data } = await axios.post(
          `${backendUrl}/api/quiz/${quizId}/submit`,
          {
            answers: finalAnswers,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!data.success) {
          toast.error(data.message || "Gagal mengumpulkan kuis");
          return;
        }

        setResult(data.result);

        if (autoSubmit) {
          toast.info(
            "Waktu habis. Jawaban kuis telah dikumpulkan otomatis.",
          );
        } else {
          toast.success("Kuis berhasil dikumpulkan.");
        }
      } catch (error) {
        console.error(error);

        toast.error(
          error.response?.data?.message ||
            "Gagal mengumpulkan kuis",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [
      answers,
      backendUrl,
      getToken,
      quiz,
      quizId,
      result,
      submitting,
    ],
  );

  // =============================
  // TIMER
  // =============================

  useEffect(() => {
    if (!quiz || result) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quiz, result]);

  useEffect(() => {
    if (
      quiz &&
      timeLeft === 0 &&
      !result &&
      !submitting
    ) {
      submitQuiz(true);
    }
  }, [
    quiz,
    timeLeft,
    result,
    submitting,
    submitQuiz,
  ]);

  // =============================
  // LOADING
  // =============================

  if (loading) {
    return <Loading />;
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl border text-center">
          <h2 className="text-xl font-semibold text-gray-800">
            Kuis tidak ditemukan
          </h2>

          <button
            onClick={() => navigate(-1)}
            className="mt-5 px-5 py-2 bg-blue-600 text-white rounded-lg"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  // =============================
  // RESULT
  // =============================

  if (result) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="max-w-xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
            <p className="text-sm font-medium text-blue-600">
              Pertemuan {quiz.pertemuan}
            </p>

            <h1 className="text-2xl font-bold text-gray-800 mt-1">
              Hasil Kuis
            </h1>

            <div className="my-8">
              <div className="text-6xl font-bold text-blue-600">
                {result.score}
              </div>

              <p className="text-gray-400 mt-2">
                Nilai Anda
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-2xl font-bold text-green-600">
                  {result.correctCount}
                </p>

                <p className="text-sm text-gray-500">
                  Jawaban Benar
                </p>
              </div>

              <div className="bg-red-50 rounded-xl p-4">
                <p className="text-2xl font-bold text-red-500">
                  {result.wrongCount}
                </p>

                <p className="text-sm text-gray-500">
                  Jawaban Salah
                </p>
              </div>
            </div>

            <button
              onClick={() =>
                navigate(`/course/${quiz.courseId}`)
              }
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition"
            >
              Kembali ke Mata Kuliah
            </button>
          </div>
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];

  // =============================
  // QUIZ
  // =============================

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-4xl mx-auto">

        {/* HEADER */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

            <div>
              <p className="text-sm font-medium text-blue-600">
                Pertemuan {quiz.pertemuan}
              </p>

              <h1 className="text-2xl font-bold text-gray-800">
                {quiz.title}
              </h1>

              <p className="text-sm text-gray-500 mt-1">
                {quiz.questions.length} soal
              </p>
            </div>

            <div
              className={`px-5 py-3 rounded-xl text-center ${
                timeLeft <= 60
                  ? "bg-red-50 text-red-600"
                  : "bg-blue-50 text-blue-600"
              }`}
            >
              <p className="text-xs font-medium">
                Sisa Waktu
              </p>

              <p className="text-xl font-bold">
                {formatTime(timeLeft)}
              </p>
            </div>
          </div>

          {/* PROGRESS */}
          <div className="mt-5">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>
                Soal {currentQuestion + 1} dari{" "}
                {quiz.questions.length}
              </span>

              <span>
                {answeredCount}/{quiz.questions.length} dijawab
              </span>
            </div>

            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all"
                style={{
                  width: `${
                    ((currentQuestion + 1) /
                      quiz.questions.length) *
                    100
                  }%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* QUESTION */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">

          <p className="text-sm font-medium text-gray-400 mb-2">
            Soal {currentQuestion + 1}
          </p>

          <h2 className="text-lg md:text-xl font-semibold text-gray-800 leading-relaxed mb-6">
            {question.question}
          </h2>

          <div className="space-y-3">
            {question.options.map((option, optionIndex) => {
              const selected =
                answers[currentQuestion] === optionIndex;

              return (
                <button
                  key={optionIndex}
                  type="button"
                  onClick={() =>
                    handleAnswer(optionIndex)
                  }
                  className={`w-full text-left flex items-center gap-4 border rounded-xl px-5 py-4 transition ${
                    selected
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                  }`}
                >
                  <span
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      selected
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {String.fromCharCode(
                      65 + optionIndex,
                    )}
                  </span>

                  <span
                    className={
                      selected
                        ? "text-blue-700 font-medium"
                        : "text-gray-700"
                    }
                  >
                    {option}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* QUESTION NAVIGATION */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mt-5 shadow-sm">

          <p className="text-sm font-medium text-gray-600 mb-3">
            Navigasi Soal
          </p>

          <div className="flex flex-wrap gap-2">
            {quiz.questions.map((_, index) => {
              const answered =
                answers[index] !== null;

              const active =
                currentQuestion === index;

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() =>
                    setCurrentQuestion(index)
                  }
                  className={`w-10 h-10 rounded-lg text-sm font-medium border ${
                    active
                      ? "bg-blue-600 border-blue-600 text-white"
                      : answered
                        ? "bg-green-50 border-green-300 text-green-700"
                        : "bg-white border-gray-200 text-gray-500"
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-6 gap-3">

            <button
              type="button"
              disabled={currentQuestion === 0}
              onClick={() =>
                setCurrentQuestion((prev) => prev - 1)
              }
              className="px-5 py-2.5 border border-gray-200 rounded-lg text-gray-600 disabled:opacity-40"
            >
              Sebelumnya
            </button>

            {currentQuestion <
            quiz.questions.length - 1 ? (
              <button
                type="button"
                onClick={() =>
                  setCurrentQuestion(
                    (prev) => prev + 1,
                  )
                }
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Selanjutnya
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={() => submitQuiz(false)}
                className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {submitting
                  ? "Mengumpulkan..."
                  : "Kumpulkan Kuis"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;