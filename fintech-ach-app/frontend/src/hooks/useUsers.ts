import useSWR from 'swr';
import { User } from '@/types';
import { api } from '@/lib/api';

interface UsersResponse {
    data: User[];
    total: number;
    limit: number;
    offset: number;
}

interface UseUsersParams {
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
    organizationId?: string;
}

export function useUsers(params?: UseUsersParams) {
    const queryParams = new URLSearchParams();

    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.sortBy) queryParams.append('sort_by', params.sortBy);
    if (params?.sortDirection) queryParams.append('sort_direction', params.sortDirection);
    if (params?.organizationId) queryParams.append('organization_id', params.organizationId);

    const queryString = queryParams.toString();
    const url = `/management/users${queryString ? `?${queryString}` : ''}`;

    return useSWR<UsersResponse>(url, async () => {
        const response = await api.get(url);
        return response.data;
    }, {
        revalidateOnFocus: false,
        shouldRetryOnError: false
    });
} 