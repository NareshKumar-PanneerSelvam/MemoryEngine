import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";

import DashboardPage from "./pages/Dashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard/:pageId" element={<DashboardPage />} />
      </Routes>
    </Router>
  );
}

export default App;
