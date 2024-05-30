import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import './Auth.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const { saveToken } = useContext(AuthContext);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://200.13.4.230:4000/login', { username, password });
            saveToken(response.data.token);
            navigate('/menu'); // Redirigir a la página del menú
        } catch (error) {
            setMessage('Invalid credentials');
        }
    };

    const goToRegister = () => {
        navigate('/register');
    };

    return (
        <div className="auth-container">
            <form className="auth-form" onSubmit={handleLogin}>
                <h2>Login</h2>
                <div>
                    <label>Username:</label>
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your username" />
                </div>
                <div>
                    <label>Password:</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" />
                </div>
                <button type="submit">Login</button>
                {message && <p className="message">{message}</p>}
                <button type="button" className="switch-button" onClick={goToRegister}>¿Quiere registrarse?</button>
            </form>
        </div>
    );
};

export default Login;
