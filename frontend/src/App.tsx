import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { TracksPage } from './pages/TracksPage';
import { LocationsPage } from './pages/LocationsPage';
import { NewTrackPage } from './pages/NewTrackPage';
import { TrackViewer } from './components/TrackViewer';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Публичные маршруты */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Защищенные маршруты */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tracks"
          element={
            <ProtectedRoute>
              <Layout>
                <TracksPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tracks/new"
          element={
            <ProtectedRoute>
              <Layout>
                <NewTrackPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tracks/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <TrackViewer />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/locations"
          element={
            <ProtectedRoute>
              <Layout>
                <LocationsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        {/* Перенаправление по умолчанию */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App; 