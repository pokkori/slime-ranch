import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { EncyclopediaEntry } from '../types/slime';
import { SLIME_MASTER } from '../constants/slimes';
import { RARITY_COLORS, THEME_COLORS } from '../constants/colors';

interface EncyclopediaCardProps {
  entry: EncyclopediaEntry;
  onPress: () => void;
}

export const EncyclopediaCard: React.FC<EncyclopediaCardProps> = ({ entry, onPress }) => {
  const master = SLIME_MASTER[entry.masterId];
  if (!master) return null;

  const discovered = entry.discovered;
  const rarityColor = RARITY_COLORS[master.rarity] || '#999';

  return (
    <Pressable style={styles.card} onPress={discovered ? onPress : undefined}>
      <View style={[
        styles.preview,
        {
          backgroundColor: discovered ? master.baseColor : '#BDBDBD',
        },
      ]}>
        {discovered ? (
          <>
            <View style={styles.eyes}>
              <View style={styles.eye}><View style={styles.pupil} /></View>
              <View style={styles.eye}><View style={styles.pupil} /></View>
            </View>
            <View style={styles.mouth} />
          </>
        ) : (
          <Text style={styles.unknown}>?</Text>
        )}
      </View>

      <Text style={[styles.name, !discovered && styles.nameSilhouette]} numberOfLines={1}>
        {discovered ? master.name : '???'}
      </Text>

      <Text style={[styles.rarity, { color: discovered ? rarityColor : '#BDBDBD' }]}>
        {'\u2605'.repeat(master.tier)}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 75,
    alignItems: 'center',
    margin: 4,
  },
  preview: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  eyes: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  eye: {
    width: 8,
    height: 10,
    borderRadius: 4,
    backgroundColor: '#FFF',
    marginHorizontal: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pupil: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#333',
  },
  mouth: {
    width: 8,
    height: 4,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  unknown: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  name: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME_COLORS.text,
    marginTop: 4,
    textAlign: 'center',
  },
  nameSilhouette: {
    color: '#BDBDBD',
  },
  rarity: {
    fontSize: 8,
    marginTop: 2,
  },
});
