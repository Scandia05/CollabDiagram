import io from 'socket.io-client';
import { getAuthToken } from './AuthContext';  // Suponiendo que tienes una función para obtener el token almacenado

const token = getAuthToken();

const socket = io('http://200.13.4.230:4000', {
  auth: {
    token
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

