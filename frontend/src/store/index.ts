import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { createLogger } from 'redux-logger';

// API Services
import { apiSlice } from '@/api/apiSlice';

// Feature Slices
import authSlice from './slices/authSlice';
import uiSlice from './slices/uiSlice';
import drawingSlice from './slices/drawingSlice';
import enhancedDrawingSlice from './slices/enhancedDrawingSlice';
import notificationSlice from './slices/notificationSlice';
import toolPaletteSlice from './slices/toolPaletteSlice';

// Middleware
import statePersistenceMiddleware from './middleware/statePersistence';
import collaborationMiddleware from './middleware/collaborationMiddleware';

// Middleware configuration
const getMiddleware = (getDefaultMiddleware: any) => {
  const middleware = getDefaultMiddleware({
    serializableCheck: {
      ignoredActions: [
        'persist/PERSIST',
        'persist/REHYDRATE',
        // Enhanced drawing actions that may contain non-serializable data
        'enhancedDrawing/addOptimisticUpdate',
        'enhancedDrawing/updateCollaboratorCursor',
        'enhancedDrawing/lockElement',
      ],
      ignoredPaths: [
        'api.queries',
        'api.mutations',
        // Enhanced drawing state paths
        'enhancedDrawing.performance.samples',
        'enhancedDrawing.collaboration.optimisticUpdates',
        'enhancedDrawing.ui.loadingStates',
        'enhancedDrawing.ui.errorStates',
      ],
    },
    immutableCheck: {
      // Ignore immutability checks for performance-critical paths
      ignoredPaths: [
        'enhancedDrawing.reactFlowData.nodes',
        'enhancedDrawing.reactFlowData.edges',
        'enhancedDrawing.history.past',
        'enhancedDrawing.history.future',
      ],
    },
  })
    .concat(apiSlice.middleware)
    .concat(statePersistenceMiddleware.middleware)
    .concat(collaborationMiddleware.middleware);

  // Add logger in development
  if (process.env.NODE_ENV === 'development') {
    const logger = createLogger({
      collapsed: true,
      duration: true,
      timestamp: true,
      logErrors: true,
      diff: true,
      // Exclude noisy actions from logging
      predicate: (getState, action) => {
        const excludedActions = [
          'enhancedDrawing/updateCollaboratorCursor',
          'enhancedDrawing/updatePerformanceMetrics',
          'enhancedDrawing/setPersistenceState',
        ];
        return !excludedActions.some(excluded => action.type.includes(excluded));
      },
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
    enhancedDrawing: enhancedDrawingSlice,
    notifications: notificationSlice,
    toolPalette: toolPaletteSlice,
  },
  middleware: getMiddleware,
  devTools: process.env.NODE_ENV === 'development' && {
    name: 'Ergoplanner AI Suite - Enhanced Drawing State',
    trace: true,
    traceLimit: 25,
    maxAge: 100, // Increased for better debugging of complex state
    serialize: {
      options: {
        // Custom serialization for complex objects
        undefined: true,
        function: true,
        symbol: true,
      },
    },
    actionCreators: {
      // Include action creators for enhanced debugging
      enhancedDrawing: enhancedDrawingSlice.actions,
    },
  },
});

// Setup listeners for refetchOnFocus/refetchOnReconnect behaviors
setupListeners(store.dispatch);

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export { useAppDispatch, useAppSelector } from './hooks';