import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function TopicInput() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/generate-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });

      const data = await response.json();
      console.log("Backend Response:", data);

      navigate(`/content/${topic}`);
    } catch (error) {
      alert("⚠️ Unable to connect to backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page full-screen">
      <div className="orb orb1"></div>
      <div className="orb orb2"></div>
      <h1 className="title">🎮 Agentic AI Game Generator</h1>
      <p className="subtitle">Enter your study topic to begin your journey</p>

      <form onSubmit={handleSubmit} className="form">
        <input
          type="text"
          placeholder="Enter a topic..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Generating..." : "Generate 🚀"}
        </button>
      </form>
    </div>
  );
}
