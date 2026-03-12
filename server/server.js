import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Game } from './game.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const game = new Game();

io.on('connection', (socket) => {
  socket.on('join-game', (data) => {
    const playerName = data && data.name ? data.name.trim() : null;
    const color = game.addPlayer(socket.id, null, playerName);
    socket.emit('player-joined', { socketId: socket.id, color, name: playerName || socket.id.substring(0, 8) });
    io.emit('player-joined', { socketId: socket.id, color, name: playerName || socket.id.substring(0, 8) });
    io.emit('game-state', game.getState());

    if (game.players.size >= 1 && !game.gameInterval) {
      game.startGame((data) => {
        if (data && data.gameOver === true) {
          io.emit('game-over', { winner: data.winner, allPlayers: data.allPlayers });
        } else {
          io.emit('game-state', game.getState());
        }
      });
    }
  });

  socket.on('change-direction', (direction) => {
    game.changeDirection(socket.id, direction);
  });

  socket.on('restart-game', () => {
    for (const [playerId, player] of game.players) {
      const startX = Math.floor(Math.random() * (game.mapSize - 10)) + 5;
      const startY = Math.floor(Math.random() * (game.mapSize - 10)) + 5;
      player.snake = [
        { x: startX, y: startY },
        { x: startX - 1, y: startY },
        { x: startX - 2, y: startY }
      ];
      player.direction = 'right';
      player.nextDirection = 'right';
      player.score = 0;
      player.alive = true;
    }
    game.generateFood();
    io.emit('game-restarted', { players: Array.from(game.players.entries()).map(([id, p]) => ({ socketId: id, name: p.name })) });
    io.emit('game-state', game.getState());

    if (!game.gameInterval) {
      game.startGame((data) => {
        if (data && data.gameOver === true) {
          io.emit('game-over', { winner: data.winner, allPlayers: data.allPlayers });
        } else {
          io.emit('game-state', game.getState());
        }
      });
    }
  });

  socket.on('disconnect', () => {
    game.removePlayer(socket.id);
    io.emit('player-left', { socketId: socket.id });

    if (game.players.size < 1) {
      game.stopGame();
    }
  });
});

const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.io server ready`);
});