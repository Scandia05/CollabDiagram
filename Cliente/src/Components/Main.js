import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';

const Main = () => {
    const navigate = useNavigate();
    const { token } = useContext(AuthContext);

    const handleCreateNew = () => {
        if (token) {
            navigate('/create');
        } else {
            navigate('/login');
        }
    };

    const handleModify = () => {
        if (token) {
            navigate('/modify');
        } else {
            navigate('/login');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <button onClick={handleCreateNew} style={{ fontSize: '20px', padding: '10px', margin: '20px', width: '200px' }}>Crear un nuevo diagrama</button>
            <button onClick={handleModify} style={{ fontSize: '20px', padding: '10px', margin: '20px', width: '200px' }}>Modificar diagrama</button>
        </div>
    );
};

export default Main;

