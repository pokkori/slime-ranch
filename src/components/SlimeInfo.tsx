import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { SlimeInstance } from '../types/slime';
import { SLIME_MASTER } from '../constants/slimes';
import { RARITY_COLORS, THEME_COLORS } from '../constants/colors';

interface SlimeInfoProps {
  slime: SlimeInstance | null;
  visible: boolean;
  onClose: () => void;
}

export const SlimeInfo: React.FC<SlimeInfoProps> = ({ slime, visible, onClose }) => {
  if (!slime) return null;
  const master = SLIME_MASTER[slime.masterId];
  if (!master) return null;

  const rarityColor = RARITY_COLORS[master.rarity] || '#999';
  const stars = '\u2605'.repeat(master.tier) + '\u2606'.repeat(6 - master.tier);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.card}>
          {/* Slime preview */}
          <View style={[styles.preview, { backgroundColor: master.baseColor }]}>
            <View style={styles.previewEyes}>
              <View style={styles.previewEye}><View style={styles.previewPupil} /></View>
              <View style={styles.previewEye}><View style={styles.previewPupil} /></View>
            </View>
            <View style={styles.previewMouth} />
          </View>

          <Text style={styles.name}>{master.name}</Text>
          <Text style={[styles.rarity, { color: rarityColor }]}>
            {stars} {master.rarity.charAt(0).toUpperCase() + master.rarity.slice(1)}
          </Text>

          <View style={styles.statsRow}>
            <Text style={styles.stat}>&#x1F4B0; {master.coinsPerMinute} coin/min</Text>
          </View>

          {master.ability !== 'none' && (
            <View style={styles.abilityBadge}>
              <Text style={styles.abilityText}>
                &#x2728; {getAbilityName(master.ability)}
              </Text>
            </View>
          )}

          <Text style={styles.description}>{master.description}</Text>

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>閉じる</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
};

function getAbilityName(ability: string): string {
  const names: Record<string, string> = {
    coin_boost: 'コインブースト (+50%)',
    merge_magnet: 'マージマグネット',
    split_bonus: '分裂ボーナス (3体)',
    offline_boost: 'オフラインブースト (+100%)',
    lucky: 'ラッキー (進化スキップ10%)',
    aura: 'オーラ (周囲+25%)',
    rainbow: 'レインボー (全色合体)',
    giant: 'ジャイアント (2倍コイン)',
    speedy: 'スピーディ (高速移動)',
    golden: 'ゴールデン (3倍コイン)',
  };
  return names[ability] || ability;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    width: 280,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  preview: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  previewEyes: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  previewEye: {
    width: 14,
    height: 18,
    borderRadius: 7,
    backgroundColor: '#FFF',
    marginHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewPupil: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333',
  },
  previewMouth: {
    width: 16,
    height: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: THEME_COLORS.text,
  },
  rarity: {
    fontSize: 14,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  stat: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
  },
  abilityBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  abilityText: {
    fontSize: 12,
    color: THEME_COLORS.primary,
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    color: THEME_COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
  closeButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 8,
    backgroundColor: THEME_COLORS.primary,
    borderRadius: 20,
  },
  closeText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
