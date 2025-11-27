import { Routes, Route, Navigate } from "react-router-dom";
import { PublicLayout } from "./layouts";
import { Home, Login, Register } from "./modules";
import { DashboardPage } from "./modules/dashboard/DashboardPage";
import { FileUploadPage } from "./modules/files/pages/FileUploadPage";
import { ProtectedRoute, PublicRoute } from "./components";
import { isAuthenticated } from "./shared/utils/auth";

function App() {
  return (
    <Routes>
      {/* Redirect root - check if user is authenticated */}
      <Route
        path="/"
        element={
          isAuthenticated() ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/home" replace />
          )
        }
      />

      {/* PUBLIC ROUTES - redirect to dashboard if already logged in */}
      <Route element={<PublicLayout />}>
        <Route
          path="/home"
          element={
            <PublicRoute>
              <Home />
            </PublicRoute>
          }
        />
        <Route
          path="/register/*"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/login/*"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
      </Route>

      {/* PROTECTED ROUTES - require authentication */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/upload"
        element={
          <ProtectedRoute>
            <FileUploadPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
