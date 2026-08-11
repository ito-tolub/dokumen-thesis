import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import { toast } from "react-toastify";

import { AppContext } from "../../context/AppContext";

const PERTEMUAN = [3, 4, 5, 6, 7];

const scoreColor = (score) => {
  if (score === null || score === undefined) {
    return "text-gray-400";
  }

  if (score >= 80) return "text-green-600";
  if (score >= 70) return "text-blue-600";
  if (score >= 60) return "text-yellow-600";

  return "text-red-500";
};

const calculateStudentAverage = (student) => {
  const scores = PERTEMUAN.map(
    (pertemuan) => student.scores?.[pertemuan],
  ).filter(
    (score) =>
      typeof score === "number" &&
      !Number.isNaN(score),
  );

  if (scores.length === 0) return null;

  return (
    Math.round(
      (scores.reduce((total, score) => total + score, 0) /
        scores.length) *
        100,
    ) / 100
  );
};

const MyCourses = () => {
  const { backendUrl } = useContext(AppContext);

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] =
    useState("");

  const [selectedKelas, setSelectedKelas] =
    useState("G1");

  const [students, setStudents] = useState([]);

  const [loadingCourses, setLoadingCourses] =
    useState(true);

  const [loadingResults, setLoadingResults] =
    useState(false);

  // =============================
  // FETCH MATA KULIAH DOSEN
  // =============================

  const fetchCourses = useCallback(async () => {
    try {
      setLoadingCourses(true);

      const token =
        localStorage.getItem("dosenToken");

      if (!token) {
        toast.error(
          "Sesi dosen tidak ditemukan. Silakan login kembali.",
        );
        return;
      }

      const { data } = await axios.get(
        `${backendUrl}/api/educator/courses`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!data.success) {
        toast.error(
          data.message ||
            "Gagal mengambil mata kuliah",
        );
        return;
      }

      const courseList = data.courses || [];

      setCourses(courseList);

      if (
        courseList.length > 0 &&
        !selectedCourseId
      ) {
        setSelectedCourseId(courseList[0]._id);
      }
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.message ||
          "Gagal mengambil mata kuliah",
      );
    } finally {
      setLoadingCourses(false);
    }
  }, [
    backendUrl,
    selectedCourseId,
  ]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // =============================
  // FETCH HASIL QUIZ
  // =============================

  const fetchQuizResults =
    useCallback(async () => {
      if (!selectedCourseId) {
        setStudents([]);
        return;
      }

      try {
        setLoadingResults(true);

        const token =
          localStorage.getItem("dosenToken");

        const { data } = await axios.get(
          `${backendUrl}/api/educator/quiz-results/${selectedCourseId}`,
          {
            params: {
              kelas: selectedKelas,
            },

            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!data.success) {
          toast.error(
            data.message ||
              "Gagal mengambil hasil kuis",
          );

          setStudents([]);
          return;
        }

        setStudents(data.students || []);
      } catch (error) {
        console.error(error);

        toast.error(
          error.response?.data?.message ||
            "Gagal mengambil hasil kuis",
        );

        setStudents([]);
      } finally {
        setLoadingResults(false);
      }
    }, [
      backendUrl,
      selectedCourseId,
      selectedKelas,
    ]);

  useEffect(() => {
    fetchQuizResults();
  }, [fetchQuizResults]);

  // =============================
  // STATISTIK
  // =============================

  const allScores = useMemo(() => {
    return students.flatMap((student) =>
      PERTEMUAN.map(
        (pertemuan) =>
          student.scores?.[pertemuan],
      ).filter(
        (score) =>
          typeof score === "number" &&
          !Number.isNaN(score),
      ),
    );
  }, [students]);

  const statistics = useMemo(() => {
    if (allScores.length === 0) {
      return {
        average: null,
        highest: null,
        lowest: null,
      };
    }

    const average =
      allScores.reduce(
        (total, score) => total + score,
        0,
      ) / allScores.length;

    return {
      average:
        Math.round(average * 100) / 100,

      highest: Math.max(...allScores),

      lowest: Math.min(...allScores),
    };
  }, [allScores]);

  const selectedCourse = courses.find(
    (course) =>
      String(course._id) ===
      String(selectedCourseId),
  );

  // =============================
  // RENDER
  // =============================

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">

      {/* HEADER */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-800">
          Hasil Kuis Praja
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          Rekap nilai kuis Pertemuan 3 sampai
          Pertemuan 7
        </p>
      </div>

      {/* FILTER */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">

        <div className="flex flex-col lg:flex-row lg:items-end gap-5">

          {/* MATA KULIAH */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Mata Kuliah
            </label>

            <select
              value={selectedCourseId}
              disabled={loadingCourses}
              onChange={(event) =>
                setSelectedCourseId(
                  event.target.value,
                )
              }
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500 bg-white"
            >
              {courses.length === 0 && (
                <option value="">
                  Tidak ada mata kuliah
                </option>
              )}

              {courses.map((course) => (
                <option
                  key={course._id}
                  value={course._id}
                >
                  {course.courseTitle}
                </option>
              ))}
            </select>
          </div>

          {/* KELAS */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Kelas
            </label>

            <div className="inline-flex bg-gray-100 p-1 rounded-lg">
              {["G1", "G2"].map((kelas) => (
                <button
                  key={kelas}
                  type="button"
                  onClick={() =>
                    setSelectedKelas(kelas)
                  }
                  className={`px-6 py-2 rounded-md text-sm font-medium transition ${
                    selectedKelas === kelas
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {kelas}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* COURSE INFORMATION */}
      {selectedCourse && (
        <div className="mb-5">
          <p className="text-sm text-gray-400">
            Menampilkan hasil:
          </p>

          <p className="font-semibold text-gray-700">
            {selectedCourse.courseTitle} — Kelas{" "}
            {selectedKelas}
          </p>
        </div>
      )}

      {/* STATISTICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Praja
          </p>

          <p className="text-2xl font-bold text-gray-800 mt-2">
            {students.length}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Rata-rata
          </p>

          <p className="text-2xl font-bold text-blue-600 mt-2">
            {statistics.average ?? "—"}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Nilai Tertinggi
          </p>

          <p className="text-2xl font-bold text-green-600 mt-2">
            {statistics.highest ?? "—"}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Nilai Terendah
          </p>

          <p className="text-2xl font-bold text-red-500 mt-2">
            {statistics.lowest ?? "—"}
          </p>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-700">
            Nilai Kuis Kelas {selectedKelas}
          </h2>
        </div>

        {loadingResults ? (
          <div className="py-16 text-center text-sm text-gray-400">
            Memuat hasil kuis...
          </div>
        ) : students.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-500">
              Belum ada hasil kuis untuk kelas{" "}
              {selectedKelas}.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-left px-5 py-4 font-medium">
                    No
                  </th>

                  <th className="text-left px-5 py-4 font-medium">
                    NPP
                  </th>

                  <th className="text-left px-5 py-4 font-medium min-w-[220px]">
                    Nama Praja
                  </th>

                  {PERTEMUAN.map(
                    (pertemuan) => (
                      <th
                        key={pertemuan}
                        className="text-center px-5 py-4 font-medium"
                      >
                        P{pertemuan}
                      </th>
                    ),
                  )}

                  <th className="text-center px-5 py-4 font-medium">
                    Rata-rata
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">

                {students.map(
                  (student, index) => {
                    const average =
                      student.average ??
                      calculateStudentAverage(
                        student,
                      );

                    return (
                      <tr
                        key={
                          student.npp ||
                          index
                        }
                        className="hover:bg-gray-50"
                      >
                        <td className="px-5 py-4 text-gray-400">
                          {index + 1}
                        </td>

                        <td className="px-5 py-4 font-medium text-gray-600 whitespace-nowrap">
                          {student.npp}
                        </td>

                        <td className="px-5 py-4 text-gray-700 font-medium">
                          {student.nama}
                        </td>

                        {PERTEMUAN.map(
                          (pertemuan) => {
                            const score =
                              student.scores?.[
                                pertemuan
                              ];

                            return (
                              <td
                                key={
                                  pertemuan
                                }
                                className={`px-5 py-4 text-center font-semibold ${scoreColor(
                                  score,
                                )}`}
                              >
                                {score ??
                                  "—"}
                              </td>
                            );
                          },
                        )}

                        <td
                          className={`px-5 py-4 text-center font-bold ${scoreColor(
                            average,
                          )}`}
                        >
                          {average ??
                            "—"}
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* INFORMATION */}
      <div className="mt-4 text-xs text-gray-400">
        P3–P7 menunjukkan nilai kuis pada
        Pertemuan 3 sampai Pertemuan 7.
        Tanda — berarti praja belum mengerjakan
        kuis pada pertemuan tersebut.
      </div>
    </div>
  );
};

export default MyCourses;