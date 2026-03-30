import { Pressable, StyleSheet, View } from 'react-native';
import { Modal, Portal, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { colors } from '@/core/theme/tokens';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  onRegisterAsDone: () => void;
  onEditPlan: () => void;
  onSkipReschedule: () => void;
}

interface ActionItemProps {
  label: string;
  onPress: () => void;
  isCancel?: boolean;
}

function ActionItem({ label, onPress, isCancel }: ActionItemProps) {
  return (
    <Pressable
      style={[styles.actionItem, isCancel ? styles.cancelItem : null]}
      onPress={onPress}
    >
      <Text variant="titleMedium" style={[styles.actionText, isCancel ? styles.cancelText : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function CardioActionSheet({
  visible,
  onDismiss,
  onRegisterAsDone,
  onEditPlan,
  onSkipReschedule,
}: Props) {
  const { t } = useTranslation();

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.overlay}>
        <View style={styles.sheet}>
          <ActionItem label={t('cardioPlan.registerAsDone')} onPress={onRegisterAsDone} />
          <ActionItem label={t('cardioPlan.editPlan')} onPress={onEditPlan} />
          <ActionItem label={t('cardioPlan.skipReschedule')} onPress={onSkipReschedule} />
          <ActionItem label={t('common.cancel')} onPress={onDismiss} isCancel />
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: 0,
    paddingBottom: 24,
  },
  actionItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  actionText: {
    color: colors.textPrimary,
  },
  cancelItem: {
    borderBottomWidth: 0,
  },
  cancelText: {
    color: colors.textSecondary,
  },
});
