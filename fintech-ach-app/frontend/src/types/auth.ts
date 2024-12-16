export interface User {
    id: string;
    email: string;
    role: UserRole;
    organization_id: string | null;
    first_name?: string;
    last_name?: string;
    created_at?: string;
    updated_at?: string;
}


export interface ExtendedUser extends User {
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
 * Type guard to check if a value is a valid User object
 */
export function isUser(data: any): data is User {
    if (!data || typeof data !== 'object') return false;

    try {
        return (
            typeof data.id === 'string' &&
            typeof data.email === 'string' &&
            typeof data.role === 'string' &&
            (data.organization_id === null || typeof data.organization_id === 'string') &&
            !('user' in data) // Ensure we're not dealing with a wrapped object
        );
    } catch (error) {
        console.error('User validation failed:', error);
        return false;
    }
}

/**
 * Type guard to check if a value is a valid AuthResponse object
 */
export function isAuthResponse(data: any): data is AuthResponse {
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


