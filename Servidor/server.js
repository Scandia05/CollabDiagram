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
  res.status(200).json({ token });
});

// Inicializar el estado del diagrama
let currentDiagramXml = "";

io.on('connection', (socket) => {
  console.log('New client connected');

  // Enviar el diagrama actual al cliente que se conecta
  if (currentDiagramXml) {
    socket.emit('load-diagram', currentDiagramXml);
  }

  // Manejar la actualización del diagrama
  socket.on('diagram-update', (xml) => {
    console.log('Diagram updated');
    currentDiagramXml = xml;
    socket.broadcast.emit('diagram-update', xml);
  });

  // Manejar la actualización del cursor
  socket.on('cursor-update', ({ id, x, y, username }) => {
    socket.broadcast.emit('cursor-update', { id, x, y, username });
  });

  // Manejar la desconexión del cliente
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = 4000;
server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
