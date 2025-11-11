import { useState } from "react";
import "./styles.css";

export default function App() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!topic.trim()) {
      setMessage("Please enter a topic!");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("http://localhost:8000/generate-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });

      const data = await response.json();
      setMessage(data.message || "Game generation started!");
    } catch (error) {
      setMessage("⚠️ Unable to connect to backend. Please check the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Floating background lights */}
      <div className="orb orb1"></div>
      <div className="orb orb2"></div>
      <div className="orb orb3"></div>

      {/* Content */}
      <h1 className="title">🎮 Agentic Game Generator</h1>
      <p className="subtitle">Transform your topic into an AI-powered game</p>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter your study topic (e.g., Photosynthesis)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Generating..." : "Generate Game 🚀"}
        </button>
      </form>

      {message && <p className="message">{message}</p>}
    </div>
  );
}
