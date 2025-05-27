import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    // Add user state if you want to store user details from backend upon login
    // const [user, setUser] = useState(JSON.parse(localStorage.getItem('user'))); 

    useEffect(() => {
        if (token) {
            localStorage.setItem('token', token);
            // Add user to localStorage if you implement user state
            // localStorage.setItem('user', JSON.stringify(user));
        } else {
            localStorage.removeItem('token');
            // localStorage.removeItem('user');
        }
    }, [token]); // Removed 'user' from dependencies for now

    const login = async (email, password) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/auth/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    username: email,
                    password: password,
                }),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Login failed' }));
                throw new Error(errorData.detail || 'Failed to login');
            }
            const data = await response.json();
            setToken(data.access_token);
            // Optionally, fetch user details here and setUser(userDetails)
            return true;
        } catch (error) {
            console.error("Login error:", error);
            // Consider setting an error message in state to display to the user
            throw error; // Re-throw to be caught by the calling component
        }
    };

    const register = async (email, password) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Registration failed' }));
                throw new Error(errorData.detail || 'Failed to register');
            }
            // Optionally, log the user in directly after registration or prompt them to log in
            // const data = await response.json(); 
            return true; 
        } catch (error) {
            console.error("Registration error:", error);
            throw error;
        }
    };

    const logout = () => {
        setToken(null);
        // setUser(null);
    };

    const authFetch = async (url, options = {}) => {
        const currentToken = localStorage.getItem('token'); // Get fresh token
        const headers = {
            ...options.headers,
        };

        if (currentToken) {
            headers['Authorization'] = `Bearer ${currentToken}`;
        }

        const fullUrl = url.startsWith('http') ? url : `${process.env.REACT_APP_API_URL}${url}`;
        const response = await fetch(fullUrl, { ...options, headers });

        if (response.status === 401) {
            logout(); // Clear token and user state
            // Optionally, redirect to login page here or throw a specific error
            // window.location.href = '/login'; 
            throw new Error('Unauthorized - logging out');
        }
        return response;
    };


    return (
        <AuthContext.Provider value={{ token, login, logout, register, authFetch /*, user */ }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 