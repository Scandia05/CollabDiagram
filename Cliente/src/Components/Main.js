import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';

const Main = () => {
    const navigate = useNavigate();
    const { removeAuthData } = useContext(AuthContext);

    const handleCreateNew = () => {
        navigate('/create');
    };

    const handleModify = () => {
        navigate('/modify');
    };

    const handleLogout = () => {
        removeAuthData();
        navigate('/login');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <button onClick={handleCreateNew} style={{ fontSize: '20px', padding: '10px', margin: '20px', width: '200px' }}>Crear un nuevo diagrama</button>
            <button onClick={handleModify} style={{ fontSize: '20px', padding: '10px', margin: '20px', width: '200px' }}>Modificar diagrama</button>
            <button onClick={handleLogout} style={{ fontSize: '20px', padding: '10px', margin: '20px', width: '200px' }}>Cerrar sesión</button>
        </div>
    );
};

export default Main;

