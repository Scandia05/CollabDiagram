const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const users = []; // Aquí se almacenarán los usuarios registrados
const secret = 'secret_key'; // Llave secreta para JWT

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Registro de usuario
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 8);
  users.push({ username, password: hashedPassword });
  res.status(200).send({ message: 'User registered successfully' });
});

// Login de usuario
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (user && bcrypt.compareSync(password, user.password)) {
    const token = jwt.sign({ username: user.username }, secret, { expiresIn: '1h' });
    res.status(200).send({ token });
  } else {
    res.status(401).send({ message: 'Invalid credentials' });
  }
});

// Middleware de autenticación
const authenticate = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(403).send({ message: 'No token provided' });
  }
  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res.status(500).send({ message: 'Failed to authenticate token' });
    }
    req.username = decoded.username;
    next();
  });
};

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

app.get('/api/diagram', authenticate, (req, res) => {
  res.status(200).send({ diagram: currentDiagramXml });
});

app.post('/api/diagram', authenticate, (req, res) => {
  currentDiagramXml = req.body.diagram;
  res.status(200).send({ message: 'Diagram saved successfully' });
});

const PORT = 4000;
server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));


