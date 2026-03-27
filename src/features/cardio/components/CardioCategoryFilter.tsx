import { ScrollView, StyleSheet, View } from 'react-native';
import { Chip } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { colors } from '@/core/theme/tokens';
import { TRAINING_TYPES, CARDIO_ZONES } from '../schemas/cardioSchemas';
import type { CardioType, CardioZone } from '../types';

export type CardioFilterValue = NonNullable<CardioType> | NonNullable<CardioZone> | null;

interface Props {
  activeFilter: CardioFilterValue;
  onSelect: (filter: CardioFilterValue) => void;
}

export function CardioCategoryFilter({ activeFilter, onSelect }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
      <Chip
        compact
        style={[
          styles.chip,
          styles.chipUnselected,
          activeFilter === null ? styles.chipSelected : null,
          { height: 32 },
        ]}
        textStyle={[
          styles.chipTextUnselected,
          activeFilter === null ? styles.chipTextSelected : null,
        ]}
        selected={activeFilter === null}
        onPress={() => onSelect(null)}
      >
        {t('cardio.filterAll')}
      </Chip>
      {TRAINING_TYPES.map((type) => (
        <Chip
          key={type}
          compact
          style={[
            styles.chip,
            styles.chipUnselected,
            activeFilter === type ? styles.chipSelected : null,
            { height: 32 },
          ]}
          textStyle={[
            styles.chipTextUnselected,
            activeFilter === type ? styles.chipTextSelected : null,
          ]}
          selected={activeFilter === type}
          onPress={() => onSelect(activeFilter === type ? null : type)}
        >
          {t(`cardio.trainingType.${type}`)}
        </Chip>
      ))}
      {CARDIO_ZONES.map((z) => (
        <Chip
          key={z}
          compact
          style={[
            styles.chip,
            styles.chipUnselected,
            activeFilter === z ? styles.chipSelected : null,
            { height: 32 },
          ]}
          textStyle={[
            styles.chipTextUnselected,
            activeFilter === z ? styles.chipTextSelected : null,
          ]}
          selected={activeFilter === z}
          onPress={() => onSelect(activeFilter === z ? null : z)}
        >
          {t(`cardio.zone.${z}`)}
        </Chip>
      ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingVertical: 8 },
  container: { gap: 8, paddingHorizontal: 16 },
  chip: {},
  chipSelected: { backgroundColor: colors.cardio },
  chipUnselected: { backgroundColor: colors.surfaceVariant },
  chipTextSelected: { color: '#ffffff' },
  chipTextUnselected: { color: colors.textSecondary },
});
