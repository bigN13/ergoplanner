import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ToastNotification } from '@/types';

// UI State interface
interface UIState {
  // Navigation
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  activeNavItem: string | null;

  // Theme
  theme: 'light' | 'dark';
  primaryColor: string;

  // Modals and dialogs
  modals: {
    [key: string]: {
      isOpen: boolean;
      data?: any;
    };
  };

  // Loading states
  globalLoading: boolean;
  pageLoading: boolean;
  loadingMessage?: string;

  // Notifications
  toasts: ToastNotification[];

  // Drawing UI
  drawingUI: {
    toolbarVisible: boolean;
    propertiesPanelVisible: boolean;
    symbolPaletteVisible: boolean;
    layersPanelVisible: boolean;
    boqPanelVisible: boolean;
    selectedTool: string | null;
    gridVisible: boolean;
    snapToGrid: boolean;
    zoomLevel: number;
  };

  // Responsive
  isMobile: boolean;
  isTablet: boolean;
  screenSize: {
    width: number;
    height: number;
  };
}

// Initial state
const initialState: UIState = {
  // Navigation
  sidebarOpen: true,
  sidebarCollapsed: false,
  activeNavItem: null,

  // Theme
  theme: 'light',
  primaryColor: '#3b82f6',

  // Modals
  modals: {},

  // Loading
  globalLoading: false,
  pageLoading: false,

  // Notifications
  toasts: [],

  // Drawing UI
  drawingUI: {
    toolbarVisible: true,
    propertiesPanelVisible: true,
    symbolPaletteVisible: true,
    layersPanelVisible: false,
    boqPanelVisible: false,
    selectedTool: null,
    gridVisible: true,
    snapToGrid: true,
    zoomLevel: 1,
  },

  // Responsive
  isMobile: false,
  isTablet: false,
  screenSize: {
    width: 1920,
    height: 1080,
  },
};

// UI slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Navigation
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },

    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },

    toggleSidebarCollapsed: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },

    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },

    setActiveNavItem: (state, action: PayloadAction<string | null>) => {
      state.activeNavItem = action.payload;
    },

    // Theme
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('ergoplanner_theme', action.payload);
      }
    },

    setPrimaryColor: (state, action: PayloadAction<string>) => {
      state.primaryColor = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('ergoplanner_primary_color', action.payload);
      }
    },

    // Modals
    openModal: (state, action: PayloadAction<{ id: string; data?: any }>) => {
      const { id, data } = action.payload;
      state.modals[id] = { isOpen: true, data };
    },

    closeModal: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (state.modals[id]) {
        state.modals[id].isOpen = false;
        delete state.modals[id].data;
      }
    },

    closeAllModals: (state) => {
      state.modals = {};
    },

    // Loading
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.globalLoading = action.payload;
      if (!action.payload) {
        state.loadingMessage = undefined;
      }
    },

    setPageLoading: (state, action: PayloadAction<boolean>) => {
      state.pageLoading = action.payload;
    },

    setLoadingMessage: (state, action: PayloadAction<string | undefined>) => {
      state.loadingMessage = action.payload;
    },

    // Notifications
    addToast: (state, action: PayloadAction<Omit<ToastNotification, 'id'>>) => {
      const toast: ToastNotification = {
        ...action.payload,
        id: Math.random().toString(36).substr(2, 9),
      };
      state.toasts.push(toast);
    },

    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter(toast => toast.id !== action.payload);
    },

    clearAllToasts: (state) => {
      state.toasts = [];
    },

    // Drawing UI
    toggleDrawingPanel: (state, action: PayloadAction<keyof UIState['drawingUI']>) => {
      const panel = action.payload;
      if (typeof state.drawingUI[panel] === 'boolean') {
        state.drawingUI[panel] = !state.drawingUI[panel] as any;
      }
    },

    setDrawingPanel: (state, action: PayloadAction<{ panel: keyof UIState['drawingUI']; visible: boolean }>) => {
      const { panel, visible } = action.payload;
      if (typeof state.drawingUI[panel] === 'boolean') {
        state.drawingUI[panel] = visible as any;
      }
    },

    setSelectedTool: (state, action: PayloadAction<string | null>) => {
      state.drawingUI.selectedTool = action.payload;
    },

    setZoomLevel: (state, action: PayloadAction<number>) => {
      state.drawingUI.zoomLevel = Math.max(0.1, Math.min(4, action.payload));
    },

    resetDrawingUI: (state) => {
      state.drawingUI = initialState.drawingUI;
    },

    // Responsive
    setScreenSize: (state, action: PayloadAction<{ width: number; height: number }>) => {
      const { width, height } = action.payload;
      state.screenSize = { width, height };
      state.isMobile = width < 768;
      state.isTablet = width >= 768 && width < 1024;

      // Auto-collapse sidebar on mobile
      if (state.isMobile && state.sidebarOpen && !state.sidebarCollapsed) {
        state.sidebarCollapsed = true;
      }
    },

    // Bulk updates
    updateDrawingUI: (state, action: PayloadAction<Partial<UIState['drawingUI']>>) => {
      state.drawingUI = { ...state.drawingUI, ...action.payload };
    },
  },
});

// Export actions
export const {
  // Navigation
  toggleSidebar,
  setSidebarOpen,
  toggleSidebarCollapsed,
  setSidebarCollapsed,
  setActiveNavItem,

  // Theme
  setTheme,
  setPrimaryColor,

  // Modals
  openModal,
  closeModal,
  closeAllModals,

  // Loading
  setGlobalLoading,
  setPageLoading,
  setLoadingMessage,

  // Notifications
  addToast,
  removeToast,
  clearAllToasts,

  // Drawing UI
  toggleDrawingPanel,
  setDrawingPanel,
  setSelectedTool,
  setZoomLevel,
  resetDrawingUI,
  updateDrawingUI,

  // Responsive
  setScreenSize,
} = uiSlice.actions;

// Selectors
export const selectUI = (state: { ui: UIState }) => state.ui;
export const selectSidebar = (state: { ui: UIState }) => ({
  isOpen: state.ui.sidebarOpen,
  isCollapsed: state.ui.sidebarCollapsed,
});
export const selectTheme = (state: { ui: UIState }) => state.ui.theme;
export const selectModals = (state: { ui: UIState }) => state.ui.modals;
export const selectToasts = (state: { ui: UIState }) => state.ui.toasts;
export const selectDrawingUI = (state: { ui: UIState }) => state.ui.drawingUI;
export const selectIsLoading = (state: { ui: UIState }) =>
  state.ui.globalLoading || state.ui.pageLoading;
export const selectScreenInfo = (state: { ui: UIState }) => ({
  isMobile: state.ui.isMobile,
  isTablet: state.ui.isTablet,
  size: state.ui.screenSize,
});

// Export reducer
export default uiSlice.reducer;