import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectIsAuthenticated, selectCurrentUser, setCredentials } from './redux/slices/authSlice';
import { selectToast, hideToast } from './redux/slices/uiSlice';

// Components
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import Loading from './components/common/Loading';
import Modal from './components/common/Modal';
import ProtectedRoute from './components/common/ProtectedRoute';
import Toast from './components/common/Toast';

// Pages
import LoginPage from './pages/auth/LoginPage';
import CandidateLogin from './pages/assessment/CandidateLogin';
import Precautions from './pages/assessment/Precautions';
import TakeAssessment from './pages/assessment/TakeAssessment';
import DashboardPage from './pages/dashboard/DashboardPage';
import CreateTest from './pages/test/CreateTest';
import TakeTest from './pages/test/TakeTest';
import TestReport from './pages/test/TestReport';
import TestManagement from './pages/TestManagement';
import NotFound from './pages/NotFound';
import PageStub from './pages/stubs/PageStub';
import UserManagement from './pages/UserManagement';
import AddUser from './pages/AddUser';
import CompanyManagement from './pages/CompanyManagement';
import Analytics from './pages/Analytics';
import QuestionBank from './pages/QuestionBank';
import BillingManagement from './pages/BillingManagement';
import TestLibrary from './pages/TestLibrary';
import SystemSettings from './pages/SystemSettings';
import AddCompany from './pages/AddCompany';
import TestRoute from './pages/TestRoute';
import CandidatesPage from './pages/candidates/CandidatesPage';
import AddCandidatePage from './pages/candidates/AddCandidatePage';
import CandidateProfilePage from './pages/candidates/CandidateProfilePage';
import EditCandidatePage from './pages/candidates/EditCandidatePage';
import InterviewListPage from './pages/interviews/InterviewListPage';
import ScheduleInterviewPage from './pages/interviews/ScheduleInterviewPage';
import InterviewDetailPage from './pages/interviews/InterviewDetailPage';

// Services
import { apiClient } from './services/apiClient';

function App() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);
  const toast = useSelector(selectToast);

  useEffect(() => {
    // Check if user is logged in on app start
    const token = localStorage.getItem('token');
    if (token && !currentUser) {
      // Verify token and get user data
      apiClient.get('/auth/me')
        .then(response => {
          dispatch(setCredentials({
            user: response.data.data,
            token
          }));
        })
        .catch(() => {
          localStorage.removeItem('token');
        });
    }
  }, [dispatch, currentUser]);

  useEffect(() => {
    // Auto-hide toast after duration
    if (toast.show) {
      const timer = setTimeout(() => {
        dispatch(hideToast());
      }, toast.duration);

      return () => clearTimeout(timer);
    }
  }, [toast, dispatch]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notifications */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => dispatch(hideToast())}
        />
      )}

      {/* Main App Layout */}
      {isAuthenticated ? (
        <div className="flex h-screen">
          {/* Sidebar */}
          <Sidebar />
          
          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <Header />
            
            {/* Page Content */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                
                {/* Dashboard */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />

                {/* Interviews */}
                <Route
                  path="/interviews"
                  element={
                    <ProtectedRoute requiredRole={["company","admin"]}>
                      <InterviewListPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/interviews/records"
                  element={
                    <ProtectedRoute requiredRole={["company","admin"]}>
                      <InterviewListPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/interviews/schedule"
                  element={
                    <ProtectedRoute requiredRole={["company","admin"]}>
                      <ScheduleInterviewPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/interviews/:id"
                  element={
                    <ProtectedRoute requiredRole={["company","admin"]}>
                      <InterviewDetailPage />
                    </ProtectedRoute>
                  }
                />
                
                {/* Test Management */}
                <Route
                  path="/tests"
                  element={
                    <ProtectedRoute>
                      <TestManagement />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/tests/create"
                  element={
                    <ProtectedRoute requiredRole={["company","admin"]}>
                      <CreateTest />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/tests/:id/edit"
                  element={
                    <ProtectedRoute requiredRole={["company","admin"]}>
                      <CreateTest />
                    </ProtectedRoute>
                  }
                />

                {/* Test Details (View) */}
                <Route
                  path="/tests/:id"
                  element={
                    <ProtectedRoute requiredRole={["company","admin"]}>
                      <TestRoute />
                    </ProtectedRoute>
                  }
                />
                
                {/* Test Taking */}
                <Route
                  path="/tests/:id/take"
                  element={
                    <ProtectedRoute>
                      <TakeTest />
                    </ProtectedRoute>
                  }
                />
                
                {/* Test Reports */}
                <Route
                  path="/tests/:id/report"
                  element={
                    <ProtectedRoute>
                      <TestReport />
                    </ProtectedRoute>
                  }
                />
                
                {/* User Management */}
                <Route
                  path="/users"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <UserManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/users/add"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AddUser />
                    </ProtectedRoute>
                  }
                />

                {/* Test Route */}
                <Route path="/test-route" element={<TestRoute />} />

                {/* Add Company - Must come before /companies */}
                <Route
                  path="/companies/add"
                  element={
                    <ProtectedRoute requiredRole="super_admin">
                      <AddCompany />
                    </ProtectedRoute>
                  }
                />

                {/* Company Management */}
                <Route
                  path="/companies"
                  element={
                    <ProtectedRoute requiredRole="super_admin">
                      <CompanyManagement />
                    </ProtectedRoute>
                  }
                />

                {/* Analytics Dashboard */}
                <Route
                  path="/analytics"
                  element={
                    <ProtectedRoute requiredRole={["super_admin","admin","company"]}>
                      <Analytics />
                    </ProtectedRoute>
                  }
                />

                {/* Question Bank */}
                <Route
                  path="/questions"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <QuestionBank />
                    </ProtectedRoute>
                  }
                />

                {/* Billing Management */}
                <Route
                  path="/billing"
                  element={
                    <ProtectedRoute requiredRole="super-admin">
                      <BillingManagement />
                    </ProtectedRoute>
                  }
                />

                {/* Test Library */}
                <Route
                  path="/test-library"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <TestLibrary />
                    </ProtectedRoute>
                  }
                />

                {/* System Settings */}
                <Route
                  path="/system-settings"
                  element={
                    <ProtectedRoute requiredRole="super_admin">
                      <SystemSettings />
                    </ProtectedRoute>
                  }
                />

                {/* Candidates Management */}
                <Route
                  path="/candidates"
                  element={
                    <ProtectedRoute requiredRole="company">
                      <CandidatesPage />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/candidates/add"
                  element={
                    <ProtectedRoute requiredRole="company">
                      <AddCandidatePage />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/candidates/:id"
                  element={
                    <ProtectedRoute requiredRole="company">
                      <CandidateProfilePage />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/candidates/:id/edit"
                  element={
                    <ProtectedRoute requiredRole="company">
                      <EditCandidatePage />
                    </ProtectedRoute>
                  }
                />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </div>
      ) : (
        // Unauthenticated Routes (includes candidate assessment flow)
        <Routes>
          {/* Admin/Company Auth */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<AddUser />} />

          {/* Candidate Assessment Flow */}
          <Route path="/assessment-login" element={<CandidateLogin />} />
          <Route path="/assessment/precautions" element={<Precautions />} />
          <Route path="/assessment/take/:testId" element={<TakeAssessment />} />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}

      {/* Global Modal */}
      <Modal />
      
      {/* Global Loading */}
      <Loading />
      
      {/* Global Toast Notifications */}
      <Toast />
    </div>
  );
}

export default App;
