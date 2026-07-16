import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';

import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ResetPassword from '@/pages/auth/ResetPassword';
import VerifyCertificate from '@/pages/VerifyCertificate';
import NotFound from '@/pages/NotFound';

import AdminDashboard from '@/pages/admin/Dashboard';
import AdminStudents from '@/pages/admin/Students';
import AdminStudentDetail from '@/pages/admin/StudentDetail';
import AdminCourses from '@/pages/admin/Courses';
import AdminCourseBuilder from '@/pages/admin/CourseBuilder';
import AdminAssignments from '@/pages/admin/Assignments';
import AdminAssignmentDetail from '@/pages/admin/AssignmentDetail';
import AdminTests from '@/pages/admin/Tests';
import AdminTestBuilder from '@/pages/admin/TestBuilder';
import AdminTestResults from '@/pages/admin/TestResults';
import AdminCertificates from '@/pages/admin/Certificates';
import AdminPlacements from '@/pages/admin/Placements';
import AdminNotifications from '@/pages/admin/Notifications';
import AdminSettings from '@/pages/admin/Settings';

import StudentDashboard from '@/pages/student/Dashboard';
import StudentCourses from '@/pages/student/Courses';
import StudentCourseView from '@/pages/student/CourseView';
import StudentAssignments from '@/pages/student/Assignments';
import StudentAssignmentDetail from '@/pages/student/AssignmentDetail';
import StudentTests from '@/pages/student/Tests';
import StudentTestAttempt from '@/pages/student/TestAttempt';
import StudentCertificates from '@/pages/student/Certificates';
import StudentPlacements from '@/pages/student/Placements';
import StudentNotifications from '@/pages/student/Notifications';
import StudentSettings from '@/pages/student/Settings';

function RootRedirect() {
  const { isAuthenticated, user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify-certificate/:certificateId" element={<VerifyCertificate />} />

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/students" element={<AdminStudents />} />
            <Route path="/admin/students/:id" element={<AdminStudentDetail />} />
            <Route path="/admin/courses" element={<AdminCourses />} />
            <Route path="/admin/courses/:id" element={<AdminCourseBuilder />} />
            <Route path="/admin/assignments" element={<AdminAssignments />} />
            <Route path="/admin/assignments/:id" element={<AdminAssignmentDetail />} />
            <Route path="/admin/tests" element={<AdminTests />} />
            <Route path="/admin/tests/new" element={<AdminTestBuilder />} />
            <Route path="/admin/tests/:id/edit" element={<AdminTestBuilder />} />
            <Route path="/admin/tests/:id/results" element={<AdminTestResults />} />
            <Route path="/admin/certificates" element={<AdminCertificates />} />
            <Route path="/admin/placements" element={<AdminPlacements />} />
            <Route path="/admin/notifications" element={<AdminNotifications />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['student']} />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/courses" element={<StudentCourses />} />
            <Route path="/student/courses/:id" element={<StudentCourseView />} />
            <Route path="/student/assignments" element={<StudentAssignments />} />
            <Route path="/student/assignments/:id" element={<StudentAssignmentDetail />} />
            <Route path="/student/tests" element={<StudentTests />} />
            <Route path="/student/tests/:id/attempt" element={<StudentTestAttempt />} />
            <Route path="/student/certificates" element={<StudentCertificates />} />
            <Route path="/student/placements" element={<StudentPlacements />} />
            <Route path="/student/notifications" element={<StudentNotifications />} />
            <Route path="/student/settings" element={<StudentSettings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
