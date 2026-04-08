// frontend/src/components/ReportList.jsx
import { useEffect, useState } from 'react';

export default function ReportList() {
  const [reports, setReports] = useState([]);

  const fetchReports = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/evaluations`);
    const data = await res.json();
    setReports(data);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this report permanently?")) {
      await fetch(`${import.meta.env.VITE_API_URL}/api/evaluations/${id}`, {
        method: 'DELETE'
      });
      fetchReports(); // Refresh the list
    }
  };

  useEffect(() => { fetchReports(); }, []);

  return (
    <div className="report-history">
      <h2>Saved Reports</h2>
      {reports.map(report => (
        <div key={report.id} className="report-card">
          <h4>{report.trainee_name}</h4>
          <p>Created: {new Date(report.created_at).toLocaleDateString()}</p>
          <button onClick={() => handleDelete(report.id)}>🗑️ Delete</button>
        </div>
      ))}
    </div>
  );
}