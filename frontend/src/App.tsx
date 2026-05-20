import { Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "./layouts/AppLayout";
import { AuthLayout } from "./layouts/AuthLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";

import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { CandidatesPage } from "./pages/CandidatesPage";
import { NewCandidatePage } from "./pages/NewCandidatePage";
import { CandidateDetailPage } from "./pages/CandidateDetailPage";

/**
 * Routing tree.
 *
 * Auth pages live under <AuthLayout/>. Everything else is behind
 * <ProtectedRoute/> + <AppLayout/>. The root "/" redirects to the
 * dashboard, which itself redirects to /login if there's no token.
 */
export default function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/candidates" element={<CandidatesPage />} />
          <Route path="/candidates/new" element={<NewCandidatePage />} />
          <Route path="/candidates/:id" element={<CandidateDetailPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
