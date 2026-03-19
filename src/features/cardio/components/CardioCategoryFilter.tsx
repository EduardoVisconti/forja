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
        style={styles.chip}
        selected={activeCategory === null}
        onPress={() => onSelect(null)}
      >
        {t('cardio.filterAll')}
      </Chip>
      {CARDIO_CATEGORIES.map((cat) => (
        <Chip
          key={cat}
          style={styles.chip}
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
  container: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  chip: {},
});
