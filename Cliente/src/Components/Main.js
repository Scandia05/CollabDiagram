import React from 'react';
import { useNavigate } from 'react-router-dom';

const Main = () => {
    const navigate = useNavigate();

    const handleCreateNew = () => {
        navigate('/create');
    };

    const handleModify = () => {
        navigate('/modify');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <button onClick={handleCreateNew} style={{ fontSize: '20px', padding: '10px', margin: '20px', width: '200px' }}>Crear un nuevo diagrama</button>
            <button onClick={handleModify} style={{ fontSize: '20px', padding: '10px', margin: '20px', width: '200px' }}>Modificar diagrama</button>
        </div>
    );
};

export default Main;
