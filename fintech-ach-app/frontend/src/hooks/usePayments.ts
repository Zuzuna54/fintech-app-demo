import useSWR, { SWRResponse } from 'swr';
import { api } from '@/lib/api';
import type { PaymentsResponse } from '@/types';

interface UsePaymentsParams {
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
    status?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
}

export function usePayments(params?: UsePaymentsParams): SWRResponse<PaymentsResponse, Error> {
    const queryParams = new URLSearchParams();

    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.sortBy) queryParams.append('sort_by', params.sortBy);
    if (params?.sortDirection) queryParams.append('sort_direction', params.sortDirection);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.minAmount) queryParams.append('minAmount', params.minAmount.toString());
    if (params?.maxAmount) queryParams.append('maxAmount', params.maxAmount.toString());

    const queryString = queryParams.toString();
    const url = `/payments${queryString ? `?${queryString}` : ''}`;

    return useSWR<PaymentsResponse, Error>(url, async () => {
        const response = await api.get<PaymentsResponse>(url);
        return response.data;
    }, {
        revalidateOnFocus: false,
        keepPreviousData: true
    });
} 