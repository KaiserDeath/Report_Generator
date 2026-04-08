import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API_URL } from "../api/api";
import "../styles/printable.css";

function PrintableReport() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(`${API_URL}/evaluations/${id}`);
        const data = await res.json();
        setReport(data);
        setLoading(false);
      } catch (err) {
        console.error("Fetch error:", err);
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  if (loading) return null; // Keep it blank so Puppeteer waits for content
  if (!report) return <div>Report not found.</div>;

  return (
    <div className="print-mode-wrapper">
      <div className="formal-report-paper">
        <div className="report-doc-header">
          <h2>PERFORMANCE EVALUATION REPORT</h2>
          <div className="doc-meta-grid">
            <div><strong>Trainee:</strong> {report.trainee_name}</div>
            <div><strong>Position:</strong> {report.position_name}</div>
            <div><strong>Period:</strong> {new Date(report.training_start).toLocaleDateString("en-GB")} - {new Date(report.training_end).toLocaleDateString("en-GB")}</div>
            <div><strong>Score:</strong> {Math.round(report.score)}%</div>
          </div>
        </div>

        <div className="report-doc-section">
          <h3>Detailed Competency Breakdown</h3>
          {Object.entries(report.category_breakdown || {}).map(([category, data]) => (
            <div key={category} className="report-category-group">
              <div className="report-category-header">
                <span>{category}</span>
                <span>{Math.round(data.category_avg || 0)}%</span>
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
          ))}
        </div>

        <div className="ai-report-container">
          <div className="ai-report-header">
            <h3>AI Performance Insights</h3>
          </div>
          <div className="ai-report-content" style={{ display: 'block' }}>
            {report.ai_feedback}
          </div>
        </div>

        <div className="report-doc-section">
          <h3>Trainer Observations</h3>
          <div className="report-textarea" style={{ border: '1px solid #eee', minHeight: '150px' }}>
            {report.trainer_notes || "No notes provided."}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrintableReport;