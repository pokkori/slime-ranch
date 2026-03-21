import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal } from 'react-native';
import { useGameStore } from '../../src/store/gameStore';
import { SLIME_MASTER, COLOR_FAMILIES, ALL_SLIMES } from '../../src/constants/slimes';
import { EncyclopediaCard } from '../../src/components/EncyclopediaCard';
import { RARITY_COLORS, THEME_COLORS } from '../../src/constants/colors';
import { SlimeColorFamily, EncyclopediaEntry } from '../../src/types/slime';

const COLOR_LABELS: Record<string, { label: string; emoji: string }> = {
  green: { label: '草原', emoji: '🟢' },
  blue: { label: '水', emoji: '🔵' },
  red: { label: '火', emoji: '🔴' },
  yellow: { label: '雷', emoji: '🟡' },
  purple: { label: '毒', emoji: '🟣' },
  pink: { label: '花', emoji: '🩷' },
  all: { label: '全て', emoji: '🌈' },
};

export default function EncyclopediaScreen() {
  const encyclopedia = useGameStore(s => s.encyclopedia);
  const [filter, setFilter] = useState<string>('all');
  const [selectedEntry, setSelectedEntry] = useState<EncyclopediaEntry | null>(null);

  const discoveredCount = encyclopedia.filter(e => e.discovered).length;
  const totalCount = encyclopedia.length;

  const filteredEntries = filter === 'all'
    ? encyclopedia
    : encyclopedia.filter(e => {
        const master = SLIME_MASTER[e.masterId];
        return master && master.colorFamily === filter;
      });

  // Sort by tier
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    const ma = SLIME_MASTER[a.masterId];
    const mb = SLIME_MASTER[b.masterId];
    if (!ma || !mb) return 0;
    if (ma.colorFamily !== mb.colorFamily) return ma.colorFamily.localeCompare(mb.colorFamily);
    return ma.tier - mb.tier;
  });

  const selectedMaster = selectedEntry ? SLIME_MASTER[selectedEntry.masterId] : null;

  return (
    <View style={styles.container}>
      <View style={styles.countRow}>
        <Text style={styles.count}>発見: {discoveredCount}/{totalCount}</Text>
      </View>

      {/* Color filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        <Pressable
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={styles.filterText}>🌈全て</Text>
        </Pressable>
        {COLOR_FAMILIES.map(cf => (
          <Pressable
            key={cf}
            style={[styles.filterTab, filter === cf && styles.filterTabActive]}
            onPress={() => setFilter(cf)}
          >
            <Text style={styles.filterText}>
              {COLOR_LABELS[cf]?.emoji} {COLOR_LABELS[cf]?.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Grid */}
      <ScrollView style={styles.grid} contentContainerStyle={styles.gridContent}>
        <View style={styles.gridRow}>
          {sortedEntries.map(entry => (
            <EncyclopediaCard
              key={entry.masterId}
              entry={entry}
              onPress={() => setSelectedEntry(entry)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Detail modal */}
      {selectedEntry && selectedMaster && (
        <Modal visible={true} transparent animationType="fade" onRequestClose={() => setSelectedEntry(null)}>
          <Pressable style={styles.modalOverlay} onPress={() => setSelectedEntry(null)}>
            <View style={styles.modalCard}>
              <View style={[styles.modalPreview, { backgroundColor: selectedMaster.baseColor }]}>
                <View style={styles.modalEyes}>
                  <View style={styles.modalEye}><View style={styles.modalPupil} /></View>
                  <View style={styles.modalEye}><View style={styles.modalPupil} /></View>
                </View>
                <View style={styles.modalMouth} />
              </View>

              <Text style={styles.modalName}>{selectedMaster.name}</Text>
              <Text style={[styles.modalRarity, { color: RARITY_COLORS[selectedMaster.rarity] }]}>
                {'\u2605'.repeat(selectedMaster.tier)} {selectedMaster.rarity}
              </Text>
              <Text style={styles.modalStat}>&#x1F4B0; {selectedMaster.coinsPerMinute} coin/min</Text>
              {selectedMaster.ability !== 'none' && (
                <Text style={styles.modalAbility}>&#x2728; {selectedMaster.ability}</Text>
              )}
              <Text style={styles.modalDesc}>{selectedMaster.description}</Text>
              <Text style={styles.modalMergeCount}>合成回数: {selectedEntry.mergeCount}</Text>

              {selectedEntry.discoveredAt && (
                <Text style={styles.modalDate}>
                  発見日: {new Date(selectedEntry.discoveredAt).toLocaleDateString('ja-JP')}
                </Text>
              )}

              <Pressable style={styles.modalClose} onPress={() => setSelectedEntry(null)}>
                <Text style={styles.modalCloseText}>閉じる</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME_COLORS.background },
  countRow: { padding: 12, alignItems: 'flex-end' },
  count: { fontSize: 14, fontWeight: 'bold', color: THEME_COLORS.text },
  filterRow: { maxHeight: 44, paddingHorizontal: 8 },
  filterTab: {
    paddingHorizontal: 12, paddingVertical: 8, marginHorizontal: 4,
    borderRadius: 16, backgroundColor: THEME_COLORS.cardBg,
    borderWidth: 1, borderColor: THEME_COLORS.cardBorder,
  },
  filterTabActive: {
    backgroundColor: THEME_COLORS.primary,
    borderColor: THEME_COLORS.primary,
  },
  filterText: { fontSize: 12, fontWeight: '600' },
  grid: { flex: 1, marginTop: 8 },
  gridContent: { paddingHorizontal: 8, paddingBottom: 20 },
  gridRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 24, width: 280, alignItems: 'center' },
  modalPreview: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  modalEyes: { flexDirection: 'row', marginBottom: 4 },
  modalEye: { width: 14, height: 18, borderRadius: 7, backgroundColor: '#FFF', marginHorizontal: 4, justifyContent: 'center', alignItems: 'center' },
  modalPupil: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#333' },
  modalMouth: { width: 16, height: 8, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, backgroundColor: 'rgba(0,0,0,0.2)' },
  modalName: { fontSize: 20, fontWeight: 'bold', marginTop: 12, color: THEME_COLORS.text },
  modalRarity: { fontSize: 14, marginTop: 4 },
  modalStat: { fontSize: 13, color: THEME_COLORS.textSecondary, marginTop: 8 },
  modalAbility: { fontSize: 13, color: THEME_COLORS.primary, marginTop: 4 },
  modalDesc: { fontSize: 12, color: THEME_COLORS.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 18 },
  modalMergeCount: { fontSize: 11, color: THEME_COLORS.textSecondary, marginTop: 8 },
  modalDate: { fontSize: 11, color: THEME_COLORS.textSecondary, marginTop: 4 },
  modalClose: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 8, backgroundColor: THEME_COLORS.primary, borderRadius: 20 },
  modalCloseText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
});
