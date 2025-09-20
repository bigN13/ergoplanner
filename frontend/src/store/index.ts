import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { createLogger } from 'redux-logger';

// API Services
import { apiSlice } from '@/api/apiSlice';

// Feature Slices
import authSlice from './slices/authSlice';
import uiSlice from './slices/uiSlice';
import drawingSlice from './slices/drawingSlice';
import notificationSlice from './slices/notificationSlice';

// Middleware configuration
const getMiddleware = (getDefaultMiddleware: any) => {
  const middleware = getDefaultMiddleware({
    serializableCheck: {
      ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      ignoredPaths: ['api.queries', 'api.mutations'],
    },
  }).concat(apiSlice.middleware);

  // Add logger in development
  if (process.env.NODE_ENV === 'development') {
    const logger = createLogger({
      collapsed: true,
      duration: true,
      timestamp: true,
      logErrors: true,
      diff: true,
    });
    middleware.push(logger);
  }

  return middleware;
};

// Store configuration
export const store = configureStore({
  reducer: {
    // API slice
    [apiSlice.reducerPath]: apiSlice.reducer,

    // Feature slices
    auth: authSlice,
    ui: uiSlice,
    drawing: drawingSlice,
    notifications: notificationSlice,
  },
  middleware: getMiddleware,
  devTools: process.env.NODE_ENV === 'development' && {
    name: 'Ergoplanner AI Suite',
    trace: true,
    traceLimit: 25,
    maxAge: 50,
  },
});

// Setup listeners for refetchOnFocus/refetchOnReconnect behaviors
setupListeners(store.dispatch);

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export { useAppDispatch, useAppSelector } from './hooks';