import io from 'socket.io-client';
import { AuthContext } from './AuthContext';
import { useContext } from 'react';

const socket = io('http://200.13.4.230:4000', {
  auth: {
    token: localStorage.getItem('token')
  }
});

socket.on('connect', () => {
  console.log('Connected to WebSocket server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket server');
});

socket.on('diagram-update', (xml) => {
  console.log('Diagram updated:', xml);
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});

export default socket;
