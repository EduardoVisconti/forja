import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { WorkoutTemplate } from '../types';

interface TemplateCardProps {
  template: WorkoutTemplate;
  exerciseCount: number;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStart: () => void;
}

export function TemplateCard({
  template,
  exerciseCount,
  onPress,
  onEdit,
  onDelete,
  onStart,
}: TemplateCardProps) {
  const { t } = useTranslation();

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.left}>
        <Text style={styles.name}>{template.name}</Text>
        <View style={styles.meta}>
          <View style={[styles.badge, template.type === 'gym' ? styles.badgeGym : styles.badgeCardio]}>
            <Text style={styles.badgeText}>
              {t(`workout.type.${template.type}`)}
            </Text>
          </View>
          <Text style={styles.count}>
            {t('workout.exerciseCount', { count: exerciseCount })}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <IconButton icon="play-circle-outline" size={24} onPress={onStart} />
        <IconButton icon="pencil-outline" size={20} onPress={onEdit} />
        <IconButton icon="trash-can-outline" size={20} onPress={onDelete} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  left: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeGym: {
    backgroundColor: '#dcfce7',
  },
  badgeCardio: {
    backgroundColor: '#dbeafe',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  count: {
    fontSize: 13,
    color: '#6b7280',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
