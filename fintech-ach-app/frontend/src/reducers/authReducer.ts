import { AuthState, User } from '@/types/auth';
import { getToken } from '../lib/authUtils';

// Initial state
export const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    lastLogin: undefined,
    token: null
};

// Action types
export type AuthAction =
    | { type: 'AUTH_START' }
    | { type: 'AUTH_SUCCESS'; payload: { user: User; lastLogin?: string } }
    | { type: 'AUTH_FAILURE'; payload: string }
    | { type: 'AUTH_LOGOUT' }
    | { type: 'AUTH_UPDATE_USER'; payload: User }
    | { type: 'CLEAR_ERROR' };

// Reducer
export function authReducer(state: AuthState, action: AuthAction): AuthState {
    switch (action.type) {
        case 'AUTH_START':
            return {
                ...state,
                isLoading: true,
                error: null
            };
        case 'AUTH_SUCCESS':
            return {
                ...state,
                isAuthenticated: Boolean(action.payload.user),
                user: action.payload.user,
                lastLogin: action.payload.lastLogin ?? state.lastLogin,
                isLoading: false,
                error: null,
                token: getToken()
            };
        case 'AUTH_FAILURE':
            return {
                ...state,
                isAuthenticated: false,
                user: null,
                isLoading: false,
                error: action.payload,
                token: null
            };
        case 'AUTH_LOGOUT':
            return {
                ...state,
                isAuthenticated: false,
                user: null,
                isLoading: false,
                error: null,
                lastLogin: undefined,
                token: null
            };
        case 'AUTH_UPDATE_USER':
            return {
                ...state,
                user: action.payload,
                isAuthenticated: Boolean(action.payload)
            };
        case 'CLEAR_ERROR':
            return {
                ...state,
                error: null
            };
        default:
            return state;
    }
} 