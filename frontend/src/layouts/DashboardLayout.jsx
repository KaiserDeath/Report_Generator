import { Outlet, Link, useLocation } from "react-router-dom";

function DashboardLayout() {
  const location = useLocation();
  
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>TrainerHub</h2>
        </div>
        <nav className="sidebar-nav">
          <Link 
            to="/evaluate" 
            className={location.pathname === "/evaluate" ? "nav-item active" : "nav-item"}
          >
            📋 Evaluate Trainee
          </Link>
          
          <Link 
            to="/archive" 
            className={location.pathname === "/archive" ? "nav-item active" : "nav-item"}
          >
            📊 Trainees
          </Link>

          <div className="sidebar-divider"></div>
          
          <Link 
            to="/admin" 
            className={location.pathname === "/admin" ? "nav-item active" : "nav-item"}
          >
            ⚙️ Manage Positions
          </Link>
        </nav>
      </aside>

      <main className="main-content">
        {/* Outlet acts as a window that swaps TraineeForm, ReportManager, etc. */}
        <Outlet /> 
      </main>
    </div>
  );
}

export default DashboardLayout; // <--- This makes it visible to App.jsx