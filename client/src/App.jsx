import React, { useEffect, useState } from "react";
import "./App.css";

const API_BASE = "https://ubiquitous-waffle-65rqjjwpgrqf54xq-8000.app.github.dev";

const daysOfWeek = [
  { id: 1, name: "Monday" },
  { id: 2, name: "Tuesday" },
  { id: 3, name: "Wednesday" },
  { id: 4, name: "Thursday" },
  { id: 5, name: "Friday" },
  { id: 6, name: "Saturday" },
  { id: 7, name: "Sunday" },
];

function App() {
  const [airports, setAirports] = useState([]);
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedAirport, setSelectedAirport] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/airports`)
      .then((res) => res.json())
      .then((data) => setAirports(data))
      .catch(() => setError("Failed to load airports."));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(
        `${API_BASE}/predict?day_of_week_id=${selectedDay}&airport_id=${selectedAirport}`
      );
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError("Failed to fetch prediction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Flight Delay Predictor</h1>
      <form onSubmit={handleSubmit} className="form">
        <label>
          Day of Week:
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(Number(e.target.value))}
          >
            {daysOfWeek.map((day) => (
              <option key={day.id} value={day.id}>
                {day.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Airport:
          <select
            value={selectedAirport}
            onChange={(e) => setSelectedAirport(e.target.value)}
            required
          >
            <option value="">Select an airport</option>
            {airports.map((airport) => (
              <option key={airport.OriginAirportID} value={airport.OriginAirportID}>
                {airport.OriginAirportName}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={loading || !selectedAirport}>
          {loading ? "Predicting..." : "Get Prediction"}
        </button>
      </form>
      {error && <div className="error">{error}</div>}
      {result && (
        <div className="result">
          <h2>Prediction Result</h2>
          <p>
            <strong>Chance of Delay:</strong> {result.delay_probability_percent}%
          </p>
          <p>
            <strong>Confidence:</strong> {result.confidence_score * 100}%
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
