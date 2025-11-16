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

interface Tile {
  id: number;
  content: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export default function TileGame() {
  const { topic, levelIndex } = useParams<{ topic: string; levelIndex: string }>();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [flippedTiles, setFlippedTiles] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
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
          generateTiles(data[index]);
        }
      } catch (error) {
        console.error("Error fetching lesson:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLesson();
  }, [topic, levelIndex]);

  const generateTiles = (lessonData: Lesson) => {
    // Extract key terms and concepts from lesson content
    const content = lessonData.lesson_content;
    
    // Create a list of key concepts from different parts of the lesson
    const concepts: string[] = [];
    
    // Extract from topic fields (these are usually key concepts)
    [content.topic_1, content.topic_2, content.topic_3].forEach(topic => {
      if (topic) {
        // Extract first few words or key phrases
        const words = topic.split(/\s+/).slice(0, 3).join(' ');
        if (words.length > 3) {
          concepts.push(words);
        }
      }
    });
    
    // Extract meaningful words from introduction and conclusion
    const allText = `${content.introduction} ${content.conclusion}`;
    const words = allText
      .split(/\s+/)
      .filter(word => word.length > 4 && /^[a-zA-Z]+$/.test(word.replace(/[^\w]/g, '')))
      .filter((word, index, self) => self.indexOf(word) === index)
      .slice(0, 8 - concepts.length);
    
    concepts.push(...words);
    
    // Take first 8 concepts for 4 pairs
    const selectedConcepts = concepts.slice(0, 8);
    
    // If we don't have enough, pad with generic terms
    while (selectedConcepts.length < 8) {
      selectedConcepts.push(`Term ${selectedConcepts.length + 1}`);
    }

    // Create pairs: each concept appears twice
    const tileContents: string[] = [];
    selectedConcepts.forEach(concept => {
      tileContents.push(concept);
      tileContents.push(concept);
    });

    // Shuffle the tiles
    const shuffled = [...tileContents].sort(() => Math.random() - 0.5);

    // Create tile objects
    const newTiles: Tile[] = shuffled.map((content, index) => ({
      id: index,
      content: content.replace(/[^\w\s]/g, '').substring(0, 15), // Limit length for display
      isFlipped: false,
      isMatched: false,
    }));

    setTiles(newTiles);
  };

  const handleTileClick = (tileId: number) => {
    const tile = tiles[tileId];
    
    // Don't allow clicking if tile is already flipped, matched, or 2 tiles are already flipped
    if (tile.isFlipped || tile.isMatched || flippedTiles.length >= 2) {
      return;
    }

    // Flip the tile
    const newTiles = tiles.map(t => 
      t.id === tileId ? { ...t, isFlipped: true } : t
    );
    setTiles(newTiles);
    setFlippedTiles([...flippedTiles, tileId]);

    // If 2 tiles are flipped, check for match
    if (flippedTiles.length === 1) {
      const firstTile = tiles[flippedTiles[0]];
      const secondTile = tile;
      
      setMoves(moves + 1);

      if (firstTile.content === secondTile.content) {
        // Match found!
        setTimeout(() => {
          const matchedTiles = newTiles.map(t => 
            t.id === firstTile.id || t.id === secondTile.id 
              ? { ...t, isMatched: true, isFlipped: true }
              : t
          );
          setTiles(matchedTiles);
          setFlippedTiles([]);
          
          // Check if game is complete
          if (matchedTiles.every(t => t.isMatched)) {
            setGameComplete(true);
          }
        }, 500);
      } else {
        // No match, flip back
        setTimeout(() => {
          const resetTiles = newTiles.map(t => 
            t.id === firstTile.id || t.id === secondTile.id
              ? { ...t, isFlipped: false }
              : t
          );
          setTiles(resetTiles);
          setFlippedTiles([]);
        }, 1000);
      }
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

  if (!lesson) {
    return (
      <div className="page full-screen">
        <h2 className="title">Lesson not found</h2>
        <button onClick={handleBack} className="game-btn">Go Back</button>
      </div>
    );
  }

  return (
    <div className="page full-screen">
      <div className="orb orb1"></div>
      <div className="orb orb2"></div>
      
      <h1 className="title">Level {levelIndex}: {lesson.lesson_name}</h1>
      <p className="subtitle">Match the pairs! Moves: {moves}</p>

      {gameComplete ? (
        <div className="game-complete">
          <h2 className="title">🎉 Congratulations! 🎉</h2>
          <p className="subtitle">You completed the level in {moves} moves!</p>
          <div className="game-actions">
            <button onClick={handleBack} className="game-btn">Back to Levels</button>
            <button onClick={handleNextLevel} className="game-btn">Next Level →</button>
          </div>
        </div>
      ) : (
        <>
          <div className="tile-grid">
            {tiles.map((tile) => (
              <div
                key={tile.id}
                className={`tile ${tile.isFlipped ? "flipped" : ""} ${tile.isMatched ? "matched" : ""}`}
                onClick={() => handleTileClick(tile.id)}
              >
                <div className="tile-front">?</div>
                <div className="tile-back">{tile.content}</div>
              </div>
            ))}
          </div>
          <button onClick={handleBack} className="game-btn" style={{ marginTop: "2rem" }}>
            ← Back to Levels
          </button>
        </>
      )}
    </div>
  );
}

