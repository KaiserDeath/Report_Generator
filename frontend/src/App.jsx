import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import TraineeForm from "./components/TraineeForm";
import ReportManager from "./components/ReportManager";
import AdminPositions from "./components/AdminPositions";
import PrintableReport from "./components/PrintableReport"; // Your new print-only component
import DashboardLayout from "./layouts/DashboardLayout"; // We'll move your sidebar logic here
import "./styles/app.css";

function App() {
  return (
    <Router>
      <Routes>
        {/* 1. PUBLIC PRINT ROUTE (Accessible by Puppeteer) */}
        <Route path="/report-print/:id" element={<PrintableReport />} />

        {/* 2. DASHBOARD ROUTES (The main UI) */}
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/evaluate" replace />} />
          <Route path="evaluate" element={<TraineeForm />} />
          <Route path="archive" element={<ReportManager />} />
          <Route path="admin" element={<AdminPositions />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;