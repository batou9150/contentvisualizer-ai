import React, { useState, useEffect, ReactNode } from 'react';
import { GoogleCredentialResponse, googleLogout } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { AuthContext, User } from './useAuth';

const STORAGE_KEY = 'contentvisualiserai_user';
const TOKEN_KEY = 'contentvisualiserai_token';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<any | null>(null);

    useEffect(() => {
        console.log('Auth Token Updated:', token);
        if (typeof token === 'string') {
            console.warn('Auth Token is a string (legacy/credential flow). Access to Google Drive API may be limited.');
        } else if (token && !token.access_token) {
            console.warn('Auth Token object is missing access_token.');
        }
    }, [token]);

    // Initialize user from localStorage on mount
    useEffect(() => {
        try {
            const storedUser = localStorage.getItem(STORAGE_KEY);
            const storedToken = localStorage.getItem(TOKEN_KEY);
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
            if (storedToken) {
                // Try to parse as JSON first (new format), fallback to string (old format)
                try {
                    setToken(JSON.parse(storedToken));
                } catch {
                    setToken(storedToken);
                }
            }
        } catch (error) {
            console.error('Failed to restore user from localStorage:', error);
            // Clear corrupted data
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(TOKEN_KEY);
        }
    }, []);

    const login = async (response: any) => {
        if (response.code) {
            console.log('Received auth code, exchanging for tokens...');
            try {
                const res = await fetch('/auth/google', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ code: response.code }),
                });

                if (!res.ok) {
                    throw new Error('Failed to exchange code');
                }

                const data = await res.json();
                const { user: userData, tokens } = data;

                setUser(userData);
                setToken(tokens);

                // Persist
                localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
                localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));

                console.log('Login successful:', userData);

            } catch (error) {
                console.error('Login failed during code exchange:', error);
                // Optionally show user feedback here
            }
        } else if (response.credential) {
            // Fallback for legacy/implicit flow if needed
            const decoded: any = jwtDecode(response.credential);
            const userData: User = {
                id: decoded.sub,
                name: decoded.name,
                email: decoded.email,
                picture: decoded.picture,
            };
            setUser(userData);
            setToken(response.credential);

            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
                localStorage.setItem(TOKEN_KEY, response.credential); // Store as string for legacy
            } catch (error) {
                console.error('Failed to save user to localStorage:', error);
            }
        }
    };

    const logout = () => {
        googleLogout();
        setUser(null);
        setToken(null);

        // Clear from localStorage
        try {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(TOKEN_KEY);
        } catch (error) {
            console.error('Failed to remove user from localStorage:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
