import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';
import Signup from './components/Signup';

// Create a wrapper component that uses useNavigate
const ProtectedRouteWrapper = ({ children, isAdmin = false }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userIsAdmin = localStorage.getItem('isAdmin') === '1';

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (isAdmin && !userIsAdmin) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route 
          path="/admin" 
          element={
            <ProtectedRouteWrapper isAdmin={true}>
              <AdminDashboard />
            </ProtectedRouteWrapper>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRouteWrapper>
              <Dashboard />
            </ProtectedRouteWrapper>
          } 
        />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;