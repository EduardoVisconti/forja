import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { Button, Dialog, Portal, Text, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { dialogActionsStyle, modalStyle } from '@/core/theme/tokens';
import { useProfile } from '@/features/home/hooks/useProfile';

interface ProfileModalProps {
  visible: boolean;
  onDismiss: () => void;
  onNameUpdated?: () => void;
}

export function ProfileModal({ visible, onDismiss, onNameUpdated }: ProfileModalProps) {
  const { t } = useTranslation();
  const {
    name,
    email,
    feedback,
    canSaveName,
    isSavingName,
    isSendingPasswordReset,
    setName,
    changeName,
    changePassword,
  } = useProfile({ visible, onNameUpdated });

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={[modalStyle, styles.dialog]}>
        <Dialog.Title>{t('home.profile.title')}</Dialog.Title>
        <Dialog.Content style={styles.content}>
          <KeyboardAvoidingView
            style={styles.keyboardContent}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={80}
          >
            <TextInput
              mode="outlined"
              label={t('home.profile.nameLabel')}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
            />

            <TextInput
              mode="outlined"
              label={t('home.profile.emailLabel')}
              value={email}
              disabled
            />

            {feedback ? (
              <Text style={feedback.type === 'error' ? styles.errorText : styles.successText}>
                {feedback.message}
              </Text>
            ) : null}
          </KeyboardAvoidingView>
        </Dialog.Content>

        <Dialog.Actions style={[dialogActionsStyle, styles.actions]}>
          <Button
            mode="contained"
            onPress={changeName}
            loading={isSavingName}
            disabled={isSavingName || isSendingPasswordReset || !canSaveName}
          >
            {t('home.profile.changeName')}
          </Button>
          <Button
            mode="outlined"
            onPress={changePassword}
            loading={isSendingPasswordReset}
            disabled={isSendingPasswordReset || isSavingName || !email}
          >
            {t('home.profile.changePassword')}
          </Button>
          <Button onPress={onDismiss}>{t('home.profile.close')}</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    maxWidth: 440,
  },
  content: {
    paddingTop: 4,
    backgroundColor: 'transparent',
  },
  keyboardContent: {
    gap: 12,
  },
  actions: {
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  successText: {
    color: '#166534',
    fontSize: 13,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 13,
  },
});
