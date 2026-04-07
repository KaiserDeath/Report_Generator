import { useState, useEffect } from "react";
import { API_URL } from "../api/api";

function AdminPositions() {
  const [positions, setPositions] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState("");
  const [weights, setWeights] = useState({});
  const [catWeights, setCatWeights] = useState({});
  const [isEditing, setIsEditing] = useState(false); // ✅ New state for View vs Edit mode

  useEffect(() => {
    fetch(`${API_URL}/positions`).then(res => res.json()).then(setPositions);
    fetch(`${API_URL}/positions/skills/all`).then(res => res.json()).then(setAllSkills);
  }, []);

  const handlePositionChange = async (e) => {
    const posId = e.target.value;
    setSelectedPosition(posId);
    setIsEditing(false); // ✅ Reset to View-only when changing positions
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
      setIsEditing(false); // ✅ Return to View mode after saving
    } catch (err) { alert("Save failed."); }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "auto", fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Manage Position Setup</h2>
        {selectedPosition && !isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            ✏️ Edit Configuration
          </button>
        )}
      </header>

      <select value={selectedPosition} onChange={handlePositionChange} style={{ padding: "10px", marginBottom: "30px", width: "250px" }}>
        <option value="">-- Select Role --</option>
        {positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>

      {selectedPosition && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
          {Object.keys(groupedSkills).map((catName) => (
            <div key={catName} style={{ border: "1px solid #ccc", padding: "15px", borderRadius: "10px", backgroundColor: isEditing ? "#fff" : "#fdfdfd" }}>
              <h3 style={{ color: "#007bff", marginTop: 0 }}>{catName}</h3>

              {/* Global Impact Section */}
              <div style={{ background: isEditing ? "#f0f7ff" : "#f1f1f1", padding: "12px", marginBottom: "15px", borderRadius: "5px" }}>
                <label><strong>Global Section Impact:</strong></label>
                <div style={{ marginTop: '5px' }}>
                  {isEditing ? (
                    <input 
                      type="number" 
                      value={catWeights[groupedSkills[catName].id] ? Math.round(catWeights[groupedSkills[catName].id] * 100) : ""} 
                      onChange={(e) => {
                        const val = Number(e.target.value) / 100;
                        setCatWeights({...catWeights, [groupedSkills[catName].id]: val});
                      }}
                      style={{ width: "70px", padding: "5px" }}
                    />
                  ) : (
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                      {catWeights[groupedSkills[catName].id] ? Math.round(catWeights[groupedSkills[catName].id] * 100) : 0}%
                    </span>
                  )}
                  {isEditing && <span style={{ marginLeft: "5px" }}>%</span>}
                </div>
              </div>

              {/* Skills Section */}
              {groupedSkills[catName].skills.map((skill) => (
                <div key={skill.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", padding: '5px 0', borderBottom: '1px solid #eee' }}>
                  <span>{skill.name}</span>
                  {isEditing ? (
                    <input 
                      type="number" 
                      value={weights[skill.id] ? Math.round(weights[skill.id] * 100) : ""} 
                      onChange={(e) => {
                        const val = Number(e.target.value) / 100;
                        setWeights({...weights, [skill.id]: val});
                      }}
                      style={{ width: "60px", textAlign: "center" }}
                    />
                  ) : (
                    <span style={{ fontWeight: '500' }}>
                      {weights[skill.id] ? Math.round(weights[skill.id] * 100) : 0}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}

          {isEditing && (
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px' }}>
              <button 
                onClick={saveAll} 
                style={{ flex: 1, padding: "15px", background: "#28a745", color: "white", fontWeight: "bold", border: "none", borderRadius: "5px", cursor: "pointer" }}
              >
                💾 SAVE CHANGES
              </button>
              <button 
                onClick={() => setIsEditing(false)} 
                style={{ padding: "15px", background: "#6c757d", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminPositions;