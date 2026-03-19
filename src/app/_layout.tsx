import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { AppProvider } from '@/core/providers/AppProvider';
import { useAuthStore } from '@/core/auth/authStore';

function AuthGate() {
  const { user, isInitialized } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)/');
    }
  }, [user, isInitialized, segments, router]);

  // Show nothing while determining auth state to avoid flash
  if (!isInitialized) return null;

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AppProvider>
      <AuthGate />
    </AppProvider>
  );
}
