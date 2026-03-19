import * as WebBrowser from 'expo-web-browser';
import { Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/core/auth/useAuth';

// Required to properly close the browser on iOS after OAuth redirect
WebBrowser.maybeCompleteAuthSession();

interface GoogleSignInButtonProps {
  disabled?: boolean;
}

export function GoogleSignInButton({ disabled = false }: GoogleSignInButtonProps) {
  const { t } = useTranslation();
  const { signInWithGoogle, isLoading } = useAuth();

  const handlePress = async () => {
    const { error } = await signInWithGoogle();
    if (error && error.message !== 'auth.errors.cancelled') {
      // Non-cancellation errors are surfaced via auth state
    }
  };

  return (
    <Button
      mode="outlined"
      onPress={handlePress}
      disabled={disabled || isLoading}
      icon="google"
    >
      {t('auth.login.googleButton')}
    </Button>
  );
}
