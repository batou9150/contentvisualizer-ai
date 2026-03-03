import { createContext, useContext } from 'react';

export interface User {
    id: string;
    name: string;
    email: string;
    picture: string;
}

export interface AuthTokens {
    access_token: string;
    refresh_token?: string;
    id_token?: string;
    expiry_date?: number;
    token_type?: string;
    scope?: string;
}

/** Token is either an OAuth2 tokens object, a legacy JWT string, or null. */
export type TokenState = AuthTokens | string | null;

export interface LoginCodeResponse {
    code: string;
}

export interface LoginCredentialResponse {
    credential: string;
}

export type LoginResponse = LoginCodeResponse | LoginCredentialResponse;

export interface AuthContextType {
    user: User | null;
    token: TokenState;
    login: (response: LoginResponse) => void;
    logout: () => void;
    refreshToken: () => Promise<string | null>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
