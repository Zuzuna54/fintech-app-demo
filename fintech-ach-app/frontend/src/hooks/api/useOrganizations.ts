import { createQuery, createMutation } from './';
import type { OrganizationsResponse, OrganizationResponse } from '@/types/api/responses';
import type { CreateOrganizationDto, UpdateOrganizationDto } from '@/types/api/organization';

interface UseOrganizationsParams {
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
}

export function useOrganizations(params?: UseOrganizationsParams) {
    return createQuery<OrganizationsResponse>({
        url: '/management/organizations',
        params: {
            limit: params?.limit,
            offset: params?.offset,
            sort_by: params?.sortBy,
            sort_direction: params?.sortDirection
        },
        config: {
            revalidateOnFocus: false,
            keepPreviousData: true
        }
    });
}

export function useCreateOrganization() {
    const { mutate: refreshOrganizations } = createQuery<OrganizationsResponse>({ url: '/management/organizations' });

    return createMutation<CreateOrganizationDto, OrganizationResponse>({
        url: '/management/organizations',
        method: 'POST',
        onSuccess: () => {
            void refreshOrganizations();
        }
    });
}

export function useUpdateOrganization(organizationId: string) {
    const { mutate: refreshOrganizations } = createQuery<OrganizationsResponse>({ url: '/management/organizations' });

    return createMutation<UpdateOrganizationDto, OrganizationResponse>({
        url: `/management/organizations/${organizationId}`,
        method: 'PUT',
        onSuccess: () => {
            void refreshOrganizations();
        }
    });
}

export function useDeleteOrganization() {
    const { mutate: refreshOrganizations } = createQuery<OrganizationsResponse>({ url: '/management/organizations' });

    return createMutation<{ organizationId: string }, void>({
        url: ({ organizationId }) => `/management/organizations/${organizationId}`,
        method: 'DELETE',
        onSuccess: () => {
            void refreshOrganizations();
        }
    });
} 