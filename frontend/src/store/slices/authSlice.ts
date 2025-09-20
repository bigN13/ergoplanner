import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';
import { config } from '@/config';
import type { AuthState, User, AuthResponse } from '@/types';

// Token utilities
const getTokenFromStorage = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(config.auth.tokenKey) || Cookies.get(config.auth.tokenKey) || null;
};

const getRefreshTokenFromStorage = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(config.auth.refreshTokenKey) || Cookies.get(config.auth.refreshTokenKey) || null;
};

const getUserFromStorage = (): User | null => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem(config.auth.userKey) || Cookies.get(config.auth.userKey);
  return userStr ? JSON.parse(userStr) : null;
};

const isTokenValid = (token: string): boolean => {
  try {
    const decoded: any = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime + (config.auth.tokenExpiryBuffer / 1000);
  } catch {
    return false;
  }
};

// Initial state
const token = getTokenFromStorage();
const refreshToken = getRefreshTokenFromStorage();
const user = getUserFromStorage();

const initialState: AuthState = {
  user: user && token && isTokenValid(token) ? user : null,
  token: token && isTokenValid(token) ? token : null,
  refreshToken: token && isTokenValid(token) ? refreshToken : null,
  isAuthenticated: !!(user && token && isTokenValid(token)),
  isLoading: false,
  error: null,
};

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },

    // Set error
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },

    // Set authentication data
    setAuth: (state, action: PayloadAction<AuthResponse>) => {
      const { token, refreshToken, user } = action.payload;

      state.token = token;
      state.refreshToken = refreshToken;
      state.user = user;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;

      // Persist to storage
      if (typeof window !== 'undefined') {
        localStorage.setItem(config.auth.tokenKey, token);
        localStorage.setItem(config.auth.refreshTokenKey, refreshToken);
        localStorage.setItem(config.auth.userKey, JSON.stringify(user));

        // Also set as cookies for SSR
        Cookies.set(config.auth.tokenKey, token, {
          expires: 7,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
        Cookies.set(config.auth.refreshTokenKey, refreshToken, {
          expires: 30,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
        Cookies.set(config.auth.userKey, JSON.stringify(user), {
          expires: 7,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
      }
    },

    // Set tokens only (for refresh)
    setTokens: (state, action: PayloadAction<{ token: string; refreshToken: string }>) => {
      const { token, refreshToken } = action.payload;

      state.token = token;
      state.refreshToken = refreshToken;

      // Update storage
      if (typeof window !== 'undefined') {
        localStorage.setItem(config.auth.tokenKey, token);
        localStorage.setItem(config.auth.refreshTokenKey, refreshToken);

        Cookies.set(config.auth.tokenKey, token, {
          expires: 7,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
        Cookies.set(config.auth.refreshTokenKey, refreshToken, {
          expires: 30,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
      }
    },

    // Update user profile
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };

        // Update storage
        if (typeof window !== 'undefined') {
          localStorage.setItem(config.auth.userKey, JSON.stringify(state.user));
          Cookies.set(config.auth.userKey, JSON.stringify(state.user), {
            expires: 7,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
          });
        }
      }
    },

    // Clear authentication
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;

      // Clear storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem(config.auth.tokenKey);
        localStorage.removeItem(config.auth.refreshTokenKey);
        localStorage.removeItem(config.auth.userKey);

        Cookies.remove(config.auth.tokenKey);
        Cookies.remove(config.auth.refreshTokenKey);
        Cookies.remove(config.auth.userKey);
      }
    },

    // Reset error
    resetError: (state) => {
      state.error = null;
    },
  },
});

// Export actions
export const {
  setLoading,
  setError,
  setAuth,
  setTokens,
  updateUser,
  clearAuth,
  resetError,
} = authSlice.actions;

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectAuthToken = (state: { auth: AuthState }) => state.auth.token;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;

// Export reducer
export default authSlice.reducer;