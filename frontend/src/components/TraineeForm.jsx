import { useState, useEffect } from "react";
import { API_URL } from "../api/api";

function TraineeForm() {
  const [positions, setPositions] = useState([]);
  const [skills, setSkills] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState("");
  const [traineeName, setTraineeName] = useState("");
  const [scores, setScores] = useState({});
  const [finalScore, setFinalScore] = useState(null);

  // Fetch positions
  const fetchPositions = async () => {
    const res = await fetch(`${API_URL}/positions`);
    const data = await res.json();
    setPositions(data);
  };

  // Fetch skills
  const fetchSkills = async () => {
    const res = await fetch(`${API_URL}/positions/skills/all`);
    const data = await res.json();
    setSkills(data);
  };

  useEffect(() => {
    fetchPositions();
    fetchSkills();
  }, []);

  // Handle score input
  const handleScoreChange = (skillId, value) => {
    setScores({
      ...scores,
      [skillId]: Number(value),
    });
  };

  // Submit evaluation
  const handleSubmit = async () => {
    if (!selectedPosition || !traineeName) {
      alert("Fill all fields");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/evaluate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trainee_name: traineeName,
          position_id: selectedPosition,
          evaluation: scores,
        }),
      });

      const data = await res.json();
      setFinalScore(data.score);

    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2>Evaluate Trainee</h2>

      {/* Trainee Name */}
      <input
        type="text"
        placeholder="Trainee Name"
        value={traineeName}
        onChange={(e) => setTraineeName(e.target.value)}
      />

      {/* Position */}
      <select onChange={(e) => setSelectedPosition(e.target.value)}>
        <option value="">Select Position</option>
        {positions.map((pos) => (
          <option key={pos.id} value={pos.id}>
            {pos.name}
          </option>
        ))}
      </select>

      {/* Skills Inputs */}
      {selectedPosition && (
        <div>
          <h3>Scores (1–10)</h3>

          {skills.map((skill) => (
            <div key={skill.id}>
              <label>{skill.name}</label>
              <input
                type="number"
                min="1"
                max="10"
                onChange={(e) =>
                  handleScoreChange(skill.id, e.target.value)
                }
              />
            </div>
          ))}

          <button onClick={handleSubmit}>Calculate Score</button>
        </div>
      )}

      {/* Result */}
      {finalScore !== null && (
        <h3>Final Score: {finalScore}</h3>
      )}
    </div>
  );
}

export default TraineeForm;