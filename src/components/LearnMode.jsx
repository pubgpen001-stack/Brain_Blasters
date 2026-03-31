import React, { useState } from 'react';
import './LearnMode.css';

const slides = [
  {
    type: 'content',
    title: "The 4 Magic Symbols",
    content: "For this lesson, we only need 4 symbols. Each one has a value!",
    data: [
      { s: 'I', v: 1 }, { s: 'V', v: 5 }, { s: 'X', v: 10 }, { s: 'L', v: 50 }
    ]
  },
  {
    type: 'quiz',
    question: "What does 'L' equal?",
    options: ["10", "50", "100", "5"],
    answer: "50",
    hint: "Think: L is for LARGE (50 points!)"
  },
  {
    type: 'content',
    title: "Rule #1: Addition",
    content: "When a smaller symbol comes AFTER a larger one, you ADD them!",
    examples: [
      { r: 'VI', e: '5 + 1 = 6' },
      { r: 'XV', e: '10 + 5 = 15' },
      { r: 'XXI', e: '10 + 10 + 1 = 21' }
    ]
  },
  {
    type: 'quiz',
    question: "What does 'XII' equal?",
    options: ["10", "12", "15", "20"],
    answer: "12",
    hint: "10 + 1 + 1 = ?"
  },
  {
    type: 'content',
    title: "Rule #2: Subtraction",
    content: "When a smaller symbol comes BEFORE a larger one, you SUBTRACT it!",
    examples: [
      { r: 'IV', e: '5 - 1 = 4' },
      { r: 'IX', e: '10 - 1 = 9' },
      { r: 'XL', e: '50 - 10 = 40' }
    ]
  },
  {
    type: 'quiz',
    question: "What does 'XIV' equal?",
    options: ["14", "16", "24", "4"],
    answer: "14",
    hint: "10 + (5 - 1) = ?"
  }
];

const LearnMode = ({ onBack }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const slide = slides[currentSlide];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
      setSelectedOption(null);
      setShowFeedback(false);
    } else {
      onBack();
    }
  };

  const handleQuizSubmit = (option) => {
    setSelectedOption(option);
    const correct = option === slide.answer;
    setIsCorrect(correct);
    setShowFeedback(true);
  };

  const progress = ((currentSlide + 1) / slides.length) * 100;

  return (
    <div className="learn-container">
      <button className="back-btn" onClick={onBack}>BACK</button>
      
      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
      </div>

      <div className="slide-content glass-panel">
        <h2 className="slide-title">{slide.title || "Quick Quiz!"}</h2>
        <p className="slide-desc">{slide.content || slide.question}</p>

        {slide.type === 'content' && (
          <div className="content-area">
            {slide.data && (
              <div className="symbol-grid">
                {slide.data.map(item => (
                  <div key={item.s} className="symbol-card">
                    <span className="symbol-text">{item.s}</span>
                    <span className="symbol-value">{item.v}</span>
                  </div>
                ))}
              </div>
            )}
            {slide.examples && (
              <div className="example-list">
                {slide.examples.map(ex => (
                  <div key={ex.r} className="example-item">
                    <span className="roman">{ex.r}</span>
                    <span className="line"></span>
                    <span className="calc">{ex.e}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {slide.type === 'quiz' && (
          <div className="quiz-area">
            <div className="options-grid">
              {slide.options.map(opt => (
                <button 
                  key={opt}
                  className={`option-btn ${selectedOption === opt ? (isCorrect ? 'correct' : 'wrong') : ''}`}
                  onClick={() => !showFeedback && handleQuizSubmit(opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
            {showFeedback && (
              <div className={`feedback ${isCorrect ? 'positive' : 'negative'}`}>
                {isCorrect ? "🚀 BOOM! Correct!" : slide.hint}
              </div>
            )}
          </div>
        )}

        <div className="slide-footer">
          <button 
            className="btn-primary next-btn" 
            onClick={handleNext}
            disabled={slide.type === 'quiz' && !isCorrect}
          >
            {currentSlide === slides.length - 1 ? "FINISH" : "NEXT →"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LearnMode;
