'use client';

import useSWR from 'swr';
import { Organization } from '@/types/api';
import { api } from '@/lib/api';

export interface OrganizationsResponse {
    organizations: Organization[];
    total: number;
}

export function useOrganizations(): ReturnType<typeof useSWR<OrganizationsResponse>> {
    return useSWR<OrganizationsResponse>('/management/organizations', async (url: string) => {
        const response = await api.get(url);
        return response.data as OrganizationsResponse;
    }, {
        revalidateOnFocus: false,
        shouldRetryOnError: false
    });
} 