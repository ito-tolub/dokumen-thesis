import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../context/AppContext";
import { Line } from "rc-progress";
import Footer from "../../components/student/Footer";
import { toast } from "react-toastify";
import axios from "axios";

// Menyamakan format VARK:
// V / Visual, A / Auditory, R / Read-Write, K / Kinesthetic
const normalizeVark = (value) => {
  if (!value) return null;

  const normalizedValue = String(value).toLowerCase().trim();

  if (normalizedValue === "v" || normalizedValue.startsWith("vis")) {
    return "V";
  }

  if (normalizedValue === "a" || normalizedValue.startsWith("aud")) {
    return "A";
  }

  if (normalizedValue === "r" || normalizedValue.startsWith("read")) {
    return "R";
  }

  if (normalizedValue === "k" || normalizedValue.startsWith("kine")) {
    return "K";
  }

  return String(value).toUpperCase().charAt(0);
};

// Mengambil seluruh lecture dari seluruh chapter
const getAllLectures = (course) => {
  if (!Array.isArray(course?.courseContent)) {
    return [];
  }

  return course.courseContent
    .filter((chapter) => {
      const chapterOrder = Number(chapter?.chapterOrder);

      return (
        chapterOrder > 2 &&
        chapter?.chapterId !== "pertemuan1" &&
        chapter?.chapterId !== "pertemuan2"
      );
    })
    .flatMap((chapter) =>
      Array.isArray(chapter?.chapterContent)
        ? chapter.chapterContent
        : []
    );
};

// Mengambil lecture yang sesuai modalitas dominan user
const getDominantLectures = (course, dominant) => {
  const normalizedDominant = normalizeVark(dominant);

  if (!normalizedDominant) {
    return [];
  }

  return getAllLectures(course).filter((lecture) => {
    return normalizeVark(lecture?.tags) === normalizedDominant;
  });
};

const MyEnrollment = () => {
  const {
    enrolledCourses,
    calculateCourseDuration,
    navigate,
    userData,
    fetUserEnrolledCourses,
    backendUrl,
    getToken,
  } = useContext(AppContext);

  const [progressArray, setProgressArray] = useState([]);

  const dominant =
    userData?.varkResult?.dominant ||
    userData?.vark?.dominant ||
    userData?.dominantVark ||
    null;

  const getCourseProgress = async () => {
    try {
      const token = await getToken();

      const tempProgressArray = await Promise.all(
        enrolledCourses.map(async (course) => {
          const { data } = await axios.post(
            `${backendUrl}/api/user/get-course-progress`,
            {
              courseId: course._id,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!data.success) {
            throw new Error(
              data.message || "Gagal mengambil progress course"
            );
          }

          // Lecture yang sesuai dengan VARK dominan user
          const dominantLectures = getDominantLectures(
            course,
            dominant
          );

          // ID lecture yang termasuk modalitas dominan
          const dominantLectureIds = new Set(
            dominantLectures
              .map((lecture) => lecture?.lectureId)
              .filter(Boolean)
          );

          // Semua lecture yang pernah diselesaikan user
          const completedLectureIds =
            data.progressData?.lectureCompleted || [];

          // Hanya hitung completed lecture yang sesuai modalitas dominan
          const lectureCompleted = completedLectureIds.filter(
            (lectureId) => dominantLectureIds.has(lectureId)
          ).length;

          return {
            totalLectures: dominantLectures.length,
            lectureCompleted,
            dominant: normalizeVark(dominant),
          };
        })
      );

      setProgressArray(tempProgressArray);
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (userData) {
      fetUserEnrolledCourses();
    }
  }, [userData]);

  useEffect(() => {
    if (userData && enrolledCourses.length > 0) {
      getCourseProgress();
    } else {
      setProgressArray([]);
    }
  }, [enrolledCourses, userData]);

  return (
    <>
      <div className="md:px-36 px-8 pt-10">
        <h1 className="text-2xl font-semibold">My Enrollment</h1>

        <table className="md:table-auto table-fixed w-full overflow-hidden mt-10">
          <thead className="text-gray-900 border-b border-gray-500/20 text-sm text-left max-sm:hidden">
            <tr>
              <th className="px-4 py-3 font-semibold truncate">
                Course
              </th>

              <th className="px-4 py-3 font-semibold truncate">
                Duration
              </th>

              <th className="px-4 py-3 font-semibold truncate">
                Completed
              </th>

              <th className="px-4 py-3 font-semibold truncate">
                Status
              </th>
            </tr>
          </thead>

          <tbody className="text-gray-700">
            {enrolledCourses.map((course, index) => {
              const progress = progressArray[index];

              const totalLectures = progress?.totalLectures || 0;
              const lectureCompleted =
                progress?.lectureCompleted || 0;

              const progressPercent =
                totalLectures > 0
                  ? (lectureCompleted * 100) / totalLectures
                  : 0;

              const isCompleted =
                totalLectures > 0 &&
                lectureCompleted === totalLectures;

              return (
                <tr
                  key={course._id}
                  className="border-b border-gray-500/20"
                >
                  <td className="md:px-4 pl-2 md:pl-4 py-3 flex items-center space-x-3">
                    <img
                      src={course.courseThumbnail}
                      alt={course.courseTitle}
                      className="w-14 sm:w-24 md:w-28"
                    />

                    <div className="flex-1">
                      <p className="mb-1 max-sm:text-sm">
                        {course.courseTitle}
                      </p>

                      <Line
                        strokeWidth={2}
                        percent={progressPercent}
                        className="bg-gray-300 rounded-full"
                      />
                    </div>
                  </td>

                  <td className="px-4 py-3 max-sm:hidden">
                    {calculateCourseDuration(course)}
                  </td>

                  <td className="px-4 py-3 max-sm:hidden">
                    {progress ? (
                      <>
                        {lectureCompleted} / {totalLectures}{" "}
                        <span>Lectures</span>
                      </>
                    ) : (
                      <span>Loading...</span>
                    )}
                  </td>

                  <td className="px-4 py-3 max-sm:text-right">
                    <button
                      onClick={() =>
                        navigate("/Player/" + course._id)
                      }
                      className={`px-3 sm:px-5 py-1.5 sm:py-2 max-sm:text-xs text-white cursor-pointer ${
                        isCompleted
                          ? "bg-green-600"
                          : "bg-blue-600"
                      }`}
                    >
                      {isCompleted ? "Completed" : "On Going"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Footer />
    </>
  );
};

export default MyEnrollment;