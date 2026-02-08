import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";

// User Pages
import AuthPage from "./pages/AuthPage";
import ProfileSetup from "./pages/ProfileSetup";
import Dashboard from "./pages/Dashboard";
import Team from "./pages/Team";
import Wallet from "./pages/Wallet";
import Income from "./pages/Income";
import Transactions from "./pages/Transactions";
import Profile from "./pages/Profile";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";

// Admin Pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUserDetail from "./pages/admin/AdminUserDetail";
import AdminLevels from "./pages/admin/AdminLevels";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminContent from "./pages/admin/AdminContent";

// Layouts
import UserLayout from "./layouts/UserLayout";
import AdminLayout from "./layouts/AdminLayout";

// Auth Guards
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("gembot_token");
  if (!token) return <Navigate to="/auth" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem("gembot_admin_token");
  if (!token) return <Navigate to="/admin/login" replace />;
  return children;
};

function App() {
  return (
    <div className="App min-h-screen bg-[#FDFCF8]">
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          
          {/* User Routes */}
          <Route path="/setup" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />
          <Route path="/" element={<ProtectedRoute><UserLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="team" element={<Team />} />
            <Route path="wallet" element={<Wallet />} />
            <Route path="income" element={<Income />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="users/:userId" element={<AdminUserDetail />} />
            <Route path="levels" element={<AdminLevels />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="transactions" element={<AdminTransactions />} />
            <Route path="content" element={<AdminContent />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" richColors />
    </div>
  );
}

export default App;
