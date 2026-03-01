import { BrowserRouter as Router, Link, Navigate, Route, Routes } from "react-router-dom";

import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./contexts/AuthContext";
import DashboardPage from "./pages/Dashboard";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dashboard/:pageId" element={<DashboardPage />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

function HomePage() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center px-4 py-8 sm:px-6">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-12">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
          Welcome to MemoryEngine
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
          AI-powered knowledge management system
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/register"
            className="rounded-lg bg-slate-900 px-6 py-3 font-medium text-white transition hover:bg-slate-700"
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-medium text-slate-800 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default App;
