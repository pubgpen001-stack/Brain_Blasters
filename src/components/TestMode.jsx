import React, { useState, useEffect, useRef } from 'react';
import { toRoman } from '../utils/roman';
import './TestMode.css';

const LEVELS = {
  1: { max: 10, count: 4, speed: 8000, interval: 2500 },
  2: { max: 20, count: 4, speed: 7000, interval: 2200 },
  3: { max: 30, count: 5, speed: 6000, interval: 2000 },
  4: { max: 40, count: 5, speed: 5000, interval: 1800 },
  5: { max: 50, count: 5, speed: 4500, interval: 1500 },
  6: { max: 50, count: 6, speed: 3500, interval: 1000 },
};

const TestMode = ({ onBack, onGameOver }) => {
  const [gameState, setGameState] = useState('playing'); // 'playing', 'gameover'
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [target, setTarget] = useState(null);
  const [bubbles, setBubbles] = useState([]);
  const [feedback, setFeedback] = useState(null);

  const gameLoopRef = useRef();
  const nextBubbleId = useRef(0);
  const targetRef = useRef(null); // track latest target for use in closures

  // Keep targetRef in sync with target state
  useEffect(() => {
    targetRef.current = target;
  }, [target]);

  // Initialize target
  useEffect(() => {
    if (gameState === 'playing' && !target) {
      generateNewTarget();
    }
  }, [gameState, target, level]);

  // Bubble spawning logic
  useEffect(() => {
    if (gameState !== 'playing') return;

    const spawnInterval = setInterval(() => {
      spawnBubble(false);
    }, LEVELS[level].interval);

    // Force-spawn the correct bubble within 5 seconds max
    const guaranteeInterval = setInterval(() => {
      spawnBubble(true);
    }, 5000);

    return () => {
      clearInterval(spawnInterval);
      clearInterval(guaranteeInterval);
    };
  }, [gameState, level]);

  const generateNewTarget = () => {
    const config = LEVELS[level];
    const newNum = Math.floor(Math.random() * config.max) + 1;
    setTarget({ num: newNum, roman: toRoman(newNum) });
  };

  const spawnBubble = (forceTarget) => {
    const config = LEVELS[level];
    const currentTarget = targetRef.current;
    // Force target bubble, or 50% chance otherwise
    const showTarget = forceTarget || Math.random() < 0.5;
    let num;
    if (showTarget && currentTarget) {
      num = currentTarget.num;
    } else {
      num = Math.floor(Math.random() * config.max) + 1;
    }

    const newBubble = {
      id: nextBubbleId.current++,
      num,
      roman: toRoman(num),
      left: Math.random() * 80 + 10,
      duration: config.speed + (Math.random() * 1000),
      createdAt: Date.now()
    };

    setBubbles(prev => [...prev, newBubble]);

    // Cleanup bubble after animation
    setTimeout(() => {
      setBubbles(prev => {
        const found = prev.find(b => b.id === newBubble.id);
        if (found && found.num === targetRef.current?.num) {
          handleMiss();
        }
        return prev.filter(b => b.id !== newBubble.id);
      });
    }, newBubble.duration);
  };

  const handleBubbleTap = (bubble) => {
    // Ensuring strict equality for Roman Numeral values
    if (bubble.num === target.num) {
      // Correct!
      setScore(prev => {
        const newScore = prev + (10 * level);
        if (newScore >= level * 100 && level < 6) {
          setLevel(l => l + 1);
        }
        return newScore;
      });
      setFeedback({ text: "🚀 BOOM!", type: 'pos' });
      setBubbles(prev => prev.filter(b => b.id !== bubble.id));
      generateNewTarget();
    } else {
      // Wrong!
      handleWrong();
      setFeedback({ text: `${bubble.roman} = ${bubble.num}`, type: 'neg' });
      setBubbles(prev => prev.filter(b => b.id !== bubble.id));
    }

    setTimeout(() => setFeedback(null), 1000);
  };

  const handleMiss = () => {
    setLives(l => {
      if (l <= 1) {
        setGameState('gameover');
        return 0;
      }
      return l - 1;
    });
    setFeedback({ text: `Missed: ${target.num}`, type: 'neg' });
    generateNewTarget();
    setTimeout(() => setFeedback(null), 1000);
  };

  const handleWrong = () => {
    setLives(l => {
      if (l <= 1) {
        setGameState('gameover');
        return 0;
      }
      return l - 1;
    });
  };

  if (gameState === 'gameover') {
    return (
      <div className="gameover-container glass-panel">
        <h1>GAME OVER</h1>
        <p className="final-score">SCORE: {score}</p>
        <p className="final-level">LEVEL REACHED: {level}</p>
        <div className="gameover-actions">
          <button className="btn-primary" onClick={() => window.location.reload()}>PLAY AGAIN</button>
          <button className="back-btn-static" onClick={onBack}>BACK TO MENU</button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <button className="back-btn" onClick={onBack}>QUIT</button>
      
      <div className="hud">
        <div className="hud-item hearts">
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className={i < lives ? "heart filled" : "heart empty"}>❤️</span>
          ))}
        </div>
        <div className="hud-item target-box">
          <span className="find-label">FIND:</span>
          <span className="target-num">{target?.num}</span>
        </div>
        <div className="hud-item stats">
          <div className="score-label">SCORE: {score}</div>
          <div className="level-label">LEVEL: {level}</div>
        </div>
      </div>

      <div className="game-field">
        {bubbles.map(bubble => (
          <div 
            key={bubble.id}
            className="bubble"
            style={{ 
              left: `${bubble.left}%`,
              animationDuration: `${bubble.duration}ms`
            }}
            onClick={() => handleBubbleTap(bubble)}
          >
            {bubble.roman}
          </div>
        ))}
      </div>

      {feedback && (
        <div className={`game-feedback ${feedback.type}`}>
          {feedback.text}
        </div>
      )}
    </div>
  );
};

export default TestMode;
