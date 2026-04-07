import { useEffect, useState } from "react";
import { API_URL } from "../api/api";

function ComparisonView() {
  const [evaluations, setEvaluations] = useState([]);
  const [expandedId, setExpandedId] = useState(null); 

  const fetchEvaluations = async () => {
    try {
      const res = await fetch(`${API_URL}/evaluations`); 
      const data = await res.json();
      const sortedData = data.sort((a, b) => (b.score || 0) - (a.score || 0));
      setEvaluations(sortedData);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const parseBreakdown = (breakdown) => {
    try {
      return typeof breakdown === 'string' ? JSON.parse(breakdown) : breakdown;
    } catch (e) {
      return null;
    }
  };

  const toggleAI = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="container">
      <h2 style={{ borderBottom: "2px solid #333", paddingBottom: "10px", color: "#333" }}>
        🏆 Trainee Rankings & AI Insights
      </h2>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", background: "white" }}>
        <thead>
          <tr style={{ backgroundColor: "#4a6cf7", color: "white", textAlign: "left" }}>
            <th style={{ padding: "15px" }}>Rank</th>
            <th style={{ padding: "15px" }}>Trainee Name</th>
            <th style={{ padding: "15px" }}>Position</th>
            <th style={{ padding: "15px" }}>Grade</th>
            <th style={{ padding: "15px" }}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {evaluations.map((e, index) => {
            const breakdown = parseBreakdown(e.category_breakdown);
            const isBilingual = e.position_name?.toLowerCase().includes("bilingual");
            const badgeBorder = `1px solid ${isBilingual ? "#bbdefb" : "#dcedc8"}`;

            return (
              /* ✅ Short Fragment syntax fixed the ReferenceError */
              <article key={e.id} style={{ display: 'contents' }}>
                <tr style={{ borderBottom: "1px solid #ddd", backgroundColor: index % 2 === 0 ? "#fff" : "#f9f9f9" }}>
                  <td style={{ padding: "15px", fontWeight: "bold" }}>
                    {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
                  </td>
                  <td style={{ padding: "15px" }}>
                    <strong>{e.trainee_name}</strong>
                    <div style={{ fontSize: "0.75rem", color: "#888" }}>
                      {new Date(e.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td style={{ padding: "15px" }}>
                    <span style={{ 
                      padding: "4px 10px", borderRadius: "20px", fontSize: "0.7rem", fontWeight: "bold",
                      background: isBilingual ? "#e3f2fd" : "#f1f8e9",
                      color: isBilingual ? "#0d47a1" : "#33691e",
                      border: badgeBorder
                    }}>
                      {e.position_name}
                    </span>
                  </td>
                  <td style={{ padding: "15px", fontSize: "1.2rem", color: "#28a745" }}>
                    <strong>{Math.round(e.score)}%</strong>
                  </td>
                  <td style={{ padding: "15px" }}>
                    <button 
                      onClick={() => toggleAI(e.id)}
                      style={{ padding: "6px 12px", fontSize: "0.8rem", backgroundColor: expandedId === e.id ? "#666" : "#4a6cf7" }}
                    >
                      {expandedId === e.id ? "Hide Report" : "View Report"}
                    </button>
                  </td>
                </tr>

                {expandedId === e.id && (
                  <tr>
                    <td colSpan="5" style={{ padding: "20px", backgroundColor: "#f0f4ff", borderBottom: "2px solid #4a6cf7" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "20px" }}>
                        <div>
                          <h4 style={{ margin: "0 0 10px 0" }}>Breakdown:</h4>
                          {breakdown && Object.entries(breakdown).map(([cat, val]) => (
                            <div key={cat} style={{ fontSize: "0.85rem", marginBottom: "5px" }}>
                              <span style={{ color: "#555" }}>{cat}:</span> <strong>{Math.round(val)}%</strong>
                            </div>
                          ))}
                        </div>
                        <div className="ai-feedback" style={{ margin: 0, background: "white" }}>
                          <h4 style={{ margin: "0 0 5px 0", color: "#4a6cf7" }}>🤖 Gemini Assessment:</h4>
                          {e.ai_feedback || "No AI feedback recorded for this session."}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </article>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default ComparisonView;