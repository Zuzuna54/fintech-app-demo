import { Organization } from "./api";


export interface User {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    role: UserRole;
    organization_id?: string;
    organization?: Organization | null;
    created_at?: string;
    updated_at?: string | null;
}

/**
 * Type guard to check if a value is a valid User object
 * @param value The value to check
 * @returns True if the value is a valid User object
 */
export function isUser(value: unknown): value is User {
    if (!value || typeof value !== 'object') return false;

    try {
        const user = value as User;

        // Basic property checks
        const hasRequiredFields = (
            typeof user.id === 'string' &&
            typeof user.email === 'string' &&
            typeof user.role === 'string' &&
            'id' in user &&
            'email' in user &&
            'role' in user &&
            (user.organization_id === undefined || user.organization_id === null || typeof user.organization_id === 'string') &&
            !('user' in user) // Ensure we're not dealing with a wrapped object
        );

        if (!hasRequiredFields) {
            console.error('[isUser] Missing required fields:', {
                hasId: typeof user.id === 'string',
                hasEmail: typeof user.email === 'string',
                hasRole: typeof user.role === 'string',
                hasValidRole: false,
                hasRequiredFields: false
            });
            return false;
        }

        // Normalize and validate role
        const normalizedRole = user.role.toUpperCase();
        const isValidRole = Object.values(UserRole).includes(normalizedRole as UserRole);

        if (!isValidRole) {
            console.error('[isUser] Invalid role:', {
                providedRole: user.role,
                normalizedRole,
                validRoles: Object.values(UserRole)
            });
            return false;
        }

        // If we get here, update the role to the normalized version
        user.role = normalizedRole as UserRole;

        return true;
    } catch (error) {
        console.error('[isUser] Validation error:', error);
        return false;
    }
}

export interface ExtendedUser extends Omit<User, 'organization'> {
    uuid: string;
    name: string;
    organization?: {
        uuid: string;
    };
}

export enum UserRole {
    SUPERUSER = 'SUPERUSER',
    ORGANIZATION_ADMIN = 'ORGANIZATION_ADMIN'
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    lastLogin?: string;
    token: string | null;
}

// Action types
export type AuthAction =
    | { type: 'AUTH_START' }
    | { type: 'AUTH_SUCCESS'; payload: { user: User; lastLogin?: string } }
    | { type: 'AUTH_FAILURE'; payload: string }
    | { type: 'AUTH_LOGOUT' }
    | { type: 'AUTH_UPDATE_USER'; payload: User }
    | { type: 'CLEAR_ERROR' };

export interface AuthContextType extends AuthState {
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<void>;
    updateUser: (userData: Partial<User>) => Promise<void>;
    clearError: () => void;
    checkRole: (allowedRoles: UserRole[]) => boolean;
    hasRequiredRole: (user: User | null, allowedRoles: UserRole[]) => boolean;
}

export interface AuthResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    user: User;
}

export interface TokenPayload {
    exp: number;
    iat: number;
    sub: string;
    role: UserRole;
}

/**
 * Normalizes a role string to a UserRole enum value
 * @param role The role string to normalize
 * @returns The normalized UserRole enum value
 * @throws Error if the role is invalid
 */
export function normalizeRole(role: string): UserRole {
    if (!role) throw new Error('Role is required');

    const upperRole = role.toUpperCase();
    const validRoles = Object.values(UserRole);

    if (validRoles.includes(upperRole as UserRole)) {
        return upperRole as UserRole;
    }

    // Handle legacy role formats
    switch (upperRole) {
        case 'SUPER_USER':
        case 'SUPERUSER':
            return UserRole.SUPERUSER;
        case 'ORG_ADMIN':
        case 'ORGANIZATION_ADMIN':
            return UserRole.ORGANIZATION_ADMIN;
        default:
            throw new Error(`Invalid role: ${role}`);
    }
}

/**
 * Type guard to check if a value is a valid AuthResponse object
 */
export function isAuthResponse(data: AuthResponse): data is AuthResponse {
    return (
        data &&
        typeof data.access_token === 'string' &&
        typeof data.refresh_token === 'string' &&
        typeof data.token_type === 'string' &&
        isUser(data.user)
    );
}

/**
 * Checks if a role string is valid
 */
export function isValidRole(role: string): boolean {
    try {
        normalizeRole(role);
        return true;
    } catch {
        return false;
    }
}

export interface WithAuthOptions {
    allowedRoles?: UserRole[];
    redirectTo?: string;
    requireAuth?: boolean;
}


