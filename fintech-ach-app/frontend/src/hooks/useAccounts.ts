import useSWR, { SWRResponse } from 'swr';
import { api } from '@/lib/api';
import type { AccountsResponse } from '@/types';

interface UseAccountsParams {
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
    organizationId?: string;
}

export function useAccounts(params?: UseAccountsParams): SWRResponse<AccountsResponse, Error> {
    const queryParams = new URLSearchParams();

    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.sortBy) queryParams.append('sort_by', params.sortBy);
    if (params?.sortDirection) queryParams.append('sort_direction', params.sortDirection);
    if (params?.organizationId) queryParams.append('organization_id', params.organizationId);

    const queryString = queryParams.toString();
    const url = `/accounts${queryString ? `?${queryString}` : ''}`;

    return useSWR<AccountsResponse, Error>(url, async () => {
        const response = await api.get<AccountsResponse>(url);
        return response.data;
    }, {
        revalidateOnFocus: false,
        keepPreviousData: true
    });
} 