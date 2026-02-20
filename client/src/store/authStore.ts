import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  organization: { id: string; name: string; slug: string } | null;
  user: { id: string; role: string } | null;
  isAuthenticated: boolean;
  
  setAuth: (token: string, org: any, user: any) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      organization: null,
      user: null,
      isAuthenticated: false,

      setAuth: (token, org, user) => {
        localStorage.setItem('rizeos_token', token);
        set({ token, organization: org, user, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('rizeos_token');
        set({ token: null, organization: null, user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'rizeos_auth_state', 
    }
  )
);