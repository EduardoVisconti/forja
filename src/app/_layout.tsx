import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { AppProvider } from '@/core/providers/AppProvider';
import { useAuthStore } from '@/core/auth/authStore';
import { hasCompletedOnboarding } from '@/features/onboarding/services/onboardingStorage';

function AuthGate() {
  const { user, isInitialized } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(false);
  const [hasCompleted, setHasCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function checkOnboarding() {
      if (!isInitialized) return;

      if (!user) {
        if (!isMounted) return;
        setHasCompleted(null);
        setIsCheckingOnboarding(false);
        return;
      }

      setIsCheckingOnboarding(true);
      try {
        const completed = await hasCompletedOnboarding(user.id);
        if (!isMounted) return;
        setHasCompleted(completed);
      } catch {
        if (!isMounted) return;
        setHasCompleted(false);
      } finally {
        if (!isMounted) return;
        setIsCheckingOnboarding(false);
      }
    }

    checkOnboarding();

    return () => {
      isMounted = false;
    };
  }, [isInitialized, user]);

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingScreen = segments[0] === 'onboarding';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
      return;
    }

    if (!user) return;

    if (isCheckingOnboarding || hasCompleted === null) return;

    if (!hasCompleted && !inOnboardingScreen && !inTabsGroup) {
      router.replace('/onboarding');
      return;
    }

    if (hasCompleted && (inAuthGroup || inOnboardingScreen)) {
      router.replace('/(tabs)/');
    }
  }, [user, isInitialized, segments, router, isCheckingOnboarding, hasCompleted]);

  if (!isInitialized || (user && (isCheckingOnboarding || hasCompleted === null))) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Slot />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default function RootLayout() {
  return (
    <AppProvider>
      <AuthGate />
    </AppProvider>
  );
}
