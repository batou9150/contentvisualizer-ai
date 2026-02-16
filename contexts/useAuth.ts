import { createContext, useContext } from 'react';

export interface User {
    id: string;
    name: string;
    email: string;
    picture: string;
}

export interface AuthContextType {
    user: User | null;
    token: any | null;
    login: (response: any) => void;
    logout: () => void;
    refreshToken: () => Promise<string | null>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
