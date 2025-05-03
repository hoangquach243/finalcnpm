import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import BuildingDashboard from './components/BuildingDashboard';
import UserInfo from './components/UserInfo';
import UserManagement from './components/UserManagement';
import SpaceManagement from './components/SpaceManagement';
import AdminRegister from './components/Register';

function AdminApp() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <BuildingDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/user"
        element={
          <ProtectedRoute>
            <UserInfo />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <UserManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/spaces"
        element={
          <ProtectedRoute>
            <SpaceManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/register"
        element={<AdminRegister />}
      />
    </Routes>
  );
}

export default AdminApp;