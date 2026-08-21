/**
 * Fila horizontal de categorías con emoji, para Inicio. Cada azulejo navega
 * a Explorar con el filtro de categoría ya aplicado. Incluye un azulejo fijo
 * "Ofertas" en terracota al inicio (no es una categoría real del catálogo —
 * navega a Explorar igual que las demás, ya que todavía no hay un filtro de
 * promociones en el backend; mismo criterio honesto que la barra de
 * búsqueda "falsa").
 */
import { Tag } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';

import type { Category } from '@/api/types';
import { useTheme } from '@/theme/theme-provider';
import { Text } from '@/ui/Text';

export type CategoryCarouselProps = {
  categories: Category[];
  onPressCategory: (category: Category) => void;
  onPressOfertas?: () => void;
  /** Slug de la categoría activa (p.ej. si Explorar ya trae un filtro aplicado). */
  activeCategorySlug?: string;
};

export function CategoryCarousel({ categories, onPressCategory, onPressOfertas, activeCategorySlug }: CategoryCarouselProps) {
  const theme = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: theme.spacing[3], paddingHorizontal: theme.spacing[5] }}>
      {onPressOfertas ? (
        <Pressable
          onPress={onPressOfertas}
          accessibilityRole="button"
          accessibilityLabel="Ofertas y promociones"
          style={({ pressed }) => [{ alignItems: 'center', gap: 6, width: 76, opacity: pressed ? 0.8 : 1 }]}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: theme.radius.full,
              backgroundColor: theme.colors.secondaryDeep,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Tag size={24} color={theme.colors.secondaryForeground} strokeWidth={2} />
          </View>
          <Text variant="caption" color="secondaryDeep" numberOfLines={1} style={{ textAlign: 'center', fontWeight: '700' }}>
            Ofertas
          </Text>
        </Pressable>
      ) : null}

      {categories.map((category) => {
        const isActive = category.slug === activeCategorySlug;
        return (
          <Pressable
            key={category.slug}
            onPress={() => onPressCategory(category)}
            accessibilityRole="button"
            accessibilityLabel={category.name}
            accessibilityState={{ selected: isActive }}
            style={({ pressed }) => [{ alignItems: 'center', gap: 6, width: 76, opacity: pressed ? 0.8 : 1 }]}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: theme.radius.full,
                backgroundColor: isActive ? theme.colors.primaryDark : theme.colors.muted,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text variant="h1">{category.icon ?? '🏷️'}</Text>
            </View>
            <Text
              variant="caption"
              color={isActive ? 'primaryDark' : 'mutedForeground'}
              numberOfLines={2}
              style={{ textAlign: 'center', fontWeight: isActive ? '700' : '600' }}>
              {category.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
