import { useEffect } from 'react';

function useKeyboard(socket, hasJoined, predictMove) {
  useEffect(() => {
    if (!socket || !hasJoined) return;

    const handleKeyDown = (event) => {
      const key = event.key;
      let direction = null;

      if (key === 'ArrowUp' || key === 'w' || key === 'W') {
        direction = 'up';
      } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
        direction = 'down';
      } else if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
        direction = 'left';
      } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
        direction = 'right';
      }

      if (direction) {
        event.preventDefault();
        predictMove(direction);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [socket, hasJoined, predictMove]);
}

export default useKeyboard;
