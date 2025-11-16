import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

interface LessonContent {
  introduction: string;
  topic_1: string;
  topic_2: string;
  topic_3: string;
  conclusion: string;
}

interface Lesson {
  lesson_name: string;
  lesson_content: LessonContent;
  lesson_level: string;
}

export default function ContentPage() {
  const { topic } = useParams();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLessons = async () => {
      const res = await fetch(`http://localhost:8000/courses/${topic}/lessons`);
      const data = await res.json();
      setLessons(data);
    };
    fetchLessons();
  }, [topic]);

  return (
    <div className="page full-screen">
      <h1 className="title">{topic?.toUpperCase()}</h1>
      <div className="content-box">
        {lessons.map((lesson, idx) => (
          <div key={idx} className="lesson-card">
            <h2>{lesson.lesson_name}</h2>
            <p>{lesson.lesson_content.introduction}</p>
          </div>
        ))}
      </div>
      <button className="game-btn" onClick={() => navigate(`/game/${topic}`)}>
        🌟 Let’s Enter the Game World 🌟
      </button>
    </div>
  );
}
