import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { IconButton, Text, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { WorkoutTemplate } from '../types';
import { colors } from '@/core/theme/tokens';

interface TemplateCardProps {
  template: WorkoutTemplate;
  exerciseCount: number;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStart: () => void;
}

const typeLabelKey: Record<WorkoutTemplate['type'], string> = {
  gym: 'workout.type.gym',
  cardio: 'workout.type.cardio',
  functional: 'workout.type.functional',
};

type BadgeVariant = 'gym' | 'cardio' | 'functional';

function resolveBadgeVariant(type: string): BadgeVariant {
  const normalized = type.toLowerCase();

  if (normalized === 'gym' || normalized === 'musculacao') {
    return 'gym';
  }

  if (normalized === 'functional' || normalized === 'funcional') {
    return 'functional';
  }

  return 'cardio';
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
  const theme = useTheme();
  const styles = createStyles(theme);
  const badgeVariant = resolveBadgeVariant(template.type);
  const badgeStyleByType = {
    gym: styles.badgeGym,
    cardio: styles.badgeCardio,
    functional: styles.badgeFunctional,
  };
  const badgeTextStyleByType = {
    gym: styles.badgeTextGym,
    cardio: styles.badgeTextCardio,
    functional: styles.badgeTextFunctional,
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.left}>
        <Text style={styles.name}>{template.name}</Text>
        <View style={styles.meta}>
          <View style={[styles.badge, badgeStyleByType[badgeVariant]]}>
            <Text style={[styles.badgeText, badgeTextStyleByType[badgeVariant]]}>
              {t(typeLabelKey[template.type])}
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

const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    left: {
      flex: 1,
    },
    name: {
      fontSize: 17,
      fontWeight: '600',
      color: theme.colors.onSurface,
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
      backgroundColor: colors.workoutDark,
    },
    badgeCardio: {
      backgroundColor: colors.cardioDark,
    },
    badgeFunctional: {
      backgroundColor: colors.neutralSubtle,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '600',
    },
    badgeTextGym: {
      color: colors.workoutLight,
    },
    badgeTextCardio: {
      color: colors.cardioLight,
    },
    badgeTextFunctional: {
      color: colors.neutralLight,
    },
    count: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
  });
