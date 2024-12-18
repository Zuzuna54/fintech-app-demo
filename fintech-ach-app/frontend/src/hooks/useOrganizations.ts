'use client';

import useSWR, { SWRResponse } from 'swr';
import { Organization } from '@/types/api';
import { api } from '@/lib/api';

interface OrganizationsResponse {
    organizations: Organization[];
    total: number;
}

export function useOrganizations(): SWRResponse<OrganizationsResponse, Error> {
    return useSWR<OrganizationsResponse, Error>('/management/organizations', async () => {
        const response = await api.get<OrganizationsResponse>('/management/organizations');
        return response.data;
    });
} 