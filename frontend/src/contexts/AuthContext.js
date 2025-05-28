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
            // For login, we generally expect REACT_APP_API_URL to be correctly configured for the environment.
            // If it needs to be HTTP for local, it should be set as such.
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
            // Similar to login, registration URL depends on REACT_APP_API_URL configuration.
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
        const currentToken = localStorage.getItem('token');
        const headers = {
            ...options.headers,
        };
    
        if (currentToken) {
            headers['Authorization'] = `Bearer ${currentToken}`;
        }
    
        let fullUrl;
        const appApiUrl = process.env.REACT_APP_API_URL || '';

        // Check if the appApiUrl itself is for localhost or 127.0.0.1
        const isApiUrlLocal = appApiUrl.startsWith('http://localhost') || appApiUrl.startsWith('http://127.0.0.1');

        if (url.startsWith('http')) {
            // If a full URL is provided
            if (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) {
                fullUrl = url; // Keep HTTP for localhost
            } else {
                fullUrl = url.replace(/^http:/, 'https:'); // Force HTTPS for other external URLs
            }
        } else {
            // If a relative URL is provided
            if (isApiUrlLocal) {
                fullUrl = `${appApiUrl}${url}`; // Use base URL as is (likely HTTP for local)
            } else {
                // For non-local base URL, ensure it's HTTPS
                const baseUrl = appApiUrl.replace(/^http:/, 'https:');
                fullUrl = `${baseUrl}${url}`;
            }
        }
    
        console.log('Making authenticated request to:', fullUrl);
    
        const response = await fetch(fullUrl, { 
            ...options, 
            headers 
        });
    
        if (response.status === 401) {
            logout();
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