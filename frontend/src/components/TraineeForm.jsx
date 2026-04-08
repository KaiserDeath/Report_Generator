import { useState, useEffect } from "react";
import { API_URL } from "../api/api";
import Swal from "sweetalert2"; // 1. Import SweetAlert2

function TraineeForm() {
  const [positions, setPositions] = useState([]);
  const [skills, setSkills] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState("");
  const [traineeName, setTraineeName] = useState("");
  const [scores, setScores] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Training Window States
  const [trainingStart, setTrainingStart] = useState("");
  const [trainingEnd, setTrainingEnd] = useState("");

  // Modal & Result States
  const [showModal, setShowModal] = useState(false);
  const [result, setResult] = useState(null);
  const [trainerNotes, setTrainerNotes] = useState("");

  // Edit Lock State
  const [isEditing, setIsEditing] = useState(false);

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
    const cleanValue = value.replace(/[^0-9]/g, "");
    const numValue = cleanValue === "" ? "" : parseInt(cleanValue, 10);

    if (numValue === "" || (numValue >= 0 && numValue <= 100)) {
      setScores({ ...scores, [skillId]: numValue === "" ? null : numValue });
    }
  };

  const handleSubmit = async () => {
    // 2. SweetAlert2 Validation Replacement
    if (!selectedPosition || !traineeName || !trainingStart || !trainingEnd) {
      return Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please fill in the Name, Position, and Training Dates before submitting.",
        confirmButtonColor: "#4a6cf7"
      });
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/evaluations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainee_name: traineeName,
          position_id: selectedPosition,
          evaluation: scores,
          training_start: trainingStart,
          training_end: trainingEnd,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");

      setResult(data);
      setIsEditing(false); 
      setShowModal(true);
      
      // Success Toast after submission
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Analysis complete!',
        showConfirmButton: false,
        timer: 2000
      });

    } catch (err) {
      Swal.fire("Submission Error", err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!result || !result.id) return;

    try {
      const res = await fetch(`${API_URL}/evaluations/${result.id}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: trainerNotes }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save");
      }

      // 3. SweetAlert2 Final Success Notification
      await Swal.fire({
        icon: "success",
        title: "Report Finalized",
        text: "The evaluation has been successfully archived.",
        timer: 2500,
        showConfirmButton: false
      });

      setShowModal(false);
      setIsEditing(false); 
      
      // Reset Form
      setTraineeName("");
      setSelectedPosition("");
      setScores({});
      setTrainerNotes("");
      setTrainingStart("");
      setTrainingEnd("");
      setResult(null);
    } catch (err) {
      Swal.fire("Save Error", err.message, "error");
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
              value={traineeName} 
              onChange={(e) => setTraineeName(e.target.value)} 
              placeholder="Enter full name"
            />
          </div>
          <div>
            <label>Position</label>
            <select value={selectedPosition} onChange={handlePositionChange}>
              <option value="">Select a Position</option>
              {positions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label>Training Start</label>
            <input 
              type="date" 
              value={trainingStart} 
              onChange={(e) => setTrainingStart(e.target.value)} 
            />
          </div>
          <div>
            <label>Training End</label>
            <input 
              type="date" 
              value={trainingEnd} 
              onChange={(e) => setTrainingEnd(e.target.value)} 
            />
          </div>
        </div>
      </div>

      {selectedPosition && (
        <div className="grid">
          {Object.keys(groupedSkills).map((catName) => (
            <div key={catName} className="card">
              <h2>{catName}</h2>
              {groupedSkills[catName].map((skill) => (
                <div key={skill.id} className="skill-row">
                  <span>{skill.name}</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={scores[skill.id] ?? ""}
                    onKeyDown={(e) => {
                        if (["e", "E", "+", "-", "."].includes(e.key)) {
                          e.preventDefault();
                        }
                    }}
                    onChange={(e) => handleScoreChange(skill.id, e.target.value)}
                    className="score-input"
                  />
                </div>
              ))}
            </div>
          ))}
          <div className="full-width">
            <button onClick={handleSubmit} disabled={isSubmitting} className="btn-success">
              {isSubmitting ? "🤖 AI Analyzing..." : "Submit Evaluation"}
            </button>
          </div>
        </div>
      )}

      {showModal && result && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Evaluation Complete: {traineeName}</h2>
            
            <div className="ai-feedback-section">
              <h4>🤖 AI Report Insights (Score: {result.generalEvaluation}%)</h4>
              <p>{result.aiFeedback}</p>
            </div>

            <div className="trainer-note-area">
              <div className="note-header">
                <label>✍️ Trainer Notes:</label>
                <button 
                  type="button" 
                  className="btn-small" 
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? "🔓 Lock Notes" : "📝 Edit Notes"}
                </button>
              </div>
              
              <textarea 
                placeholder={isEditing ? "Write observations here..." : "Notes are locked. Click Edit to add feedback."}
                value={trainerNotes}
                onChange={(e) => setTrainerNotes(e.target.value)}
                disabled={!isEditing}
                className={!isEditing ? "readonly-textarea" : ""}
              />
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Close</button>
              <button 
                onClick={handleSaveNotes} 
                className="btn-primary"
                disabled={!isEditing && trainerNotes === ""}
              >
                Save & Finalize
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TraineeForm;