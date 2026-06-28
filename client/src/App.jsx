import React, { useContext } from 'react'
import { Route, Routes, useMatch, Navigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import Home from './pages/student/Home'
import CourseList from './pages/student/CourseList'
import CourseDetail from './pages/student/CourseDetail'
import MyEnrollment from './pages/student/MyEnrollment'
import Player from './pages/student/Player'
import Loading from './components/student/Loading'
import VarkQuiz from './pages/student/VarkQuiz'
import NppInput from './pages/student/NppInput'
import Educator from './pages/educator/Educator'
import Dashboard from './pages/educator/Dashboard'
import AddCourse from './pages/educator/AddCourse'
import MyCourses from './pages/educator/MyCourses'
import StudentsEnrolled from './pages/educator/StudentsEnrolled'
import StudentEngagement from './pages/educator/StudentEngagement'
import Navbar from './components/student/Navbar'
import TimelineBerita from './pages/student/TimelineBerita'
import { AppContext } from './context/AppContext'
import "quill/dist/quill.snow.css";
import { ToastContainer, toast } from 'react-toastify';

// Gerbang onboarding: praja wajib mengisi NPP lalu VARK sebelum mengakses halaman.
// Dicek pada setiap navigasi (bukan sekali saat login), sehingga tidak bisa di-bypass.
const RequireOnboarding = ({ children }) => {
  const { isLoaded, isSignedIn, user } = useUser()
  const { userData, userLoading } = useContext(AppContext)

  // Clerk belum siap → tampilkan loader
  if (!isLoaded) return <Loading />

  // Belum login atau akun educator → tidak digerbang
  if (!isSignedIn) return children
  if (user?.publicMetadata?.role === 'educator') return children

  // Data praja masih dimuat → loader (tidak selamanya; lihat AppContext)
  if (userLoading) return <Loading />

  // Data tidak tersedia (akun baru / record belum dibuat) → jangan hang,
  // izinkan masuk agar tidak nyangkut di loading
  if (!userData) return children

  // Wajib NPP dulu
  if (!userData.npp) return <Navigate to="/npp-input" replace />

  // Wajib VARK
  const vark = userData.varkResult
  if (!vark || !vark.dominant) return <Navigate to="/vark-quiz" replace />

  return children
}

const App = () => {

  const isEducatorRoute = useMatch('/educator/*')

  return (
    <div className='text-default min-h-screen bg-white'>
      <ToastContainer/>
      {!isEducatorRoute && <Navbar />}

      <Routes>
        <Route path='/' element={<RequireOnboarding><Home /></RequireOnboarding>}/>
        <Route path='/timeline' element={<TimelineBerita />} />
        <Route path='/course-list' element={<RequireOnboarding><CourseList /></RequireOnboarding>}/>
        <Route path='/course-list/:input' element={<RequireOnboarding><CourseList /></RequireOnboarding>}/>
        <Route path='/course/:id' element={<RequireOnboarding><CourseDetail /></RequireOnboarding>}/>
        <Route path='/my-enrollments' element={<RequireOnboarding><MyEnrollment /></RequireOnboarding>}/>
        <Route path='/player/:courseId' element={<RequireOnboarding><Player /></RequireOnboarding>}/>

        {/* Halaman onboarding — TIDAK digerbang (agar tidak loop tak berujung) */}
        <Route path='/npp-input' element={<NppInput />}/>
        <Route path='/vark-quiz' element={<VarkQuiz />}/>
        <Route path='/loading/:path' element={<Loading />}/>

        <Route path='/student-engagement' element={<StudentEngagement />}/>
        <Route path='/educator' element={<Educator/>}>
          <Route index element={<Dashboard/>}/>
          <Route path='add-course' element={<AddCourse/>}/>
          <Route path='my-course' element={<MyCourses/>}/>
          <Route path='student-enrolled' element={<StudentsEnrolled/>}/>
          <Route path='student-engagement' element={<StudentEngagement/>}/>
        </Route>
      </Routes>
    </div>
  )
}

export default App
