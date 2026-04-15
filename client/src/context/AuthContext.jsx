import { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    });
    const [socket, setSocket] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Verify token is still valid
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }
        api.get('/auth/me')
            .then(res => {
                setUser(res.data);
                localStorage.setItem('user', JSON.stringify(res.data));
            })
            .catch(() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setUser(null);
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (user) {
            const s = io('http://localhost:5000', { auth: { token: localStorage.getItem('token') } });
            s.emit('join', user._id);
            setSocket(s);
            return () => s.disconnect();
        }
    }, [user?._id]);

    const login = (token, userData) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        if (socket) socket.disconnect();
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, socket, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
