import { ScrollView, StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { CARDIO_CATEGORIES } from '../schemas/cardioSchemas';
import type { CardioCategory } from '../types';

interface Props {
  activeCategory: CardioCategory | null;
  onSelect: (category: CardioCategory | null) => void;
}

export function CardioCategoryFilter({ activeCategory, onSelect }: Props) {
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
        contentStyle={{ paddingHorizontal: 4 }}
        selected={activeCategory === null}
        onPress={() => onSelect(null)}
      >
        {t('cardio.filterAll')}
      </Chip>
      {CARDIO_CATEGORIES.map((cat) => (
        <Chip
          key={cat}
          compact
          style={[styles.chip, { height: 32 }]}
          contentStyle={{ paddingHorizontal: 4 }}
          selected={activeCategory === cat}
          onPress={() => onSelect(activeCategory === cat ? null : cat)}
        >
          {t(`cardio.category.${cat}`)}
        </Chip>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8, paddingHorizontal: 16 },
  chip: {},
});
