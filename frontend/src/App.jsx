import React, { useState } from "react";
import TraineeForm from "./components/TraineeForm";
import ReportManager from "./components/ReportManager";
import AdminPositions from "./components/AdminPositions"; // Import correct file
import "./styles/app.css";

function App() {
  const [activeTab, setActiveTab] = useState("evaluate");

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>TrainerHub</h2>
        </div>
        <nav className="sidebar-nav">
          <button 
            className={activeTab === "evaluate" ? "nav-item active" : "nav-item"}
            onClick={() => setActiveTab("evaluate")}
          >
            📋 Evaluate Trainee
          </button>
          
          <button 
            className={activeTab === "archive" ? "nav-item active" : "nav-item"}
            onClick={() => setActiveTab("archive")}
          >
            📊 Trainees
          </button>

          <div className="sidebar-divider"></div>
          
          <button 
            className={activeTab === "admin" ? "nav-item active" : "nav-item"}
            onClick={() => setActiveTab("admin")}
          >
            ⚙️ Manage Positions
          </button>
        </nav>
      </aside>

      <main className="main-content">
        {activeTab === "evaluate" && <TraineeForm />}
        {activeTab === "archive" && <ReportManager />}
        {activeTab === "admin" && <AdminPositions />}
      </main>
    </div>
  );
}

export default App;