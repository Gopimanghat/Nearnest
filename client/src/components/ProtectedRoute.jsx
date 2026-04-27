import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function ProtectedRoute({ children }) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setIsAuthenticated(Boolean(session));
      setIsChecking(false);
    };

    checkSession();
  }, []);

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        Checking session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export function AdminRoute({ children }) {
  const ADMIN_EMAIL = "gopimathilakath@gmail.com";

  const [user, setUser] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });
  }, []);

  // Still loading
  if (user === undefined) return <div>Loading...</div>;

  // Not logged in
  if (user === null) return <Navigate to="/login" />;

  // Logged in but not admin
  if (user.email !== "gopimathilakath@gmail.com")
    return (
      <div style={{ padding: "2rem", color: "red" }}>
        Access Denied. Admins only.
      </div>
    );

  // Admin confirmed
  return children;
}

export default ProtectedRoute;
