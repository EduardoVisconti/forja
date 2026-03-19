import { useState } from 'react';
import { View, Text } from 'react-native';
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
    <View className="gap-2">
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

      {serverError ? (
        <Text className="text-sm text-red-500 text-center mb-1">{serverError}</Text>
      ) : null}

      <Button
        mode="contained"
        onPress={handleSubmit(onSubmit)}
        loading={isLoading}
        disabled={isLoading}
        className="mt-2"
      >
        {t('auth.login.submitButton')}
      </Button>

      <View className="flex-row items-center gap-3 my-3">
        <View className="flex-1 h-px bg-gray-200" />
        <Text className="text-sm text-gray-400">{t('common.or')}</Text>
        <View className="flex-1 h-px bg-gray-200" />
      </View>

      <GoogleSignInButton disabled={isLoading} />

      <View className="flex-row justify-center items-center gap-1 mt-4">
        <Text className="text-sm text-gray-500">{t('auth.login.noAccount')}</Text>
        <Text
          className="text-sm text-green-600 font-semibold"
          onPress={() => router.push('/(auth)/register')}
        >
          {t('auth.login.registerLink')}
        </Text>
      </View>
    </View>
  );
}
