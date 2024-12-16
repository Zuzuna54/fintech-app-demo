'use client';

import useSWR from 'swr';
import { Organization } from '@/types/api';
import { api } from '@/lib/api';

interface OrganizationsResponse {
    organizations: Organization[];
    total: number;
}

export function useOrganizations() {
    return useSWR<OrganizationsResponse>('/management/organizations', async (url) => {
        const response = await api.get(url);
        return response.data;
    }, {
        revalidateOnFocus: false,
        shouldRetryOnError: false
    });
} 