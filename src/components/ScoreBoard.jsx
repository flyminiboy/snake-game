import React from 'react';

function ScoreBoard({ gameState, myId }) {
  if (!gameState || !gameState.players) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.title}>Players</span>
          <span style={styles.count}>0</span>
        </div>
        <div style={styles.emptyState}>Waiting...</div>
      </div>
    );
  }

  const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);

  const getPlayerDisplayName = (player) => {
    if (player.name) {
      return player.name.length > 10 ? player.name.substring(0, 10) + '...' : player.name;
    }
    if (!player.socketId) return '?';
    return player.socketId.length > 6 ? player.socketId.substring(0, 6) : player.socketId;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>Players</span>
        <span style={styles.count}>{sortedPlayers.length}</span>
      </div>
      <div style={styles.list}>
        {sortedPlayers.map((player, index) => {
          const isCurrentPlayer = player.socketId === myId;
          const isAlive = player.alive !== false;

          return (
            <div
              key={player.socketId}
              style={{
                ...styles.row,
                ...(isCurrentPlayer ? styles.currentPlayerRow : {}),
                ...(index === 0 ? styles.leaderRow : {}),
              }}
            >
              <div style={styles.rank}>{index + 1}</div>
              <div
                style={{
                  ...styles.colorMarker,
                  backgroundColor: player.color || '#888',
                  opacity: isAlive ? 1 : 0.4,
                }}
              />
              <div style={styles.playerInfo}>
                <span style={styles.playerName}>
                  {getPlayerDisplayName(player)}
                  {isCurrentPlayer && <span style={styles.meBadge}>*</span>}
                </span>
              </div>
              <div style={styles.score}>{player.score || 0}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#1a1a2e',
    borderRadius: '8px',
    padding: '10px',
    color: '#fff',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    border: '1px solid rgba(78, 205, 196, 0.15)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    paddingBottom: '6px',
    borderBottom: '1px solid rgba(78, 205, 196, 0.3)',
  },
  title: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#4ECDC4',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  count: {
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#888',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: '2px 6px',
    borderRadius: '10px',
  },
  emptyState: {
    color: '#666',
    fontSize: '12px',
    textAlign: 'center',
    padding: '16px 0',
    fontStyle: 'italic',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 8px',
    borderRadius: '4px',
    backgroundColor: '#16213e',
    fontSize: '12px',
  },
  currentPlayerRow: {
    backgroundColor: '#0f3460',
    border: '1px solid rgba(78, 205, 196, 0.4)',
  },
  leaderRow: {
    backgroundColor: '#1a3a3a',
  },
  rank: {
    width: '16px',
    fontSize: '10px',
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'center',
  },
  colorMarker: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    marginLeft: '6px',
    marginRight: '8px',
    flexShrink: 0,
  },
  playerInfo: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
  },
  playerName: {
    fontSize: '12px',
    color: '#ddd',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  meBadge: {
    color: '#4ECDC4',
    fontWeight: 'bold',
    marginLeft: '2px',
  },
  score: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#fff',
    minWidth: '28px',
    textAlign: 'right',
    fontFamily: 'monospace',
  },
};

export default ScoreBoard;
