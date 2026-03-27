import AdminPositions from "./components/AdminPositions";
import TraineeForm from "./components/TraineeForm";
import ComparisonView from "./components/ComparisonView";

function App() {
  return (
    <div className="container">
      <h1>🎯 Trainee Evaluation System</h1>

      <div className="card">
        <AdminPositions />
      </div>

      <div className="card">
        <TraineeForm />
      </div>

      <div className="card">
        <ComparisonView />
      </div>
    </div>
  );
}

export default App;