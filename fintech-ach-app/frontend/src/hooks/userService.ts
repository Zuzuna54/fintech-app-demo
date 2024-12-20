import { api } from '@/lib/api';
import { User, isUser, UserRole, normalizeRole } from '@/types/auth';

export async function fetchUserData(): Promise<User> {
    const userResponse = await api.get<User>('/auth/me');
    const userData = userResponse.data;

    if (!isUser(userData)) {
        console.error('Invalid user data:', userData);
        console.error('Validation details:', {
            hasId: typeof (userData as User)?.id === 'string',
            hasEmail: typeof (userData as User)?.email === 'string',
            hasRole: typeof (userData as User)?.role === 'string',
            hasValidRole: (userData as User)?.role ? Object.values(UserRole).includes(normalizeRole((userData as User).role)) : false,
            hasRequiredFields: Boolean((userData as User)?.id && (userData as User)?.email && (userData as User)?.role)
        });
        throw new Error('Invalid user data received');
    }

    return {
        ...userData,
        role: normalizeRole(userData.role)
    };
}

export async function updateUserData(userData: Partial<User>): Promise<User> {
    const response = await api.patch<{ user: User }>('/auth/me', userData);
    if (!isUser(response.data)) {
        throw new Error('Invalid user data received');
    }
    return response.data;
}

export async function logoutUser(): Promise<void> {
    await api.post('/auth/logout');
} 