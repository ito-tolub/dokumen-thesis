import React, { useContext } from "react";
import { Route, Routes, useMatch, Navigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";

import Home from "./pages/student/Home";
import CourseList from "./pages/student/CourseList";
import CourseDetail from "./pages/student/CourseDetail";
import MyEnrollment from "./pages/student/MyEnrollment";
import Player from "./pages/student/Player";
import Loading from "./components/student/Loading";
import VarkQuiz from "./pages/student/VarkQuiz";
import NppInput from "./pages/student/NppInput";
import TimelineBerita from "./pages/student/TimelineBerita";
import QuizPage from "./pages/student/QuizPage";

import Dashboard from "./pages/educator/Dashboard";
import AddCourse from "./pages/educator/AddCourse";
import MyCourses from "./pages/educator/MyCourses";
import StudentsEnrolled from "./pages/educator/StudentsEnrolled";
import StudentEngagement from "./pages/educator/StudentEngagement";

import Navbar from "./components/student/Navbar";
import { AppContext } from "./context/AppContext";

import "quill/dist/quill.snow.css";
import { ToastContainer } from "react-toastify";

const RequireOnboarding = ({ children }) => {
  const { isLoaded, isSignedIn, user } = useUser();
  const { userData, userLoading } = useContext(AppContext);

  if (!isLoaded) return <Loading />;

  if (!isSignedIn) return children;
  if (user?.publicMetadata?.role === "educator") return children;

  if (userLoading) return <Loading />;

  if (!userData) return children;

  if (!userData.npp) {
    return <Navigate to="/npp-input" replace />;
  }

  const vark = userData.varkResult;

  if (!vark || !vark.dominant) {
    return <Navigate to="/vark-quiz" replace />;
  }

  return children;
};

const App = () => {
  const isEducatorRoute = useMatch("/educator/*");

  return (
    <div className="text-default min-h-screen bg-white">
      <ToastContainer />

      {!isEducatorRoute && <Navbar />}

      <Routes>
        {/* =========================
            STUDENT
        ========================= */}

        <Route
          path="/"
          element={
            <RequireOnboarding>
              <Home />
            </RequireOnboarding>
          }
        />

        <Route path="/timeline" element={<TimelineBerita />} />

        <Route
          path="/course-list"
          element={
            <RequireOnboarding>
              <CourseList />
            </RequireOnboarding>
          }
        />

        <Route
          path="/course-list/:input"
          element={
            <RequireOnboarding>
              <CourseList />
            </RequireOnboarding>
          }
        />

        <Route
          path="/course/:id"
          element={
            <RequireOnboarding>
              <CourseDetail />
            </RequireOnboarding>
          }
        />

        <Route
          path="/my-enrollments"
          element={
            <RequireOnboarding>
              <MyEnrollment />
            </RequireOnboarding>
          }
        />

        <Route
          path="/player/:courseId"
          element={
            <RequireOnboarding>
              <Player />
            </RequireOnboarding>
          }
        />

        <Route
          path="/quiz/:quizId"
          element={
            <RequireOnboarding>
              <QuizPage />
            </RequireOnboarding>
          }
        />

        <Route path="/npp-input" element={<NppInput />} />
        <Route path="/vark-quiz" element={<VarkQuiz />} />
        <Route path="/loading/:path" element={<Loading />} />

        {/* =========================
            EDUCATOR
            Dashboard.jsx menjadi layout/sidebar.
            Pastikan Dashboard.jsx memiliki <Outlet />.
        ========================= */}

        <Route path="/educator" element={<Dashboard />}>
          <Route index element={<Navigate to="my-course" replace />} />

          <Route path="my-course" element={<MyCourses />} />

          <Route
            path="student-engagement"
            element={<StudentEngagement />}
          />

          <Route path="add-course" element={<AddCourse />} />

          <Route
            path="student-enrolled"
            element={<StudentsEnrolled />}
          />
        </Route>
      </Routes>
    </div>
  );
};

export default App;
