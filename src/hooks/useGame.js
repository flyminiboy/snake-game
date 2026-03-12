import { useState, useEffect, useCallback } from 'react';

function useGame(socket) {
  const [gameState, setGameState] = useState({
    players: [],
    food: { x: 0, y: 0 },
    mapSize: 40
  });
  const [myId, setMyId] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allPlayers, setAllPlayers] = useState([]);
  const [isDead, setIsDead] = useState(false);

  const joinGame = useCallback((name) => {
    if (socket && name.trim()) {
      setPlayerName(name.trim());
      setHasJoined(true);
      setIsDead(false);
      socket.emit('join-game', { name: name.trim() });
    }
  }, [socket]);

  const leaveGame = useCallback(() => {
    setHasJoined(false);
    setGameOver(false);
    setWinner(null);
    setPlayerName('');
    setAllPlayers([]);
    setIsDead(false);
    setGameState({
      players: [],
      food: { x: 0, y: 0 },
      mapSize: 40
    });
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('game-state', (state) => {
      setGameState(state);
      if (myId) {
        const me = state.players.find(p => p.socketId === myId);
        if (me && !me.alive) {
          setIsDead(true);
        }
      }
    });

    socket.on('player-joined', (data) => {
      setMyId(socket.id);
      setIsLoading(false);
    });

    socket.on('connect', () => {
      setMyId(socket.id);
      setIsLoading(false);
    });

    socket.on('game-over', (data) => {
      setGameOver(true);
      setWinner(data.winner);
      setAllPlayers(data.allPlayers || []);
    });

    socket.on('game-restarted', () => {
      setGameOver(false);
      setWinner(null);
      setAllPlayers([]);
      setIsDead(false);
    });

    return () => {
      socket.off('game-state');
      socket.off('player-joined');
      socket.off('connect');
      socket.off('game-over');
      socket.off('game-restarted');
    };
  }, [socket, myId]);

  return { gameState, myId, playerName, hasJoined, gameOver, winner, allPlayers, isLoading, isDead, joinGame, leaveGame };
}

export default useGame;
