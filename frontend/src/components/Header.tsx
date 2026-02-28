import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="text-lg font-semibold tracking-tight text-slate-900">
          MemoryEngine
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className="rounded-md px-3 py-2 text-slate-700 transition hover:bg-slate-100"
              >
                Dashboard
              </Link>
              <div className="hidden rounded-md bg-slate-100 px-3 py-2 text-slate-600 sm:block">
                {user?.email} ({user?.role})
              </div>
              <button
                onClick={handleLogout}
                className="rounded-md bg-slate-900 px-3 py-2 font-medium text-white transition hover:bg-slate-700"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-md px-3 py-2 text-slate-700 transition hover:bg-slate-100"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-md bg-slate-900 px-3 py-2 font-medium text-white transition hover:bg-slate-700"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
