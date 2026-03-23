import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useSyncStore } from './syncStore';
import type { SyncStatus } from './types';

const iconMap: Record<SyncStatus, string> = {
  synced: 'cloud-check-outline',
  syncing: 'cloud-sync-outline',
  offline: 'cloud-off-outline',
  error: 'cloud-alert',
};

export function SyncStatusIndicator() {
  const { t } = useTranslation();
  const syncStatus = useSyncStore((s) => s.syncStatus);

  const icon = iconMap[syncStatus];
  const label = t(`sync.${syncStatus}`);

  if (syncStatus === 'syncing') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" />
      </View>
    );
  }

  return (
    <IconButton
      icon={icon}
      size={22}
      iconColor={syncStatus === 'synced' ? '#16a34a' : syncStatus === 'error' ? '#dc2626' : '#6b7280'}
      accessibilityLabel={label}
      onPress={() => {}}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
