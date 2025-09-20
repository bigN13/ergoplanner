import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { Mutex } from 'async-mutex';
import { config } from '@/config';
import { clearAuth, setTokens } from '@/store/slices/authSlice';
import type { RootState } from '@/store';
import type { AuthResponse } from '@/types';

// Mutex to prevent multiple refresh attempts
const mutex = new Mutex();

// Base query with authentication
const baseQuery = fetchBaseQuery({
  baseUrl: config.api.baseUrl,
  timeout: config.api.timeout,
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const token = state.auth.token;

    // Add auth token if available
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }

    // Add common headers
    headers.set('content-type', 'application/json');
    headers.set('accept', 'application/json');
    headers.set('x-requested-with', 'XMLHttpRequest');

    return headers;
  },
});

// Base query with re-authentication
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // Wait for any ongoing refresh attempts
  await mutex.waitForUnlock();

  let result = await baseQuery(args, api, extraOptions);

  // If we got a 401 and have a refresh token, try to refresh
  if (result.error && result.error.status === 401) {
    const state = api.getState() as RootState;
    const refreshToken = state.auth.refreshToken;

    if (refreshToken && !mutex.isLocked()) {
      const release = await mutex.acquire();

      try {
        // Try to refresh the token
        const refreshResult = await baseQuery(
          {
            url: '/api/auth/refresh',
            method: 'POST',
            body: { refreshToken },
          },
          api,
          extraOptions
        );

        if (refreshResult.data) {
          const authData = refreshResult.data as AuthResponse;

          // Store the new tokens
          api.dispatch(
            setTokens({
              token: authData.token,
              refreshToken: authData.refreshToken,
            })
          );

          // Retry the original query with new token
          result = await baseQuery(args, api, extraOptions);
        } else {
          // Refresh failed, clear auth state
          api.dispatch(clearAuth());
        }
      } finally {
        release();
      }
    } else {
      // No refresh token or refresh in progress, clear auth
      api.dispatch(clearAuth());
    }
  }

  return result;
};

// RTK Query API slice
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'User',
    'Organization',
    'Project',
    'Drawing',
    'Component',
    'Symbol',
    'BoQItem',
    'Workflow',
    'WorkflowComment',
  ],
  endpoints: () => ({}),
});

// Export types
export type ApiSlice = typeof apiSlice;