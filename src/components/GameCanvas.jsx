import React, { useRef, useEffect, useState, useCallback } from 'react';

const FOOD_COLOR = '#00FF00';
const GRID_COLOR = '#E0E0E0';
const BACKGROUND_COLOR = '#FFFFFF';

function GameCanvas({ gameState }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 400 });

  const calculateCanvasSize = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    const availableWidth = containerRect.width;
    const availableHeight = containerRect.height;
    
    const maxSize = Math.min(availableWidth, availableHeight);
    
    const minSize = 280;
    const finalSize = Math.max(minSize, Math.floor(maxSize));
    
    setCanvasSize({ width: finalSize, height: finalSize });
  }, []);

  useEffect(() => {
    calculateCanvasSize();
    
    const handleResize = () => {
      requestAnimationFrame(calculateCanvasSize);
    };
    
    window.addEventListener('resize', handleResize);
    
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(calculateCanvasSize);
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, [calculateCanvasSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = canvasSize;
    const mapSize = gameState.mapSize || 40;
    const cellSize = width / mapSize;

    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1;

    for (let i = 0; i <= mapSize; i++) {
      const pos = i * cellSize;
      
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, height);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(width, pos);
      ctx.stroke();
    }

    if (gameState.food) {
      ctx.fillStyle = FOOD_COLOR;
      const foodX = gameState.food.x * cellSize;
      const foodY = gameState.food.y * cellSize;
      ctx.fillRect(foodX + 1, foodY + 1, cellSize - 2, cellSize - 2);
    }

    if (gameState.players) {
      gameState.players.forEach(player => {
        if (!player.alive || !player.snake) return;

        ctx.fillStyle = player.color || '#FF6B6B';
        
        player.snake.forEach(segment => {
          const segX = segment.x * cellSize;
          const segY = segment.y * cellSize;
          ctx.fillRect(segX + 1, segY + 1, cellSize - 2, cellSize - 2);
        });
      });
    }
  }, [gameState, canvasSize]);

  return (
    <div 
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={{
          border: '2px solid #333',
          borderRadius: '4px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          maxWidth: '100%',
          maxHeight: '100%',
        }}
      />
    </div>
  );
}

export default GameCanvas;
