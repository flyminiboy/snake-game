import { useState, useEffect, useCallback, useRef } from 'react';

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
  const predictedDirection = useRef(null);
  const [predictedState, setPredictedState] = useState(null);

  const joinGame = useCallback((name) => {
    if (socket && name.trim()) {
      setPlayerName(name.trim());
      setHasJoined(true);
      setIsDead(false);
      setPredictedState(null);
      predictedDirection.current = null;
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
    setPredictedState(null);
    predictedDirection.current = null;
    setGameState({
      players: [],
      food: { x: 0, y: 0 },
      mapSize: 40
    });
  }, []);

  const predictMove = useCallback((direction) => {
    if (!myId || !hasJoined) return;
    
    const me = gameState.players.find(p => p.socketId === myId);
    if (!me || !me.alive) return;

    const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
    if (me.direction === opposites[direction]) return;

    predictedDirection.current = direction;
    
    const head = me.snake[0];
    let newHead = { x: head.x, y: head.y };
    switch (direction) {
      case 'up': newHead.y -= 1; break;
      case 'down': newHead.y += 1; break;
      case 'left': newHead.x -= 1; break;
      case 'right': newHead.x += 1; break;
    }

    const mapSize = gameState.mapSize || 40;
    if (newHead.x < 0) newHead.x = mapSize - 1;
    if (newHead.x >= mapSize) newHead.x = 0;
    if (newHead.y < 0) newHead.y = mapSize - 1;
    if (newHead.y >= mapSize) newHead.y = 0;

    const predictedSnake = [newHead, ...me.snake.slice(0, -1)];
    
    setPredictedState({
      socketId: myId,
      snake: predictedSnake,
      direction: direction
    });

    socket.emit('change-direction', direction);
  }, [socket, myId, hasJoined, gameState]);

  useEffect(() => {
    if (!socket) return;

    socket.on('game-state', (state) => {
      setGameState(state);
      
      if (predictedDirection.current) {
        const me = state.players.find(p => p.socketId === myId);
        if (me && me.direction === predictedDirection.current) {
          setPredictedState(null);
          predictedDirection.current = null;
        }
      }
      
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
      setPredictedState(null);
      predictedDirection.current = null;
    });

    return () => {
      socket.off('game-state');
      socket.off('player-joined');
      socket.off('connect');
      socket.off('game-over');
      socket.off('game-restarted');
    };
  }, [socket, myId]);

  const displayState = {
    ...gameState,
    players: gameState.players.map(p => {
      if (p.socketId === myId && predictedState) {
        return {
          ...p,
          snake: predictedState.snake,
          direction: predictedState.direction
        };
      }
      return p;
    })
  };

  return { 
    gameState: displayState, 
    myId, 
    playerName, 
    hasJoined, 
    gameOver, 
    winner, 
    allPlayers, 
    isLoading, 
    isDead, 
    joinGame, 
    leaveGame,
    predictMove
  };
}

export default useGame;
