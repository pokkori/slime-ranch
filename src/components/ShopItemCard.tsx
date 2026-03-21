import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ShopItem } from '../types/shop';
import { THEME_COLORS } from '../constants/colors';
import { formatNumber } from '../utils/format';

interface ShopItemCardProps {
  item: ShopItem;
  onPurchase: () => void;
  canAfford: boolean;
  alreadyPurchased: boolean;
}

export const ShopItemCard: React.FC<ShopItemCardProps> = ({
  item,
  onPurchase,
  canAfford,
  alreadyPurchased,
}) => {
  const costIcon = item.costType === 'coin' ? '\u{1F4B0}' : '\u{1F48E}';

  return (
    <View style={[styles.card, alreadyPurchased && styles.cardPurchased]}>
      <View style={styles.header}>
        <Ionicons name={item.icon as any} size={24} color={THEME_COLORS.primary} />
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.cost}>{costIcon} {formatNumber(item.cost)}</Text>
      </View>

      <Text style={styles.description}>{item.description}</Text>

      <View style={styles.footer}>
        {alreadyPurchased ? (
          <Text style={styles.purchasedText}>購入済み</Text>
        ) : (
          <Pressable
            style={[styles.buyButton, !canAfford && styles.buyButtonDisabled]}
            onPress={onPurchase}
            disabled={!canAfford}
          >
            <Text style={styles.buyText}>購入する</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME_COLORS.cardBg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: THEME_COLORS.cardBorder,
  },
  cardPurchased: {
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME_COLORS.text,
  },
  cost: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME_COLORS.accent,
  },
  description: {
    fontSize: 13,
    color: THEME_COLORS.textSecondary,
    marginTop: 6,
  },
  footer: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  buyButton: {
    backgroundColor: THEME_COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  buyButtonDisabled: {
    backgroundColor: THEME_COLORS.progressBarBg,
  },
  buyText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  purchasedText: {
    color: THEME_COLORS.textSecondary,
    fontSize: 13,
  },
});
