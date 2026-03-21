import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { formatNumber } from '../utils/format';
import { THEME_COLORS } from '../constants/colors';

export const CoinDisplay: React.FC = () => {
  const coins = useGameStore(s => s.coins);
  const gems = useGameStore(s => s.gems);

  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.icon}>&#x1F4B0;</Text>
        <Text style={styles.value}>{formatNumber(coins)}</Text>
      </View>
      <View style={[styles.badge, styles.gemBadge]}>
        <Text style={styles.icon}>&#x1F48E;</Text>
        <Text style={styles.value}>{formatNumber(gems)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  gemBadge: {},
  icon: {
    fontSize: 14,
  },
  value: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
