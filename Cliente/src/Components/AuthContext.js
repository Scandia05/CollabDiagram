import React, { createContext, useState } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [username, setUsername] = useState(localStorage.getItem('username'));

    const saveAuthData = (userToken, userName) => {
        localStorage.setItem('token', userToken);
        localStorage.setItem('username', userName);
        setToken(userToken);
        setUsername(userName);
    };

    const removeAuthData = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        setToken(null);
        setUsername(null);
    };

    return (
        <AuthContext.Provider value={{ token, username, saveAuthData, removeAuthData }}>
            {children}
        </AuthContext.Provider>
    );
};
