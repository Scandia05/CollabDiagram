import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainMenu from './Components/Main';
import DiagramEditor from './Components/DiagramEditor';
import DiagramModifier from './Components/DiagramModifier';
import socket from './Components/socket'; // Importa el socket

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/create" element={<DiagramEditor socket={socket} />} /> {}
        <Route path="/modify" element={<DiagramModifier socket={socket} />} /> {}
      </Routes>
    </Router>
  );
}

export default App;


