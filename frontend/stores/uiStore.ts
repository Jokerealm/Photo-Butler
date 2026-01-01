import { create } from 'zustand';

interface UIStore {
  // State
  currentView: 'marketplace' | 'workspace';
  sidebarOpen: boolean;
  modalOpen: boolean;
  loading: boolean;
  toast: {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    visible: boolean;
  } | null;

  // Actions
  setCurrentView: (view: 'marketplace' | 'workspace') => void;
  setSidebarOpen: (open: boolean) => void;
  setModalOpen: (open: boolean) => void;
  setLoading: (loading: boolean) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  hideToast: () => void;
  reset: () => void;
}

const initialState = {
  currentView: 'marketplace' as const,
  sidebarOpen: false,
  modalOpen: false,
  loading: false,
  toast: null,
};

export const useUIStore = create<UIStore>((set) => ({
  ...initialState,

  setCurrentView: (currentView) => {
    set({ currentView });
  },

  setSidebarOpen: (sidebarOpen) => {
    set({ sidebarOpen });
  },

  setModalOpen: (modalOpen) => {
    set({ modalOpen });
  },

  setLoading: (loading) => {
    set({ loading });
  },

  showToast: (message, type) => {
    set({ 
      toast: { 
        message, 
        type, 
        visible: true 
      } 
    });
    
    // Auto-hide toast after 5 seconds
    setTimeout(() => {
      set({ toast: null });
    }, 5000);
  },

  hideToast: () => {
    set({ toast: null });
  },

  reset: () => {
    set(initialState);
  },
}));