import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import RestaurantDetailPage from "./pages/RestaurantDetailPage";
import OwnerDashboardPage from "./pages/OwnerDashboardPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRestaurants from "./pages/AdminRestaurants";
import AdminOwners from "./pages/AdminOwners";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ProtectedRoute, { AdminRoute } from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/restaurant/:id" element={<RestaurantDetailPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/owner/dashboard"
        element={
          <ProtectedRoute>
            <OwnerDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/restaurants"
        element={
          <AdminRoute>
            <AdminRestaurants />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/owners"
        element={
          <AdminRoute>
            <AdminOwners />
          </AdminRoute>
        }
      />
    </Routes>
  );
}

export default App;
