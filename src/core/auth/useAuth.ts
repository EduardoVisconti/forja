import { makeRedirectUri } from 'expo-auth-session';
import * as authService from './authService';
import { useAuthStore } from './authStore';

export function useAuth() {
  const { user, session, isLoading, isInitialized, setLoading, reset } = useAuthStore();

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await authService.signIn(email, password);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await authService.signUp(email, password);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await authService.signOut();
      reset();
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const redirectUri = makeRedirectUri({ scheme: 'forja' });
      const { error } = await authService.signInWithGoogle(redirectUri);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  return { user, session, isLoading, isInitialized, signIn, signUp, signOut, signInWithGoogle };
}
