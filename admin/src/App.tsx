import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import TopicsPage from "./pages/TopicsPage";
import UsersPage from "./pages/UsersPage";
import ConfigPage from "./pages/ConfigPage";
import PremiumPage from "./pages/PremiumPage";
import Layout from "./components/Layout";

function ProtectedRoutes() {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/topics" element={<TopicsPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/premium" element={<PremiumPage />} />
        <Route path="/config" element={<ConfigPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={<ProtectedRoutes />} />
      </Routes>
    </AuthProvider>
  );
}
