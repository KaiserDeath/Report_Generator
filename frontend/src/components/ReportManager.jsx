import React, { useEffect, useState } from "react";
import { API_URL } from "../api/api";
import Swal from "sweetalert2";

function ReportManager() {
  const [evaluations, setEvaluations] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editNoteId, setEditNoteId] = useState(null); 
  const [tempNoteValue, setTempNoteValue] = useState("");
  const [showAI, setShowAI] = useState({}); 

  const fetchEvaluations = async () => {
    try {
      const res = await fetch(`${API_URL}/evaluations`);
      const data = await res.json();
      const sortedData = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setEvaluations(sortedData);
    } catch (err) {
      console.error("Error fetching reports:", err);
    }
  };

  useEffect(() => { fetchEvaluations(); }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB"); 
  };

  const handleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const deleteSelected = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete ${selectedIds.length} reports.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#4a6cf7",
      cancelButtonColor: "#dc3545",
      confirmButtonText: "Yes, delete them!",
    });

    if (result.isConfirmed) {
      try {
        for (const id of selectedIds) {
          await fetch(`${API_URL}/evaluations/${id}`, { method: "DELETE" });
        }
        Swal.fire({ icon: "success", title: "Deleted!", timer: 2000, showConfirmButton: false });
        setSelectedIds([]);
        setIsEditMode(false);
        fetchEvaluations();
      } catch (err) {
        Swal.fire("Error", "Failed to delete files.", "error");
      }
    }
  };

  const saveNote = async (id) => {
    try {
      const res = await fetch(`${API_URL}/evaluations/${id}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: tempNoteValue }),
      });
      if (res.ok) {
        setEvaluations(prev => prev.map(ev => ev.id === id ? { ...ev, trainer_notes: tempNoteValue } : ev));
        setEditNoteId(null); 
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Saved', showConfirmButton: false, timer: 3000 });
      }
    } catch (err) {
      Swal.fire("Error", "Could not update notes.", "error");
    }
  };

  const startEditing = (report) => {
    setEditNoteId(report.id);
    setTempNoteValue(report.trainer_notes || "");
  };

  /**
   * ✅ NEW PUPPETEER DOWNLOAD LOGIC
   * We hit the backend endpoint which returns a PDF stream.
   */
  const downloadPDF = (reportId) => {
    Swal.fire({
      title: "Preparing Document...",
      text: "Generating a high-quality PDF on the server.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // We use window.location.href to trigger the download from the backend
    // Since the backend sets 'Content-Disposition: attachment', the page won't change.
    window.location.href = `${API_URL}/evaluations/${reportId}/pdf`;

    // Close the loading spinner after a reasonable time
    setTimeout(() => {
      Swal.close();
    }, 3000);
  };

  const filteredReports = evaluations.filter(e => 
    e.trainee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.position_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="report-manager">
      <header className="report-header">
        <h1>Trainee Archive</h1>
        <div className="header-actions">
          {isEditMode && selectedIds.length > 0 && (
            <button className="btn-delete" onClick={deleteSelected}>
              Delete Selected ({selectedIds.length})
            </button>
          )}
          <button 
            onClick={() => { setIsEditMode(!isEditMode); setSelectedIds([]); }}
            className={isEditMode ? "btn-secondary" : "btn-primary"}
          >
            {isEditMode ? "Cancel" : "Manage Files"}
          </button>
        </div>
      </header>

      <div className="search-container">
        <input 
          type="text" 
          placeholder="Search archives..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="search-input"
        />
      </div>

      <table className="report-table">
        <thead>
          <tr>
            {isEditMode && <th>Select</th>}
            <th>Name</th>
            <th>Training Time</th>
            <th>Score</th>
            <th>Reports</th>
          </tr>
        </thead>
        <tbody>
          {filteredReports.map((e) => (
            <React.Fragment key={e.id}>
              <tr className={selectedIds.includes(e.id) ? "selected-row" : ""}>
                {isEditMode && (
                  <td>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(e.id)} 
                      onChange={() => handleSelect(e.id)}
                    />
                  </td>
                )}
                <td>
                  <div className="trainee-info">
                    <strong className="trainee-name">{e.trainee_name}</strong>
                    <div className="position-subtext">{e.position_name}</div>
                  </div>
                </td>
                <td>{formatDate(e.training_start)} — {formatDate(e.training_end)}</td>
                <td className="grade-cell"><span className="badge-score">{Math.round(e.score)}%</span></td>
                <td>
                  <button className="btn-view" onClick={() => setExpandedId(expandedId === e.id ? null : e.id)}>
                    {expandedId === e.id ? "Close" : "View Report"}
                  </button>
                </td>
              </tr>

              {expandedId === e.id && (
                <tr className="expanded-row">
                  <td colSpan={isEditMode ? "5" : "4"}>
                    <div className="formal-report-paper">
                      <div className="report-doc-header">
                        <h2>PERFORMANCE EVALUATION REPORT</h2>
                        <div className="doc-meta-grid">
                          <div><strong>Trainee:</strong> {e.trainee_name}</div>
                          <div><strong>Position:</strong> {e.position_name}</div>
                          <div><strong>Period:</strong> {formatDate(e.training_start)} - {formatDate(e.training_end)}</div>
                          <div><strong>Score:</strong> {Math.round(e.score)}%</div>
                          
                          {/* ✅ PUPPETEER DOWNLOAD TRIGGER */}
                          <div className="no-print">
                             <button className="btn-pdf-download" onClick={() => downloadPDF(e.id)}>
                               📥 Download Professional PDF
                             </button>
                          </div>
                        </div>
                      </div>

                      {/* ... rest of your component (Breakdown, AI, Notes) remains the same ... */}
                      <div className="report-doc-section">
                        <h3>Detailed Competency Breakdown</h3>
                        {e.category_breakdown && typeof e.category_breakdown === 'object' ? (
                          Object.entries(e.category_breakdown).map(([category, data]) => (
                            <div key={category} className="report-category-group">
                              <div className="report-category-header">
                                <span>{category}</span>
                                <span>{data.category_avg ? Math.round(data.category_avg) : 0}%</span>
                              </div>
                              <table className="report-skill-table">
                                <tbody>
                                  {data.skills?.map((skill, idx) => (
                                    <tr key={idx}>
                                      <td>{skill.skill_name}</td>
                                      <td className="text-right">{skill.score}/5</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ))
                        ) : <p>Detailed breakdown unavailable.</p>}
                      </div>

                      <div className="ai-report-container">
                        <div className="ai-report-header">
                          <h3>AI Performance Insights</h3>
                          <button 
                            className="btn-toggle-ai no-print"
                            onClick={() => setShowAI(prev => ({ ...prev, [e.id]: !prev[e.id] }))}
                          >
                            {showAI[e.id] ? "Hide AI Report" : "Show AI Report"}
                          </button>
                        </div>
                        {showAI[e.id] && (
                          <div className="ai-report-content">
                            {e.ai_feedback || "No automated feedback available."}
                          </div>
                        )}
                      </div>

                      <div className="report-doc-section">
                        <div className="note-header">
                          <h3>Trainer Observations</h3>
                          <div className="no-print">
                            {editNoteId === e.id ? (
                              <button className="btn-save-note" onClick={() => saveNote(e.id)}>Save</button>
                            ) : (
                              <button className="btn-edit-note" onClick={() => startEditing(e)}>Edit</button>
                            )}
                          </div>
                        </div>
                        <textarea 
                          value={editNoteId === e.id ? tempNoteValue : (e.trainer_notes || "")}
                          onChange={(evt) => setTempNoteValue(evt.target.value)}
                          disabled={editNoteId !== e.id}
                          className={editNoteId === e.id ? "report-textarea editing" : "report-textarea"}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ReportManager;