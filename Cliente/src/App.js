import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Register from './Components/Register';
import Login from './Components/Login';
import DiagramEditor from './Components/DiagramEditor';
import DiagramModifier from './Components/DiagramModifier';
import Main from './Components/Main';
import { AuthProvider } from './Components/AuthContext';
import socket from './Components/socket';

const App = () => {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/menu" element={<Main />} /> {/* Nueva ruta para el menú */}
                    <Route path="/create" element={<DiagramEditor socket={socket} />} /> {}
                    <Route path="/modify" element={<DiagramModifier socket={socket} />} /> {}
                </Routes>
            </Router>
        </AuthProvider>
    );
};

export default App;
