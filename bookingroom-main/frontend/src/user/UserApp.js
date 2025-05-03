import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import SearchSpace from './components/SearchSpace';
import Register from './components/Register';
import Profile from './components/Profile';
import Notifications from './components/Notifications';
import History from './components/History';
import CheckIn from './components/CheckIn';
import Rating from './components/Rating';

function UserApp() {
  return (
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route
        path="/search"
        element={
          <ProtectedRoute>
            <SearchSpace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <History />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checkin"
        element={
          <ProtectedRoute>
            <CheckIn />
          </ProtectedRoute>
        }
      />
      <Route
        path="/rating"
        element={
          <ProtectedRoute>
            <Rating />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<SearchSpace />} />
    </Routes>
  );
}

export default UserApp;