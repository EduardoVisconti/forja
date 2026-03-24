import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, HelperText, TextInput } from 'react-native-paper';
import { registerSchema, type RegisterFormValues } from '@/features/auth/schemas/authSchemas';
import { useAuth } from '@/core/auth/useAuth';

export function RegisterForm() {
  const { t } = useTranslation();
  const { signUp, isLoading } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    setSuccessMessage(null);

    const { error } = await signUp(values.email, values.password);

    if (error) {
      const isEmailInUse = error.message?.toLowerCase().includes('already');
      setServerError(t(isEmailInUse ? 'auth.errors.emailAlreadyInUse' : 'auth.errors.generic'));
      return;
    }

    setSuccessMessage(t('auth.register.successMessage'));
  };

  return (
    <View style={styles.form}>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label={t('auth.register.emailLabel')}
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
            label={t('auth.register.passwordLabel')}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={!!errors.password}
            secureTextEntry={!passwordVisible}
            autoComplete="new-password"
            returnKeyType="next"
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

      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label={t('auth.register.confirmPasswordLabel')}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={!!errors.confirmPassword}
            secureTextEntry={!confirmVisible}
            autoComplete="new-password"
            returnKeyType="done"
            onSubmitEditing={handleSubmit(onSubmit)}
            mode="outlined"
            right={
              <TextInput.Icon
                icon={confirmVisible ? 'eye-off' : 'eye'}
                onPress={() => setConfirmVisible((v) => !v)}
              />
            }
          />
        )}
      />
      <HelperText type="error" visible={!!errors.confirmPassword}>
        {errors.confirmPassword?.message ? t(errors.confirmPassword.message) : ''}
      </HelperText>

      {serverError ? <Text style={styles.errorText}>{serverError}</Text> : null}
      {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

      <Button
        mode="contained"
        onPress={handleSubmit(onSubmit)}
        loading={isLoading}
        disabled={isLoading}
        style={styles.submitButton}
      >
        {t('auth.register.submitButton')}
      </Button>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{t('auth.register.alreadyHaveAccount')}</Text>
        <Text style={styles.footerLink} onPress={() => router.back()}>
          {t('auth.register.loginLink')}
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
  },
  successText: {
    fontSize: 14,
    color: '#16a34a',
    textAlign: 'center',
  },
  submitButton: {
    marginTop: 8,
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
