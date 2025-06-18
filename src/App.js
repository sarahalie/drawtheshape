import React, { useState, useRef } from 'react';
import './App.css';
import DrawingGame from './components/DrawingGame';

// Game States
const GAME_STATES = {
  MAIN_MENU: 'MAIN_MENU',
  THEME_SELECTION: 'THEME_SELECTION',
  GAME: 'GAME',
  SETTINGS: 'SETTINGS'
};

// Maximum levels for each theme
const MAX_LEVELS = {
  geometry: 10,
  nature: 10,
  abstract: 10
};

function App() {
  const [gameState, setGameState] = useState(GAME_STATES.MAIN_MENU);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);
  const [volume, setVolume] = useState(0.5); // Default volume at 50%
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);
  const audioRef = useRef(new Audio('/bgm.mp3'));

  const handleMainMenuClick = (option) => {
    switch (option) {
      case 'play':
        setGameState(GAME_STATES.THEME_SELECTION);
        break;
      case 'settings':
        setGameState(GAME_STATES.SETTINGS);
        break;
      case 'exit':
        // Handle exit logic here
        break;
      default:
        break;
    }
  };

  const handleThemeSelect = (theme) => {
    setSelectedTheme(theme);
    setCurrentLevel(1);
    setGameState(GAME_STATES.GAME);
  };

  const handleGameSuccess = () => {
    // Add badge for completed level
    setEarnedBadges(prev => [...prev, `${selectedTheme}-${currentLevel}`]);
    
    // Move to next level if available
    if (currentLevel < MAX_LEVELS[selectedTheme]) {
      setCurrentLevel(prev => prev + 1);
    }
    setShowCompletionMessage(true);
  };

  const toggleMusic = () => {
    if (isMusicPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
      audioRef.current.loop = true;
    }
    setIsMusicPlaying(!isMusicPlaying);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    audioRef.current.volume = newVolume;
  };

  const renderCurrentScreen = () => {
    switch (gameState) {
      case GAME_STATES.MAIN_MENU:
        return (
          <div className="main-menu">
            <div 
              className="music-control"
              onMouseEnter={() => setShowVolumeControl(true)}
              onMouseLeave={() => setShowVolumeControl(false)}
            >
              <div className="music-toggle" onClick={toggleMusic}>
                {isMusicPlaying ? '🔊' : '🔇'}
              </div>
              {showVolumeControl && (
                <div className="volume-control">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="volume-slider"
                  />
                  <div className="volume-indicator">
                    {Math.round(volume * 100)}%
                  </div>
                </div>
              )}
            </div>
            <h1>Draw the Shape</h1>
            <div className="menu-buttons">
              <button onClick={() => handleMainMenuClick('play')}>Play</button>
              <button onClick={() => handleMainMenuClick('settings')}>Settings</button>
              <button onClick={() => handleMainMenuClick('exit')}>Exit</button>
            </div>
            {earnedBadges.length > 0 && (
              <div className="badges">
                <h3>Your Badges: {earnedBadges.length}</h3>
              </div>
            )}
          </div>
        );
      
      case GAME_STATES.THEME_SELECTION:
        return (
          <div className="theme-selection">
            <h2>Games</h2>
            <div className="theme-cards">
              <div 
                className="theme-card" 
                onClick={() => handleThemeSelect('geometry')}
                style={{ '--card-color': '#2962ff' }}
              >
                <div className="theme-card-image">
                  <img src="t1.png" alt="Geometric shapes" />
                </div>
                <h3>Geometry</h3>
              </div>
              <div 
                className="theme-card" 
                onClick={() => handleThemeSelect('nature')}
                style={{ '--card-color': '#00c853' }}
              >
                <div className="theme-card-image">
                  <img src="t2.png" alt="Nature shapes" />
                </div>
                <h3>Nature</h3>
              </div>
              <div 
                className="theme-card" 
                onClick={() => handleThemeSelect('abstract')}
                style={{ '--card-color': '#aa00ff' }}
              >
                <div className="theme-card-image">
                  <img src="/t3.png" alt="Abstract shapes" />
                </div>
                <h3>Abstract</h3>
              </div>
            </div>
            <button className="back-button" onClick={() => setGameState(GAME_STATES.MAIN_MENU)}>
              Back to Menu
            </button>
          </div>
        );

      case GAME_STATES.GAME:
        return (
          <div className="game-container">
            <div className="game-header">
              <h2>{selectedTheme.charAt(0).toUpperCase() + selectedTheme.slice(1)} Shapes</h2>
              <div className="level-indicator">
                Level {currentLevel} / {MAX_LEVELS[selectedTheme]}
              </div>
            </div>
            <DrawingGame
              theme={selectedTheme}
              level={currentLevel}
              onSuccess={handleGameSuccess}
              maxLevels={MAX_LEVELS[selectedTheme]}
            />
            <div className="game-controls">
              <button 
                onClick={() => setGameState(GAME_STATES.THEME_SELECTION)} 
                className="back-button"
              >
                Back to Themes
              </button>
              {showCompletionMessage && currentLevel === MAX_LEVELS[selectedTheme] && (
                <div className="completion-message">
                  🎉 Theme Completed! 🎉
                  <button 
                    className="close-btn" 
                    onClick={() => setShowCompletionMessage(false)}
                    aria-label="Close message"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case GAME_STATES.SETTINGS:
        return (
          <div className="settings">
            <h2>Settings</h2>
            <div className="settings-options">
              <div className="music-controls">
                <h3>Music</h3>
                <button onClick={toggleMusic} className="music-button">
                  {isMusicPlaying ? 'pause music' : 'play music'}
                </button>
              </div>

              <div className="accessibility">
                <h3>How to Play</h3>
                <div className="steps-container">
                  <div className="step">
                    <div className="step-number">1</div>
                    <div className="step-content">
                      <h4>Choose Your Theme</h4>
                      <p>Select from Geometry, Nature, or Abstract shapes</p>
                    </div>
                  </div>

                  <div className="step">
                    <div className="step-number">2</div>
                    <div className="step-content">
                      <h4>Pick Your Colors</h4>
                      <p>Use our dyslexia-friendly color palette to draw</p>
                    </div>
                  </div>

                  <div className="step">
                    <div className="step-number">3</div>
                    <div className="step-content">
                      <h4>Draw the Shape</h4>
                      <p>Follow the gray outline to complete each level</p>
                    </div>
                  </div>

                  <div className="step">
                    <div className="step-number">4</div>
                    <div className="step-content">
                      <h4>Earn Badges</h4>
                      <p>Complete levels to collect heart badges</p>
                    </div>
                  </div>
                </div>

                <div className="accessibility-features">
                  <h3>Accessibility Features</h3>
                  <div className="feature">
                    <span className="feature-icon">🔤</span>
                    <p>OpenDyslexic font for better readability</p>
                  </div>
                  <div className="feature">
                    <span className="feature-icon">🎨</span>
                    <p>High contrast, dyslexia-friendly colors</p>
                  </div>
                  <div className="feature">
                    <span className="feature-icon">↔️</span>
                    <p>Clear spacing between elements</p>
                  </div>
                  <div className="feature">
                    <span className="feature-icon">🔄</span>
                    <p>Simple, intuitive navigation</p>
                  </div>
                </div>
              </div>
            </div>
            <button className="back-button" onClick={() => setGameState(GAME_STATES.MAIN_MENU)}>back</button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="App">
      {renderCurrentScreen()}
    </div>
  );
}

export default App;
