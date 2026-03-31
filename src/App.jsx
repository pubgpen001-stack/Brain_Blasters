import { useState } from 'react'
import Home from './components/Home'
import LessonDetail from './components/LessonDetail'
import LearnMode from './components/LearnMode'
import TestMode from './components/TestMode'
import './index.css'

function App() {
  const [view, setView] = useState('home');
  const [score, setScore] = useState(0);

  const navigateTo = (newView) => {
    setView(newView);
    window.scrollTo(0, 0);
  };

  const renderView = () => {
    switch (view) {
      case 'home':
        return <Home onSelectLesson={(id) => id === 10 ? navigateTo('lesson-detail') : null} />;
      case 'lesson-detail':
        return (
          <LessonDetail 
            onBack={() => navigateTo('home')} 
            onStartLearn={() => navigateTo('learn')}
            onStartTest={() => navigateTo('test')}
          />
        );
      case 'learn':
        return <LearnMode onBack={() => navigateTo('lesson-detail')} />;
      case 'test':
        return <TestMode onBack={() => navigateTo('lesson-detail')} onGameOver={(finalScore) => setScore(finalScore)} />;
      default:
        return <Home onSelectLesson={() => navigateTo('lesson-detail')} />;
    }
  };

  return (
    <div className="app-container">
      <div className="space-container">
        <div className="stars"></div>
        <div className="stars" style={{ animationDelay: '-30s', opacity: 0.3 }}></div>
      </div>
      
      {renderView()}
    </div>
  )
}

export default App
