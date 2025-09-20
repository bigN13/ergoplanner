import { apiSlice } from './apiSlice';
import { endpoints } from '@/config';
import type {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  User,
  ApiResponse,
} from '@/types';

// Auth API endpoints using RTK Query
export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Login
    login: builder.mutation<AuthResponse, LoginCredentials>({
      query: (credentials) => ({
        url: endpoints.auth.login,
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),

    // Register
    register: builder.mutation<AuthResponse, RegisterData>({
      query: (userData) => ({
        url: endpoints.auth.register,
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),

    // Refresh token
    refreshToken: builder.mutation<AuthResponse, { refreshToken: string }>({
      query: ({ refreshToken }) => ({
        url: endpoints.auth.refresh,
        method: 'POST',
        body: { refreshToken },
      }),
    }),

    // Logout
    logout: builder.mutation<ApiResponse<void>, void>({
      query: () => ({
        url: endpoints.auth.logout,
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),

    // Get current user profile
    getCurrentUser: builder.query<User, void>({
      query: () => endpoints.auth.profile,
      providesTags: ['User'],
    }),

    // Update profile
    updateProfile: builder.mutation<User, Partial<User>>({
      query: (updates) => ({
        url: endpoints.auth.profile,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: ['User'],
    }),

    // Change password
    changePassword: builder.mutation<
      ApiResponse<void>,
      { currentPassword: string; newPassword: string; confirmPassword: string }
    >({
      query: (passwordData) => ({
        url: endpoints.auth.changePassword,
        method: 'POST',
        body: passwordData,
      }),
    }),

    // Forgot password
    forgotPassword: builder.mutation<ApiResponse<void>, { email: string }>({
      query: ({ email }) => ({
        url: endpoints.auth.forgotPassword,
        method: 'POST',
        body: { email },
      }),
    }),

    // Reset password
    resetPassword: builder.mutation<
      ApiResponse<void>,
      { token: string; password: string; confirmPassword: string }
    >({
      query: (resetData) => ({
        url: endpoints.auth.resetPassword,
        method: 'POST',
        body: resetData,
      }),
    }),

    // Confirm email
    confirmEmail: builder.mutation<ApiResponse<void>, { token: string; email: string }>({
      query: (confirmData) => ({
        url: endpoints.auth.confirmEmail,
        method: 'POST',
        body: confirmData,
      }),
    }),

    // Resend email confirmation
    resendEmailConfirmation: builder.mutation<ApiResponse<void>, { email: string }>({
      query: ({ email }) => ({
        url: `${endpoints.auth.confirmEmail}/resend`,
        method: 'POST',
        body: { email },
      }),
    }),
  }),
});

// Export hooks for use in components
export const {
  useLoginMutation,
  useRegisterMutation,
  useRefreshTokenMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useConfirmEmailMutation,
  useResendEmailConfirmationMutation,
} = authApi;

// Export API slice for debugging
export default authApi;