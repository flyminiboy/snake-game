import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

function useSocket() {
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');

  useEffect(() => {
    const socketInstance = io();

    socketInstance.on('connect', () => {
      setConnectionStatus('Connected');
    });

    socketInstance.on('disconnect', () => {
      setConnectionStatus('Disconnected');
    });

    socketInstance.on('connect_error', () => {
      setConnectionStatus('Disconnected');
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return { socket, connectionStatus };
}

export default useSocket;
