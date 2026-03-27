import { useEffect, useState } from "react";
import { API_URL } from "../api/api";

function ComparisonView() {
  const [evaluations, setEvaluations] = useState([]);

  const fetchEvaluations = async () => {
    try {
      const res = await fetch(`${API_URL}/evaluate`);
      const data = await res.json();
      setEvaluations(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, []);

  return (
    <div>
      <h2>Trainee Comparison</h2>

      <table border="1">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Name</th>
            <th>Position</th>
            <th>Score</th>
          </tr>
        </thead>

        <tbody>
        {evaluations.map((e, index) => (
            <tr key={e.id}>
            <td>{index + 1}</td>
            <td>{e.trainee_name}</td>
            <td>{e.position}</td>
            <td>
                <strong>{e.score}</strong>
            </td>
            </tr>
        ))}
</tbody>
      </table>
    </div>
  );
}

export default ComparisonView;