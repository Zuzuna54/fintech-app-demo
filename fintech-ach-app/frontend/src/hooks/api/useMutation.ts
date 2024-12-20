import { useState } from 'react';
import { api } from '@/lib/api';
import { AxiosError } from 'axios';

export interface MutationOptions<T, R> {
    url: string | ((data: T) => string);
    method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    onSuccess?: (data: R) => void;
    onError?: (error: Error) => void;
    transform?: (data: any) => R;
}

export interface MutationResult<T, R> {
    mutate: (data: T) => Promise<R | null>;
    isLoading: boolean;
    error: Error | null;
    reset: () => void;
}

export function createMutation<T, R>({
    url,
    method,
    onSuccess,
    onError,
    transform
}: MutationOptions<T, R>): MutationResult<T, R> {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const reset = () => {
        setError(null);
        setIsLoading(false);
    };

    const mutate = async (data: T): Promise<R | null> => {
        setIsLoading(true);
        setError(null);
        try {
            const finalUrl = typeof url === 'function' ? url(data) : url;
            const response = await (api as any)[method.toLowerCase()](finalUrl, method === 'DELETE' ? undefined : data);
            const result = transform ? transform(response.data) : response.data;
            onSuccess?.(result);
            return result;
        } catch (err) {
            let errorMessage = 'An unknown error occurred';

            if (err instanceof AxiosError) {
                errorMessage = err.response?.data?.message || err.message;
            } else if (err instanceof Error) {
                errorMessage = err.message;
            }

            const error = new Error(errorMessage);
            setError(error);
            onError?.(error);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    return { mutate, isLoading, error, reset };
} 