import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { useOnboarding } from '@/features/onboarding/hooks/useOnboarding';

export default function OnboardingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { submitName } = useOnboarding();

  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      setError(t('onboarding.errors.invalidName'));
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await submitName(trimmedName);
      router.replace('/(tabs)/');
    } catch {
      setError(t('onboarding.errors.submitFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <Image source={require('../../assets/icon.png')} style={styles.logo} resizeMode="contain" />

      <Text style={styles.title}>{t('onboarding.title')}</Text>
      <Text style={styles.subtitle}>{t('onboarding.subtitle')}</Text>

      <TextInput
        mode="outlined"
        value={name}
        onChangeText={setName}
        placeholder={t('onboarding.placeholder')}
        autoCapitalize="words"
        autoCorrect={false}
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
        style={styles.input}
        disabled={isSubmitting}
        accessibilityLabel={t('onboarding.placeholder')}
      />

      <HelperText type="error" visible={Boolean(error)} style={styles.helperText}>
        {error}
      </HelperText>

      <Button mode="contained" onPress={handleSubmit} loading={isSubmitting} disabled={isSubmitting}>
        {t('onboarding.confirm')}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
  },
  logo: {
    width: 48,
    height: 48,
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  input: {
    marginBottom: 4,
  },
  helperText: {
    marginBottom: 8,
  },
});
