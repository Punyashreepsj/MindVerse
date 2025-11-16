import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import LevelCard from "../components/LevelCard";

interface Lesson {
  lesson_name: string;
  lesson_level: string;
  game_type?: string;
}

export default function GameLevels() {
  const { topic } = useParams();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [unlockedLevel, setUnlockedLevel] = useState(1);

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const res = await fetch(`http://localhost:8000/courses/${encodeURIComponent(topic || '')}/lessons`);
        const data = await res.json();
        setLessons(data);
      } catch (error) {
        console.error("Error fetching lessons:", error);
      }
    };
    if (topic) {
      fetchLessons();
    }
  }, [topic]);

  return (
    <div className="page full-screen">
      <h1 className="title">Game Levels – {topic}</h1>
      <p className="subtitle">Each level has an AI-recommended game type based on the content</p>
      
      <div className="levels-grid">
        {lessons.map((lesson, idx) => (
          <LevelCard
            key={idx}
            index={idx + 1}
            lesson={lesson}
            unlocked={idx + 1 <= unlockedLevel}
            onComplete={() => {}}
            gameType={lesson.game_type || 'tile'}
          />
        ))}
      </div>
    </div>
  );
}
