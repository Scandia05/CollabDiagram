const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

let currentDiagramXml = "";

io.on('connection', (socket) => {
  console.log('New client connected');
  
  if (currentDiagramXml) {
    socket.emit('load-diagram', currentDiagramXml);
  }

  socket.on('diagram-update', (xml) => {
    console.log('Diagram updated');
    currentDiagramXml = xml;
    socket.broadcast.emit('diagram-update', xml);
  });

  socket.on('cursor-update', ({ id, x, y }) => {
    socket.broadcast.emit('cursor-update', { id, x, y });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = 4000;
server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));

