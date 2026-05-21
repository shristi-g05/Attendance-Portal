import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Attendance from './pages/Attendance';
import WebcamSession from './pages/WebcamSession';

// Simple Layout wrapper that displays the Sidebar alongside protected pages
const AppLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Sidebar - fixed left */}
      <Sidebar />

      {/* Main Panel Content Area */}
      <main className="pl-64 min-h-screen">
        <div className="max-w-7xl mx-auto p-8 md:p-10">
          {children}
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Login Portal */}
        <Route path="/login" element={<Login />} />

        {/* Protected Dashboard Core Routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/webcam-session" 
          element={
            <ProtectedRoute>
              <AppLayout>
                <WebcamSession />
              </AppLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/students" 
          element={
            <ProtectedRoute>
              <AppLayout>
                <Students />
              </AppLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/attendance" 
          element={
            <ProtectedRoute>
              <AppLayout>
                <Attendance />
              </AppLayout>
            </ProtectedRoute>
          } 
        />

        {/* Catch-all redirect to Dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
