import React, { useState } from 'react';
import useSocket from './hooks/useSocket';
import useGame from './hooks/useGame';
import useKeyboard from './hooks/useKeyboard';
import GameCanvas from './components/GameCanvas';
import ScoreBoard from './components/ScoreBoard';

function App() {
  const { socket, connectionStatus } = useSocket();
  const { gameState, myId, hasJoined, gameOver, winner, allPlayers, isDead, joinGame, leaveGame } = useGame(socket);
  const [inputName, setInputName] = useState('');

  useKeyboard(socket, hasJoined);

  const handleJoin = (e) => {
    e.preventDefault();
    if (inputName.trim()) {
      joinGame(inputName.trim());
    }
  };

  const handleRestart = () => {
    if (socket) {
      socket.emit('restart-game');
    }
  };

  const handleLeave = () => {
    leaveGame();
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'Connected':
        return '#4ECDC4';
      case 'Connecting...':
        return '#FFA07A';
      case 'Disconnected':
        return '#FF6B6B';
      default:
        return '#888';
    }
  };

  if (connectionStatus !== 'Connected') {
    return (
      <div style={styles.container}>
        <div style={styles.loadingOverlay}>
          <div style={styles.loadingSpinner} />
          <p style={styles.loadingText}>Connecting...</p>
        </div>
      </div>
    );
  }

  if (!hasJoined) {
    return (
      <div style={styles.container}>
        <div style={styles.nameInputOverlay}>
          <div style={styles.nameInputContainer}>
            <h1 style={styles.nameInputTitle}>Snake</h1>
            <p style={styles.nameInputSubtitle}>Enter your name to play</p>
            <form onSubmit={handleJoin} style={styles.nameInputForm}>
              <input
                type="text"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                placeholder="Your name"
                maxLength={20}
                style={styles.nameInput}
                autoFocus
              />
              <button
                type="submit"
                disabled={!inputName.trim()}
                style={{
                  ...styles.joinButton,
                  opacity: inputName.trim() ? 1 : 0.5,
                  cursor: inputName.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Join Game
              </button>
            </form>
            <div style={styles.statusContainer}>
              <div
                style={{
                  ...styles.statusDot,
                  backgroundColor: getStatusColor(),
                }}
              />
              <span style={styles.statusText}>{connectionStatus}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Snake</h1>
        <div style={styles.statusContainer}>
          <div
            style={{
              ...styles.statusDot,
              backgroundColor: getStatusColor(),
            }}
          />
          <span style={styles.statusText}>{connectionStatus}</span>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.gameArea}>
          <GameCanvas gameState={gameState} />
        </div>
        <aside style={styles.sidebar}>
          <ScoreBoard gameState={gameState} myId={myId} />
          <div style={styles.controlsHint}>
            <span style={styles.controlsText}>Arrow keys / WASD to move</span>
          </div>
        </aside>
      </main>

      {isDead && !gameOver && (
        <div style={styles.gameOverOverlay}>
          <h2 style={{...styles.gameOverTitle, color: '#FF6B6B'}}>💀 You Died!</h2>
          <p style={styles.finalScore}>Score: {gameState.players.find(p => p.socketId === myId)?.score || 0}</p>
          <p style={{...styles.gameOverText, fontSize: '14px', marginBottom: '20px'}}>
            Other players are still playing...
          </p>
          <button
            onClick={handleLeave}
            style={styles.restartButton}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#3db5b2')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = '#4ECDC4')}
          >
            Play Again
          </button>
        </div>
      )}

      {gameOver && (
        <div style={styles.gameOverOverlay}>
          <h2 style={styles.gameOverTitle}>Game Over</h2>

          <div style={styles.rankingList}>
            {allPlayers
              .sort((a, b) => b.score - a.score)
              .map((player, index) => (
                <div
                  key={player.socketId}
                  style={{
                    ...styles.rankingItem,
                    backgroundColor: player.socketId === myId ? '#1a3a3a' : '#16213e',
                    border: player.socketId === myId ? '1px solid #4ECDC4' : 'none'
                  }}
                >
                  <span style={styles.rank}>#{index + 1}</span>
                  <span style={{...styles.playerDot, backgroundColor: player.color}}>●</span>
                  <span style={styles.playerName}>
                    {player.name}
                    {player.socketId === myId && <span style={styles.youTag}> (You)</span>}
                  </span>
                  <span style={styles.playerScore}>{player.score}</span>
                  {!player.alive && <span style={styles.deadIcon}>💀</span>}
                </div>
              ))}
          </div>

          <p style={{
            ...styles.resultText,
            color: winner?.socketId === myId ? '#4ECDC4' : '#FF6B6B'
          }}>
            {winner?.socketId === myId ? '🎉 You Win!' : 'Game Over'}
          </p>

          <button
            onClick={handleLeave}
            style={styles.restartButton}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#3db5b2')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = '#4ECDC4')}
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#0d0d1a',
    color: '#fff',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    overflow: 'hidden',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 16px',
    backgroundColor: '#1a1a2e',
    borderBottom: '1px solid rgba(78, 205, 196, 0.2)',
    flexShrink: 0,
  },
  title: {
    margin: 0,
    color: '#4ECDC4',
    fontSize: '20px',
    fontWeight: 'bold',
    letterSpacing: '1px',
  },
  statusContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    transition: 'background-color 0.3s ease',
  },
  statusText: {
    fontSize: '12px',
    color: '#aaa',
    fontWeight: '500',
  },
  main: {
    display: 'flex',
    flexDirection: 'row',
    flex: 1,
    minHeight: 0,
    gap: '12px',
    padding: '12px',
    boxSizing: 'border-box',
  },
  gameArea: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 0,
    minHeight: 0,
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '180px',
    flexShrink: 0,
  },
  controlsHint: {
    padding: '8px',
    backgroundColor: 'rgba(78, 205, 196, 0.08)',
    borderRadius: '6px',
    border: '1px solid rgba(78, 205, 196, 0.15)',
    textAlign: 'center',
  },
  controlsText: {
    fontSize: '11px',
    color: '#888',
    lineHeight: 1.4,
  },
  loadingOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(13, 13, 26, 0.98)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(78, 205, 196, 0.2)',
    borderTop: '3px solid #4ECDC4',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '16px',
    fontSize: '14px',
    color: '#4ECDC4',
  },
  nameInputOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(13, 13, 26, 0.98)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  nameInputContainer: {
    backgroundColor: '#1a1a2e',
    padding: '40px 48px',
    borderRadius: '16px',
    border: '2px solid rgba(78, 205, 196, 0.3)',
    boxShadow: '0 0 60px rgba(78, 205, 196, 0.2)',
    textAlign: 'center',
    minWidth: '320px',
  },
  nameInputTitle: {
    color: '#4ECDC4',
    fontSize: '36px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
    letterSpacing: '2px',
  },
  nameInputSubtitle: {
    color: '#888',
    fontSize: '14px',
    margin: '0 0 32px 0',
  },
  nameInputForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '24px',
  },
  nameInput: {
    padding: '14px 18px',
    fontSize: '16px',
    backgroundColor: '#0d0d1a',
    border: '2px solid rgba(78, 205, 196, 0.3)',
    borderRadius: '8px',
    color: '#fff',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'inherit',
  },
  joinButton: {
    padding: '14px 28px',
    backgroundColor: '#4ECDC4',
    color: '#0d0d1a',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s, transform 0.1s',
    fontFamily: 'inherit',
  },
  gameOverOverlay: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    padding: '32px',
    borderRadius: '12px',
    textAlign: 'center',
    zIndex: 1000,
    minWidth: '280px',
    border: '2px solid #4ECDC4',
    boxShadow: '0 0 40px rgba(78, 205, 196, 0.3)',
  },
  gameOverTitle: {
    color: '#fff',
    margin: '0 0 20px 0',
    fontSize: '24px',
  },
  winnerContainer: {
    marginBottom: '24px',
  },
  winnerLabel: {
    color: '#aaa',
    margin: '0 0 12px 0',
    fontSize: '14px',
  },
  winnerColor: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    margin: '0 auto 12px',
    border: '2px solid #fff',
    boxShadow: '0 0 16px rgba(255, 255, 255, 0.2)',
  },
  winnerScore: {
    color: '#4ECDC4',
    fontSize: '18px',
    fontWeight: 'bold',
    margin: 0,
  },
  singlePlayerGameOver: {
    marginBottom: '24px',
  },
  gameOverText: {
    color: '#FF6B6B',
    fontSize: '20px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
  },
  finalScore: {
    color: '#4ECDC4',
    fontSize: '18px',
    fontWeight: 'bold',
    margin: 0,
  },
  restartButton: {
    padding: '12px 28px',
    backgroundColor: '#4ECDC4',
    color: '#0d0d1a',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  rankingList: {
    marginBottom: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  rankingItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 16px',
    borderRadius: '8px',
  },
  rank: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#888',
    width: '24px',
  },
  playerDot: {
    fontSize: '16px',
  },
  playerName: {
    flex: 1,
    fontSize: '14px',
    color: '#fff',
  },
  youTag: {
    color: '#4ECDC4',
    fontSize: '12px',
  },
  playerScore: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#4ECDC4',
    fontFamily: 'monospace',
  },
  deadIcon: {
    fontSize: '16px',
  },
  resultText: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '20px',
  },
};

const responsiveStyles = document.createElement('style');
responsiveStyles.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    .snake-main {
      flex-direction: column !important;
    }
    .snake-sidebar {
      width: 100% !important;
      flex-direction: row !important;
      align-items: flex-start;
    }
    .snake-sidebar > * {
      flex: 1;
    }
  }

  @media (max-width: 480px) {
    .snake-title {
      font-size: 16px !important;
    }
    .snake-status-text {
      font-size: 10px !important;
    }
    .snake-header {
      padding: 6px 12px !important;
    }
    .snake-main {
      padding: 8px !important;
      gap: 8px !important;
    }
  }
`;
document.head.appendChild(responsiveStyles);

export default App;
