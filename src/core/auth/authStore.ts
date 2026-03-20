import { create } from 'zustand';
import type { AuthStore } from './types';

const initialState = {
  user: null,
  session: null,
  isLoading: false,
  isInitialized: false,
};

export const useAuthStore = create<AuthStore>((set) => ({
  ...initialState,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (isLoading) => set({ isLoading }),
  setInitialized: (isInitialized) => set({ isInitialized }),
  // Ao fazer signOut precisamos liberar o AuthGate para redirecionar ao login.
  // Se isInitialized voltar para false, o layout retorna null e aparenta "tela branca".
  reset: () => set({ ...initialState, isInitialized: true }),
}));
