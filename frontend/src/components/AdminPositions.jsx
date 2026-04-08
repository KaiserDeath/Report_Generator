import { useState, useEffect } from "react";
import { API_URL } from "../api/api";

function AdminPositions() {
  const [positions, setPositions] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState("");
  const [weights, setWeights] = useState({});
  const [catWeights, setCatWeights] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/positions`).then(res => res.json()).then(setPositions);
    fetch(`${API_URL}/positions/skills/all`).then(res => res.json()).then(setAllSkills);
  }, []);

  const handlePositionChange = async (e) => {
    const posId = e.target.value;
    setSelectedPosition(posId);
    setIsEditing(false); 
    if (!posId) return;

    const res = await fetch(`${API_URL}/positions/${posId}/weights`);
    const data = await res.json();
    
    const newWeights = {};
    const newCatWeights = {};
    data.forEach(item => {
      newWeights[item.id] = item.weight;
      if (item.category_id) newCatWeights[item.category_id] = item.cat_global_weight;
    });
    setWeights(newWeights);
    setCatWeights(newCatWeights);
  };

  const groupedSkills = allSkills.reduce((acc, skill) => {
    const catName = skill.category_name || "Uncategorized"; 
    if (!acc[catName]) {
      acc[catName] = { id: skill.category_id, skills: [] };
    }
    acc[catName].skills.push(skill);
    return acc;
  }, {});

  const saveAll = async () => {
    const totalGlobal = Object.values(catWeights).reduce((a, b) => a + (Number(b) || 0), 0);
    if (Math.round(totalGlobal * 100) !== 100) {
      alert(`❌ Global Impact must total 100%. Current: ${Math.round(totalGlobal * 100)}%`);
      return;
    }

    try {
      await fetch(`${API_URL}/positions/${selectedPosition}/weights`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(weights),
      });
      await fetch(`${API_URL}/positions/${selectedPosition}/category-weights`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryWeights: catWeights }),
      });
      alert("✅ Configuration Saved!");
      setIsEditing(false);
    } catch (err) { alert("Save failed."); }
  };

  return (
    <div className="admin-container">
      <header className="page-header">
        <h1>Position Management</h1>
        <p>Configure weights and skill impacts</p>
      </header>

      <div className="card">
        <div className="modal-selector">
          <label>Select Role to Manage:</label>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <select value={selectedPosition} onChange={handlePositionChange} className="role-select">
              <option value="">-- Choose a Role --</option>
              {positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            
            {selectedPosition && !isEditing && (
              <button className="btn-primary" onClick={() => setIsEditing(true)}>
                ✏️ Edit Mode
              </button>
            )}
            {isEditing && (
              <button className="btn-success" onClick={saveAll}>💾 Save Changes</button>
            )}
          </div>
        </div>
      </div>

      {selectedPosition ? (
        <div className="grid">
          {Object.keys(groupedSkills).map((catName) => (
            <div key={catName} className="card">
              <div className="skill-row" style={{ borderBottom: '2px solid #eee', marginBottom: '15px' }}>
                <h2 style={{ margin: 0 }}>{catName}</h2>
                <div className="cat-impact-box">
                  <label style={{ margin: 0, fontSize: '0.8rem' }}>Global Impact:</label>
                  {isEditing ? (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <input 
                        className="score-input"
                        type="number" 
                        value={catWeights[groupedSkills[catName].id] ? Math.round(catWeights[groupedSkills[catName].id] * 100) : ""} 
                        onChange={(e) => {
                          const val = Number(e.target.value) / 100;
                          setCatWeights({...catWeights, [groupedSkills[catName].id]: val});
                        }}
                      />
                      <span style={{ marginLeft: '5px' }}>%</span>
                    </div>
                  ) : (
                    <span className="badge-score">
                      {catWeights[groupedSkills[catName].id] ? Math.round(catWeights[groupedSkills[catName].id] * 100) : 0}%
                    </span>
                  )}
                </div>
              </div>

              <div className="skill-list">
                {groupedSkills[catName].skills.map((skill) => (
                  <div key={skill.id} className="skill-row">
                    <span>{skill.name}</span>
                    {isEditing ? (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <input 
                          className="score-input"
                          type="number" 
                          value={weights[skill.id] ? Math.round(weights[skill.id] * 100) : ""} 
                          onChange={(e) => {
                            const val = Number(e.target.value) / 100;
                            setWeights({...weights, [skill.id]: val});
                          }}
                        />
                        <span style={{ marginLeft: '5px' }}>%</span>
                      </div>
                    ) : (
                      <span className="static-skill-weight">
                        {weights[skill.id] ? Math.round(weights[skill.id] * 100) : 0}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '50px' }}>
          <p>Please select a position to manage its configuration.</p>
        </div>
      )}
    </div>
  );
}

export default AdminPositions;