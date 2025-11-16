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
  game_type?: string;
}

interface Question {
  id: number;
  sentence: string;
  blankIndex: number;
  answer: string;
  userAnswer: string;
  isCorrect: boolean | null;
}

export default function FillInTheBlanks() {
  const { topic, levelIndex } = useParams<{ topic: string; levelIndex: string }>();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLesson = async () => {
      if (!topic || !levelIndex) return;
      
      try {
        const res = await fetch(`http://localhost:8000/courses/${encodeURIComponent(topic)}/lessons`);
        const data: Lesson[] = await res.json();
        const index = parseInt(levelIndex) - 1;
        if (data[index]) {
          setLesson(data[index]);
          generateQuestions(data[index]);
        }
      } catch (error) {
        console.error("Error fetching lesson:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLesson();
  }, [topic, levelIndex]);

  const generateQuestions = (lessonData: Lesson) => {
    const content = lessonData.lesson_content;
    const allSentences: string[] = [];
    
    // Extract sentences from all content fields
    [content.introduction, content.topic_1, content.topic_2, content.topic_3, content.conclusion].forEach(text => {
      if (text) {
        // Split by periods, exclamation marks, and question marks
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
        allSentences.push(...sentences);
      }
    });

    // Create questions from sentences
    const newQuestions: Question[] = [];
    const usedSentences = new Set<number>();
    
    // Select up to 5 sentences for questions
    for (let i = 0; i < Math.min(5, allSentences.length); i++) {
      let sentenceIndex;
      do {
        sentenceIndex = Math.floor(Math.random() * allSentences.length);
      } while (usedSentences.has(sentenceIndex) && usedSentences.size < allSentences.length);
      
      usedSentences.add(sentenceIndex);
      const sentence = allSentences[sentenceIndex].trim();
      
      // Find a good word to blank out (prefer nouns/adjectives, avoid very short words)
      const words = sentence.split(/\s+/);
      const candidates: number[] = [];
      
      words.forEach((word, idx) => {
        const cleanWord = word.replace(/[^\w]/g, '');
        // Prefer words that are 4+ characters and not at the start/end
        if (cleanWord.length >= 4 && idx > 0 && idx < words.length - 1) {
          candidates.push(idx);
        }
      });
      
      if (candidates.length > 0) {
        const blankIndex = candidates[Math.floor(Math.random() * candidates.length)];
        const answer = words[blankIndex].replace(/[^\w]/g, '');
        const sentenceWithBlank = words.map((word, idx) => 
          idx === blankIndex ? '______' : word
        ).join(' ');
        
        newQuestions.push({
          id: i + 1,
          sentence: sentenceWithBlank,
          blankIndex: blankIndex,
          answer: answer.toLowerCase(),
          userAnswer: '',
          isCorrect: null,
        });
      }
    }

    setQuestions(newQuestions);
  };

  const handleAnswerChange = (value: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex].userAnswer = value;
    setQuestions(updatedQuestions);
  };

  const handleCheckAnswer = () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion.userAnswer.trim()) {
      return;
    }

    const isCorrect = currentQuestion.userAnswer.toLowerCase().trim() === currentQuestion.answer;
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex].isCorrect = isCorrect;
    setQuestions(updatedQuestions);

    if (isCorrect) {
      setScore(score + 1);
    }

    // Auto-advance after a short delay
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        setGameComplete(true);
      }
    }, 1500);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setGameComplete(true);
    }
  };

  const handleNextLevel = () => {
    if (!topic || !levelIndex) return;
    const nextLevel = parseInt(levelIndex) + 1;
    // Fetch lessons to get the recommended game type for next level
    fetch(`http://localhost:8000/courses/${encodeURIComponent(topic)}/lessons`)
      .then(res => res.json())
      .then((lessons: Lesson[]) => {
        if (nextLevel <= lessons.length) {
          const nextLesson = lessons[nextLevel - 1];
          const nextGameType = nextLesson.game_type || 'tile';
          if (nextGameType === 'fill-blanks') {
            navigate(`/game/${topic}/fill-blanks/${nextLevel}`);
          } else {
            navigate(`/game/${topic}/level/${nextLevel}`);
          }
        } else {
          // All levels completed, go back to levels page
          navigate(`/game/${topic}`);
        }
      })
      .catch(() => {
        navigate(`/game/${topic}`);
      });
  };

  const handleBack = () => {
    if (!topic) return;
    navigate(`/game/${topic}`);
  };

  if (loading) {
    return (
      <div className="page full-screen">
        <h2 className="title">Loading...</h2>
      </div>
    );
  }

  if (!lesson || questions.length === 0) {
    return (
      <div className="page full-screen">
        <h2 className="title">Lesson not found or insufficient content</h2>
        <button onClick={handleBack} className="game-btn">Go Back</button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="page full-screen">
      <div className="orb orb1"></div>
      <div className="orb orb2"></div>
      
      <h1 className="title">Level {levelIndex}: {lesson.lesson_name}</h1>
      <p className="subtitle">Fill in the Blanks</p>

      {gameComplete ? (
        <div className="game-complete">
          <h2 className="title">🎉 Game Complete! 🎉</h2>
          <p className="subtitle">Your Score: {score} / {questions.length}</p>
          <div className="score-display">
            <div className="score-circle">
              {Math.round((score / questions.length) * 100)}%
            </div>
          </div>
          <div className="game-actions">
            <button onClick={handleBack} className="game-btn">Back to Levels</button>
            <button onClick={handleNextLevel} className="game-btn">Next Level →</button>
          </div>
        </div>
      ) : (
        <>
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${progress}%` }}></div>
            <span className="progress-text">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
          </div>

          <div className="question-container">
            <div className="question-card">
              <p className="question-sentence">{currentQuestion.sentence}</p>
              
              <div className="answer-section">
                <input
                  type="text"
                  className={`answer-input ${currentQuestion.isCorrect === true ? 'correct' : currentQuestion.isCorrect === false ? 'incorrect' : ''}`}
                  placeholder="Type your answer here..."
                  value={currentQuestion.userAnswer}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCheckAnswer()}
                  disabled={currentQuestion.isCorrect !== null}
                  autoFocus
                />
                
                {currentQuestion.isCorrect === true && (
                  <div className="feedback correct-feedback">✓ Correct!</div>
                )}
                {currentQuestion.isCorrect === false && (
                  <div className="feedback incorrect-feedback">
                    ✗ Incorrect. The answer is: <strong>{currentQuestion.answer}</strong>
                  </div>
                )}
              </div>

              <div className="question-actions">
                {currentQuestion.isCorrect === null ? (
                  <button 
                    onClick={handleCheckAnswer} 
                    className="game-btn"
                    disabled={!currentQuestion.userAnswer.trim()}
                  >
                    Check Answer
                  </button>
                ) : (
                  <button onClick={handleNext} className="game-btn">
                    {currentQuestionIndex < questions.length - 1 ? 'Next Question →' : 'Finish'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <button onClick={handleBack} className="game-btn" style={{ marginTop: "2rem" }}>
            ← Back to Levels
          </button>
        </>
      )}
    </div>
  );
}

