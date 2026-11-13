import { create } from 'zustand';

export interface Account {
  id: string;
  uq_number: string;
  uq_email: string;
  status: string;
  kyc_verified: boolean;
}

interface AuthState {
  // Existant
  account: Account | null;
  token: string | null;
  isAuthenticated: boolean;
  setAccount: (account: Account | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;

  // ===== Secure Flow (3 tentatives) =====
  sessionId: string | null;
  tfaToken: string | null;
  attemptStep: number;  // 0=inactif, 1, 2, 3
  setSecureSession: (id: string, tfa: string, step: number) => void;
  clearSecureSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  account: null,
  token: localStorage.getItem('uq_token'),
  isAuthenticated: !!localStorage.getItem('uq_token'),
  setAccount: (account) => set({ account, isAuthenticated: !!account }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('uq_token', token);
    } else {
      localStorage.removeItem('uq_token');
    }
    set({ token, isAuthenticated: !!token });
  },
  logout: () => {
    localStorage.removeItem('uq_token');
    set({ account: null, token: null, isAuthenticated: false, sessionId: null, tfaToken: null, attemptStep: 0 });
  },

  // ===== Secure Flow =====
  sessionId: null,
  tfaToken: null,
  attemptStep: 0,
  setSecureSession: (id, tfa, step) => set({
    sessionId: id,
    tfaToken: tfa,
    attemptStep: step,
  }),
  clearSecureSession: () => set({
    sessionId: null,
    tfaToken: null,
    attemptStep: 0,
  }),
}));
