class Game {
  constructor() {
    this.mapSize = 40;
    this.players = new Map();
    this.food = { x: 0, y: 0 };
    this.gameInterval = null;
    this.colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'];
    this.usedColors = new Set();
    this.generateFood();
  }

  getAvailableColor() {
    for (const color of this.colors) {
      if (!this.usedColors.has(color)) {
        return color;
      }
    }
    return this.colors[Math.floor(Math.random() * this.colors.length)];
  }

  generateFood() {
    let validPosition = false;
    let x, y;

    while (!validPosition) {
      x = Math.floor(Math.random() * this.mapSize);
      y = Math.floor(Math.random() * this.mapSize);

      validPosition = true;
      for (const [playerId, player] of this.players) {
        for (const segment of player.snake) {
          if (segment.x === x && segment.y === y) {
            validPosition = false;
            break;
          }
        }
        if (!validPosition) break;
      }
    }

    this.food = { x, y };
    return this.food;
  }

  addPlayer(socketId, color, name) {
    const playerColor = color || this.getAvailableColor();
    this.usedColors.add(playerColor);

    const startX = Math.floor(Math.random() * (this.mapSize - 10)) + 5;
    const startY = Math.floor(Math.random() * (this.mapSize - 10)) + 5;

    this.players.set(socketId, {
      snake: [
        { x: startX, y: startY },
        { x: startX - 1, y: startY },
        { x: startX - 2, y: startY }
      ],
      direction: 'right',
      nextDirection: 'right',
      score: 0,
      color: playerColor,
      alive: true,
      name: name || socketId.substring(0, 8)
    });

    return playerColor;
  }

  removePlayer(socketId) {
    const player = this.players.get(socketId);
    if (player) {
      this.usedColors.delete(player.color);
      this.players.delete(socketId);
    }
  }

  startGame(callback) {
    if (this.gameInterval) return;
    this.gameInterval = setInterval(() => {
      const result = this.update();
      if (result && result.gameOver) {
        this.stopGame();
        if (callback) {
          callback({ gameOver: true, winner: result.winner, allPlayers: result.allPlayers });
        }
      } else if (callback) {
        callback();
      }
    }, 100);
  }

  stopGame() {
    if (this.gameInterval) {
      clearInterval(this.gameInterval);
      this.gameInterval = null;
    }
  }

  changeDirection(socketId, direction) {
    const player = this.players.get(socketId);
    if (!player || !player.alive) return;

    const opposites = {
      'up': 'down',
      'down': 'up',
      'left': 'right',
      'right': 'left'
    };

    if (player.direction !== opposites[direction]) {
      player.nextDirection = direction;
    }
  }

  checkWallCollision(snake) {
    const head = snake[0];
    return head.x < 0 || head.x >= this.mapSize || head.y < 0 || head.y >= this.mapSize;
  }

  checkSelfCollision(snake) {
    const head = snake[0];
    for (let i = 1; i < snake.length; i++) {
      if (head.x === snake[i].x && head.y === snake[i].y) {
        return true;
      }
    }
    return false;
  }

  checkPlayerCollision(newHead, allSnakes, currentPlayerId) {
    for (const [socketId, otherPlayer] of allSnakes) {
      if (!otherPlayer.alive) continue;
      if (socketId === currentPlayerId) continue;
      
      const otherSnake = otherPlayer.snake;
      for (const segment of otherSnake) {
        if (newHead.x === segment.x && newHead.y === segment.y) {
          return true;
        }
      }
    }
    return false;
  }

  update() {
    // Step 1: Calculate all new head positions first (don't move yet)
    const newHeads = new Map();
    const playersToMove = [];

    for (const [socketId, player] of this.players) {
      if (!player.alive) continue;

      player.direction = player.nextDirection;

      const head = player.snake[0];
      let newHead = { x: head.x, y: head.y };

      switch (player.direction) {
        case 'up': newHead.y -= 1; break;
        case 'down': newHead.y += 1; break;
        case 'left': newHead.x -= 1; break;
        case 'right': newHead.x += 1; break;
      }

      // Wall wrapping
      if (newHead.x < 0) newHead.x = this.mapSize - 1;
      if (newHead.x >= this.mapSize) newHead.x = 0;
      if (newHead.y < 0) newHead.y = this.mapSize - 1;
      if (newHead.y >= this.mapSize) newHead.y = 0;

      newHeads.set(socketId, newHead);
      playersToMove.push(socketId);
    }

    // Step 2: Check self-collision
    for (const socketId of playersToMove) {
      const player = this.players.get(socketId);
      const newHead = newHeads.get(socketId);
      
      if (this.checkSelfCollision([newHead, ...player.snake])) {
        player.alive = false;
      }
    }

    // Step 3: Check head-to-head collisions (both die)
    const aliveMovers = playersToMove.filter(id => this.players.get(id).alive);
    for (let i = 0; i < aliveMovers.length; i++) {
      for (let j = i + 1; j < aliveMovers.length; j++) {
        const id1 = aliveMovers[i];
        const id2 = aliveMovers[j];
        const head1 = newHeads.get(id1);
        const head2 = newHeads.get(id2);

        if (head1.x === head2.x && head1.y === head2.y) {
          // Head-to-head: both die
          this.players.get(id1).alive = false;
          this.players.get(id2).alive = false;
        }
      }
    }

    // Step 4: Check head-to-body collisions (mover dies, body owner lives)
    for (const socketId of aliveMovers) {
      const player = this.players.get(socketId);
      if (!player.alive) continue;

      const newHead = newHeads.get(socketId);

      for (const [otherId, otherPlayer] of this.players) {
        if (!otherPlayer.alive) continue;
        if (otherId === socketId) continue;

        // Check if new head hits other snake (including head)
        for (let i = 0; i < otherPlayer.snake.length; i++) {
          const segment = otherPlayer.snake[i];
          if (newHead.x === segment.x && newHead.y === segment.y) {
            player.alive = false;
            break;
          }
        }
      }
    }

    // Step 5: Move surviving snakes
    for (const socketId of playersToMove) {
      const player = this.players.get(socketId);
      if (!player.alive) continue;

      const newHead = newHeads.get(socketId);
      player.snake.unshift(newHead);

      // Check food eating
      if (newHead.x === this.food.x && newHead.y === this.food.y) {
        player.score += 10;
        this.generateFood();
      } else {
        player.snake.pop();
      }
    }

    // Step 6: Determine game over - winner is highest score (even if dead)
    let aliveCount = 0;
    for (const player of this.players.values()) {
      if (player.alive) aliveCount++;
    }

    if (aliveCount === 0) {
      let winner = null;
      let maxScore = -1;

      const allPlayers = Array.from(this.players.entries()).map(([socketId, p]) => {
        if (p.score > maxScore) {
          maxScore = p.score;
          winner = { socketId, color: p.color, score: p.score, name: p.name };
        }
        return {
          socketId,
          name: p.name,
          score: p.score,
          color: p.color,
          alive: p.alive
        };
      });

      return { gameOver: true, winner, allPlayers };
    }

    return { gameOver: false };
  }

  getState() {
    const playersArray = [];
    for (const [socketId, player] of this.players) {
      playersArray.push({
        socketId,
        snake: player.alive ? player.snake : [],
        direction: player.direction,
        score: player.score,
        color: player.color,
        alive: player.alive,
        name: player.name
      });
    }
    return {
      players: playersArray,
      food: this.food,
      mapSize: this.mapSize
    };
  }
}

export { Game };