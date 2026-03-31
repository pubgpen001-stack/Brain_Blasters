import React from 'react';
import './Home.css';

const lessons = Array.from({ length: 42 }, (_, i) => ({
  id: i + 1,
  title: i + 1 === 10 ? "Roman Numerals" : `Lesson ${i + 1}: Coming Soon`,
  locked: i + 1 !== 10
}));

const Home = ({ onSelectLesson }) => {
  return (
    <div className="home-container">
      <header className="hero">
        <div className="rocket-icon">🚀</div>
        <h1 className="main-title">BRAIN <span className="highlight">BLASTERS</span></h1>
        <p className="tagline">Blast your way to genius.</p>
      </header>

      <div className="lessons-grid">
        {lessons.map((lesson) => (
          <div 
            key={lesson.id} 
            className={`lesson-card ${lesson.locked ? 'locked' : 'unlocked'}`}
            onClick={() => !lesson.locked && onSelectLesson(lesson.id)}
          >
            <div className="card-inner">
              <span className="lesson-number">#{lesson.id}</span>
              <h3 className="lesson-title">{lesson.title}</h3>
              {lesson.locked ? (
                <div className="lock-badges">🔒</div>
              ) : (
                <div className="play-badge">PLAY ▶</div>
              )}
            </div>
            {!lesson.locked && <div className="card-glow"></div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
