import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, HelperText, TextInput } from 'react-native-paper';
import { loginSchema, type LoginFormValues } from '@/features/auth/schemas/authSchemas';
import { useAuth } from '@/core/auth/useAuth';
import { GoogleSignInButton } from './GoogleSignInButton';

export function LoginForm() {
  const { t } = useTranslation();
  const { signIn, isLoading } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    const { error } = await signIn(values.email, values.password);
    if (error) {
      setServerError(t('auth.errors.invalidCredentials'));
    }
  };

  return (
    <View style={styles.form}>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label={t('auth.login.emailLabel')}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={!!errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="next"
            mode="outlined"
          />
        )}
      />
      <HelperText type="error" visible={!!errors.email}>
        {errors.email?.message ? t(errors.email.message) : ''}
      </HelperText>

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label={t('auth.login.passwordLabel')}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={!!errors.password}
            secureTextEntry={!passwordVisible}
            autoComplete="current-password"
            returnKeyType="done"
            onSubmitEditing={handleSubmit(onSubmit)}
            mode="outlined"
            right={
              <TextInput.Icon
                icon={passwordVisible ? 'eye-off' : 'eye'}
                onPress={() => setPasswordVisible((v) => !v)}
              />
            }
          />
        )}
      />
      <HelperText type="error" visible={!!errors.password}>
        {errors.password?.message ? t(errors.password.message) : ''}
      </HelperText>

      {serverError ? <Text style={styles.errorText}>{serverError}</Text> : null}

      <Button
        mode="contained"
        onPress={handleSubmit(onSubmit)}
        loading={isLoading}
        disabled={isLoading}
        style={styles.submitButton}
      >
        {t('auth.login.submitButton')}
      </Button>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>{t('common.or')}</Text>
        <View style={styles.dividerLine} />
      </View>

      <GoogleSignInButton disabled={isLoading} />

      <View style={styles.footer}>
        <Text style={styles.footerText}>{t('auth.login.noAccount')}</Text>
        <Text style={styles.footerLink} onPress={() => router.push('/(auth)/register')}>
          {t('auth.login.registerLink')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 4,
  },
  submitButton: {
    marginTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginTop: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
  },
  footerLink: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '600',
  },
});
