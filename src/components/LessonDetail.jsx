import React from 'react';
import './LessonDetail.css';

const LessonDetail = ({ onBack, onStartLearn, onStartTest, onStartInvaders }) => {
  return (
    <div className="lesson-detail-container">
      <button className="back-btn" onClick={onBack}>← MENU</button>
      
      <header className="detail-header">
        <span className="lesson-tag">LESSON 10</span>
        <h2 className="detail-title">Roman <span className="highlight">Numerals</span></h2>
        <p className="detail-desc">Unlock the secrets of ancient numbers and blast through the galaxy!</p>
      </header>

      <div className="mode-selection">
        <div className="mode-card learn-mode" onClick={onStartLearn}>
          <div className="mode-icon">📖</div>
          <h3>LEARN</h3>
          <p>Master the 4 symbols and rules of Roman Numerals.</p>
          <button className="btn-primary">START LEARNING</button>
        </div>

        <div className="mode-card test-mode" onClick={onStartTest}>
          <div className="mode-icon">🫧</div>
          <h3>BUBBLES</h3>
          <p>Pop the right antigravity bubbles!</p>
          <button className="btn-primary">PLAY BUBBLES</button>
        </div>

        <div className="mode-card test-mode" onClick={onStartInvaders}>
          <div className="mode-icon">👾</div>
          <h3>INVADERS</h3>
          <p>Shoot the right Roman Numeral invaders!</p>
          <button className="btn-primary">PLAY INVADERS</button>
        </div>
      </div>
    </div>
  );
};

export default LessonDetail;
