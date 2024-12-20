import useSWR from 'swr';
import { api } from '@/lib/api';

export interface QueryOptions<T> {
    url: string;
    params?: Record<string, any>;
    config?: {
        revalidateOnFocus?: boolean;
        revalidateOnReconnect?: boolean;
        refreshInterval?: number;
        shouldRetryOnError?: boolean;
        keepPreviousData?: boolean;
    };
    transform?: (data: any) => T;
}

export function createQuery<T>({
    url,
    params,
    config,
    transform
}: QueryOptions<T>) {
    const queryParams = new URLSearchParams();

    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                    value.forEach(v => queryParams.append(key, String(v)));
                } else {
                    queryParams.append(key, String(value));
                }
            }
        });
    }

    const fullUrl = `${url}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    return useSWR<T>(
        fullUrl,
        async () => {
            const response = await api.get(fullUrl);
            return transform ? transform(response.data) : response.data;
        },
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: true,
            shouldRetryOnError: false,
            keepPreviousData: true,
            ...config
        }
    );
} 