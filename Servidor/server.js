const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Conectar a la base de datos MongoDB
mongoose.connect('mongodb://localhost:27017/mxgraph', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Definir el esquema y el modelo de usuario
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  name: String,
  email: String,
});

const User = mongoose.model('User', userSchema);

let activeSessions = {}; // Para rastrear sesiones activas

// Ruta de registro de usuario
app.post('/register', async (req, res) => {
  const { username, password, name, email } = req.body;

  if (!username || !password || !name || !email) {
    return res.status(400).send('All fields are required');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
    username,
    password: hashedPassword,
    name,
    email,
  });

  await newUser.save();
  res.status(201).send('User registered successfully');
});

// Ruta de inicio de sesión de usuario
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send('Username and password are required');
  }

  const user = await User.findOne({ username });
  if (!user) {
    return res.status(401).send('Invalid credentials');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).send('Invalid credentials');
  }

  const token = jwt.sign({ id: user._id, username: user.username }, 'your_jwt_secret', { expiresIn: '1h' });
  activeSessions[user._id] = { token, username: user.username };
  res.status(200).json({ token });
});

// Middleware para validar el token
const authenticate = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).send('Token is required');

  jwt.verify(token, 'your_jwt_secret', (err, user) => {
    if (err) return res.status(403).send('Invalid token');
    req.user = user;
    next();
  });
};

// Ruta para compartir el diagrama
app.post('/share', authenticate, async (req, res) => {
  const { targetUsernameOrEmail, diagramXml } = req.body;
  if (!targetUsernameOrEmail || !diagramXml) return res.status(400).send('Target username or email and diagram XML are required');

  const targetUser = await User.findOne({ 
    $or: [
      { username: targetUsernameOrEmail }, 
      { email: targetUsernameOrEmail }
    ] 
  });

  if (!targetUser) return res.status(404).send('Target user not found');

  if (!activeSessions[targetUser._id]) {
    return res.status(404).send('Target user is not active');
  }

  // Enviar el diagrama al usuario objetivo
  const targetSocketId = activeSessions[targetUser._id].socketId;
  if (targetSocketId) {
    io.to(targetSocketId).emit('load-diagram', diagramXml);
    res.status(200).send('Diagram shared successfully');
  } else {
    res.status(404).send('Target user is not connected');
  }
});

// Inicializar el estado del diagrama
let currentDiagramXml = "";

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));

  jwt.verify(token, 'your_jwt_secret', (err, user) => {
    if (err) return next(new Error('Authentication error'));
    socket.user = user;
    next();
  });
}).on('connection', (socket) => {
  console.log('New client connected:', socket.user.username);

  // Guardar el socket ID en la sesión activa
  activeSessions[socket.user.id].socketId = socket.id;

  // Enviar el diagrama actual al cliente que se conecta
  if (currentDiagramXml) {
    socket.emit('load-diagram', currentDiagramXml);
  }

  // Manejar la actualización del diagrama
  socket.on('diagram-update', (xml) => {
    console.log('Diagram updated by:', socket.user.username);
    currentDiagramXml = xml;
    socket.broadcast.emit('diagram-update', xml);
  });

  // Manejar la actualización del cursor
  socket.on('cursor-update', ({ id, x, y, username }) => {
    socket.broadcast.emit('cursor-update', { id, x, y, username });
  });

  // Manejar la desconexión del cliente
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.user.username);
    delete activeSessions[socket.user.id].socketId;
  });
});

const PORT = 4000;
server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
