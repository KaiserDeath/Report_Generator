import AdminPositions from "./components/AdminPositions";
import TraineeForm from "./components/TraineeForm";
import ComparisonView from "./components/ComparisonView";

function App() {
  return (
    <div className="container">
      <h1 style={{ textAlign: "center" }}>
        🎯 Trainee Evaluation System
      </h1>

      <div className="grid">
        <div className="card">
          <h2>⚙️ Manage Positions</h2>
          <AdminPositions />
        </div>

        <div className="card">
          <h2>📝 Evaluate Trainee</h2>
          <TraineeForm />
        </div>

        <div className="card full-width">
          <h2>📊 Comparison</h2>
          <ComparisonView />
        </div>
      </div>
    </div>
  );
}

export default App;