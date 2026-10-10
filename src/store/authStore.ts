import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  guestUserId: string | null;
  isGuest: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  getEffectiveUserId: () => string;
  setAuthModalOpen: (open: boolean) => void;
  initializeAuth: () => Promise<void>;
  signOut: () => Promise<void>;
}

const LOCAL_GUEST_KEY = 'canvas_guest_user_id';

function getOrCreateLocalGuestId(): string {
  let id = localStorage.getItem(LOCAL_GUEST_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(LOCAL_GUEST_KEY, id);
  }
  return id;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  guestUserId: null,
  isGuest: false,
  isLoading: true,
  isAuthModalOpen: false,

  getEffectiveUserId: () => {
    const { user, guestUserId } = get();
    if (user?.id) return user.id;
    if (guestUserId) return guestUserId;
    const fallback = getOrCreateLocalGuestId();
    set({ guestUserId: fallback, isGuest: true });
    return fallback;
  },

  setAuthModalOpen: (open) => set({ isAuthModalOpen: open }),

  initializeAuth: async () => {
    set({ isLoading: true });
    try {
      // 1. Check existing session
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        set({
          user: session.user,
          isGuest: session.user.is_anonymous ?? false,
          guestUserId: null,
          isLoading: false,
        });
      } else {
        // 2. Try anonymous sign-in
        const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();

        if (anonData?.user && !anonError) {
          set({
            user: anonData.user,
            isGuest: true,
            guestUserId: null,
            isLoading: false,
          });
        } else {
          // 3. Fallback to local guest user ID
          const guestId = getOrCreateLocalGuestId();
          set({
            user: null,
            guestUserId: guestId,
            isGuest: true,
            isLoading: false,
          });
        }
      }

      // Listen for auth state changes
      supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          set({
            user: session.user,
            isGuest: session.user.is_anonymous ?? false,
            guestUserId: null,
          });
        } else {
          const guestId = getOrCreateLocalGuestId();
          set({
            user: null,
            guestUserId: guestId,
            isGuest: true,
          });
        }
      });
    } catch (err) {
      console.warn('Auth initialization fallback to guest:', err);
      const guestId = getOrCreateLocalGuestId();
      set({
        user: null,
        guestUserId: guestId,
        isGuest: true,
        isLoading: false,
      });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    const guestId = getOrCreateLocalGuestId();
    set({
      user: null,
      guestUserId: guestId,
      isGuest: true,
    });
  },
}));
