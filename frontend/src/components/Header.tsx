import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          to="/"
          className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100"
        >
          MemoryEngine
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          <button
            onClick={toggleTheme}
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {theme === "dark" ? "Light" : "Dark"}
          </button>
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className="rounded-md px-3 py-2 text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Dashboard
              </Link>
              <div className="hidden rounded-md bg-slate-100 px-3 py-2 text-slate-600 dark:bg-slate-800 dark:text-slate-300 sm:block">
                {(user?.name || user?.username || user?.email) ?? "User"} ({user?.role})
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
                className="rounded-md px-3 py-2 text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
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
