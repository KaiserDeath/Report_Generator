import { useState, useEffect } from "react";
import { API_URL } from "../api/api";

function TraineeForm() {
  const [positions, setPositions] = useState([]);
  const [skills, setSkills] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState("");
  const [traineeName, setTraineeName] = useState("");
  const [scores, setScores] = useState({});
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/positions`)
      .then((res) => res.json())
      .then((data) => setPositions(data || []));
  }, []);

  const handlePositionChange = async (e) => {
    const posId = e.target.value;
    setSelectedPosition(posId);
    setScores({});
    setResult(null);

    if (!posId) return;

    try {
      const res = await fetch(`${API_URL}/positions/${posId}/weights`);
      const data = await res.json();
      setSkills(data || []);
    } catch (err) {
      console.error("Error loading skills", err);
    }
  };

  const handleScoreChange = (skillId, value) => {
    setScores({ ...scores, [skillId]: value === "" ? null : Number(value) });
  };

  const handleSubmit = async () => {
    if (!selectedPosition || !traineeName) return alert("Fill Name and Position");

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/evaluations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainee_name: traineeName,
          position_id: selectedPosition,
          evaluation: scores,
        }),
      });

      if (!res.ok) throw new Error("Submission failed");

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      alert("Submission error. Check terminal for Gemini errors.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const groupedSkills = skills.reduce((acc, skill) => {
    const cat = skill.category_name || "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {});

  return (
    <div className="container">
      <h1>Trainee Evaluation</h1>

      <div className="card">
        <div className="grid">
          <div>
            <label>Trainee Name</label>
            <input
              type="text"
              placeholder="Enter name"
              value={traineeName}
              onChange={(e) => setTraineeName(e.target.value)}
            />
          </div>
          <div>
            <label>Position</label>
            <select value={selectedPosition} onChange={handlePositionChange}>
              <option value="">Select a Position</option>
              {positions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {selectedPosition && skills.length > 0 && (
        <div className="grid">
          {Object.keys(groupedSkills).map((catName) => (
            <div key={catName} className="card">
              <h2>{catName}</h2>
              {groupedSkills[catName].map((skill) => (
                <div key={skill.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                  <span>{skill.name}</span>
                  <input
                    type="number"
                    min="0" max="100"
                    value={scores[skill.id] ?? ""}
                    onChange={(e) => handleScoreChange(skill.id, e.target.value)}
                    style={{ width: "60px" }}
                  />
                </div>
              ))}
            </div>
          ))}

          <div className="full-width">
            <button onClick={handleSubmit} disabled={isSubmitting} style={{ width: "100%" }}>
              {isSubmitting ? "Generating AI Report..." : "Submit Evaluation"}
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className="card" style={{ borderTop: "5px solid #4a6cf7", marginTop: "20px" }}>
          <h2>Result: {result.generalEvaluation}%</h2>
          <div className="grid">
            {Object.entries(result.categoryBreakdown).map(([cat, score]) => (
              <p key={cat}><strong>{cat}:</strong> {score}%</p>
            ))}
          </div>
          <hr style={{ margin: "20px 0", opacity: 0.2 }} />
          <div>
            <h3 style={{ color: "#4a6cf7" }}>🤖 Gemini AI Insights</h3>
            <p style={{ fontStyle: "italic", whiteSpace: "pre-wrap", color: "#444" }}>
              {result.aiFeedback}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default TraineeForm;