import { ScrollView, StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
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
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      <Chip
        compact
        style={[styles.chip, { height: 32 }]}
        selected={activeFilter === null}
        onPress={() => onSelect(null)}
      >
        {t('cardio.filterAll')}
      </Chip>
      {TRAINING_TYPES.map((type) => (
        <Chip
          key={type}
          compact
          style={[styles.chip, { height: 32 }]}
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
          style={[styles.chip, { height: 32 }]}
          selected={activeFilter === z}
          onPress={() => onSelect(activeFilter === z ? null : z)}
        >
          {t(`cardio.zone.${z}`)}
        </Chip>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8, paddingHorizontal: 16 },
  chip: {},
});
