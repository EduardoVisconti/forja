import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/core/auth/authStore';
import { supabase } from '@/core/supabase/client';

const userNameKey = (userId: string) => `user:name:${userId}`;

function resolveDisplayName(storedName: string | null, metadataName?: string, email?: string | null): string {
  if (storedName && storedName.trim().length > 0) return storedName.trim();
  if (metadataName && metadataName.trim().length > 0) return metadataName.trim();
  if (email && email.includes('@')) return email.split('@')[0];
  return '';
}

interface UseProfileParams {
  visible: boolean;
  onNameUpdated?: () => void;
}

interface ProfileFeedback {
  type: 'success' | 'error';
  message: string;
}

export function useProfile({ visible, onNameUpdated }: UseProfileParams) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? '';
  const email = user?.email ?? '';

  const [name, setName] = useState('');
  const [originalName, setOriginalName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSendingPasswordReset, setIsSendingPasswordReset] = useState(false);
  const [feedback, setFeedback] = useState<ProfileFeedback | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      if (!visible) return;

      if (!userId) {
        if (!isMounted) return;
        setName('');
        setOriginalName('');
        setFeedback(null);
        return;
      }

      try {
        const storedName = await AsyncStorage.getItem(userNameKey(userId));
        if (!isMounted) return;
        const displayName = resolveDisplayName(
          storedName,
          user?.user_metadata?.full_name as string | undefined,
          user?.email,
        );
        setName(displayName);
        setOriginalName(displayName);
        setFeedback(null);
      } catch {
        if (!isMounted) return;
        const fallbackName = resolveDisplayName(
          null,
          user?.user_metadata?.full_name as string | undefined,
          user?.email,
        );
        setName(fallbackName);
        setOriginalName(fallbackName);
        setFeedback(null);
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [visible, userId, user?.email, user?.user_metadata?.full_name]);

  const canSaveName = useMemo(() => {
    const trimmedName = name.trim();
    return trimmedName.length >= 2 && trimmedName !== originalName;
  }, [name, originalName]);

  const changeName = useCallback(async () => {
    const trimmedName = name.trim();

    if (!userId) {
      setFeedback({ type: 'error', message: t('home.profile.errors.notAuthenticated') });
      return;
    }

    if (trimmedName.length < 2) {
      setFeedback({ type: 'error', message: t('home.profile.errors.invalidName') });
      return;
    }

    setIsSavingName(true);
    setFeedback(null);

    try {
      await AsyncStorage.setItem(userNameKey(userId), trimmedName);

      const { error } = await supabase.auth.updateUser({
        data: { full_name: trimmedName },
      });

      if (error) {
        throw error;
      }

      setOriginalName(trimmedName);
      setFeedback({ type: 'success', message: t('home.profile.nameUpdated') });
      onNameUpdated?.();
    } catch {
      setFeedback({ type: 'error', message: t('home.profile.errors.updateNameFailed') });
    } finally {
      setIsSavingName(false);
    }
  }, [name, onNameUpdated, t, userId]);

  const changePassword = useCallback(async () => {
    if (!email) {
      setFeedback({ type: 'error', message: t('home.profile.errors.missingEmail') });
      return;
    }

    setIsSendingPasswordReset(true);
    setFeedback(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        throw error;
      }

      setFeedback({ type: 'success', message: t('home.profile.passwordResetSent') });
    } catch {
      setFeedback({ type: 'error', message: t('home.profile.errors.resetPasswordFailed') });
    } finally {
      setIsSendingPasswordReset(false);
    }
  }, [email, t]);

  return {
    name,
    email,
    feedback,
    canSaveName,
    isSavingName,
    isSendingPasswordReset,
    setName,
    changeName,
    changePassword,
  };
}
