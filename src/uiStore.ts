import { create } from "zustand";

interface UiState {
  theme: "light" | "dark";
  activeTab: string;
  selectedPatientId: string | null;
  isSidebarOpen: boolean;
  setTheme: (theme: "light" | "dark") => void;
  setActiveTab: (tab: string) => void;
  setSelectedPatientId: (id: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  theme: "light",
  activeTab: "dashboard",
  selectedPatientId: null,
  isSidebarOpen: false,
  setTheme: (theme) => set({ theme }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setSelectedPatientId: (selectedPatientId) => set({ selectedPatientId }),
  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
}));
