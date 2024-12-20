import { createQuery, createMutation } from './';
import type { UsersResponse, UserResponse } from '@/types/api/responses';
import type { SortConfig } from '@/types/table';

interface UseUsersParams {
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
    organizationId?: string;
}

export function useUsers(params?: UseUsersParams) {
    return createQuery<UsersResponse>({
        url: '/management/users',
        params: {
            limit: params?.limit,
            offset: params?.offset,
            sort_by: params?.sortBy,
            sort_direction: params?.sortDirection,
            organization_id: params?.organizationId
        },
        config: {
            revalidateOnFocus: false,
            keepPreviousData: true
        }
    });
}

interface CreateUserData {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    role: string;
    organization_id?: string;
}

export function useCreateUser() {
    const { mutate: refreshUsers } = createQuery<UsersResponse>({ url: '/management/users' });

    return createMutation<CreateUserData, UserResponse>({
        url: '/management/users',
        method: 'POST',
        onSuccess: () => {
            void refreshUsers();
        }
    });
}

interface UpdateUserData {
    first_name?: string;
    last_name?: string;
    email?: string;
    role?: string;
    organization_id?: string;
}

export function useUpdateUser(userId: string) {
    const { mutate: refreshUsers } = createQuery<UsersResponse>({ url: '/management/users' });

    return createMutation<UpdateUserData, UserResponse>({
        url: `/management/users/${userId}`,
        method: 'PUT',
        onSuccess: () => {
            void refreshUsers();
        }
    });
}

export function useDeleteUser() {
    const { mutate: refreshUsers } = createQuery<UsersResponse>({ url: '/management/users' });

    return createMutation<{ userId: string }, void>({
        url: ({ userId }) => `/management/users/${userId}`,
        method: 'DELETE',
        onSuccess: () => {
            void refreshUsers();
        }
    });
} 