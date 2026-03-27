import { useState, useEffect } from "react";
import { API_URL } from "../api/api";

function AdminPositions() {
  const [positions, setPositions] = useState([]);
  const [skills, setSkills] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState("");
  const [weights, setWeights] = useState({});

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

  // Handle weight change
  const handleWeightChange = (skillId, value) => {
    setWeights({
      ...weights,
      [skillId]: Number(value),
    });
  };

  // Save weights
  const saveWeights = async () => {
    const total = Object.values(weights).reduce((a, b) => a + b, 0);

    if (total !== 1) {
      alert("Total weight must equal 1 (100%)");
      return;
    }

    await fetch(`${API_URL}/positions/${selectedPosition}/weights`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(weights),
    });

    alert("Weights saved!");
  };

  return (
    <div>
      <h2>Assign Weights</h2>

      {/* Select position */}
      <select onChange={(e) => setSelectedPosition(e.target.value)}>
        <option value="">Select Position</option>
        {positions.map((pos) => (
          <option key={pos.id} value={pos.id}>
            {pos.name}
          </option>
        ))}
      </select>

      {/* Skills list */}
      {selectedPosition && (
        <div>
          <h3>Weights</h3>

          {skills.map((skill) => (
            <div key={skill.id}>
              <label>{skill.name}</label>
              <input
                type="number"
                step="0.01"
                onChange={(e) =>
                  handleWeightChange(skill.id, e.target.value)
                }
              />
            </div>
          ))}

          <button onClick={saveWeights}>Save Weights</button>
        </div>
      )}
    </div>
  );
}

export default AdminPositions;