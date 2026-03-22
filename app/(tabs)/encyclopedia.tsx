import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, Platform, Share } from 'react-native';
import { useGameStore } from '../../src/store/gameStore';
import { SLIME_MASTER, COLOR_FAMILIES, ALL_SLIMES, TOTAL_SLIME_COUNT } from '../../src/constants/slimes';
import { EncyclopediaCard } from '../../src/components/EncyclopediaCard';
import { RARITY_COLORS, THEME_COLORS } from '../../src/constants/colors';
import { SlimeColorFamily, EncyclopediaEntry } from '../../src/types/slime';
import { generateShareCard, shareCard } from '../../src/utils/share-card';

const COLOR_LABELS: Record<string, { label: string; emoji: string }> = {
  green: { label: '\u8349\u539F', emoji: '\u{1F7E2}' },
  blue: { label: '\u6C34', emoji: '\u{1F535}' },
  red: { label: '\u706B', emoji: '\u{1F534}' },
  yellow: { label: '\u96F7', emoji: '\u{1F7E1}' },
  purple: { label: '\u6BD2', emoji: '\u{1F7E3}' },
  pink: { label: '\u82B1', emoji: '\u{1FA77}' },
  all: { label: '\u5168\u3066', emoji: '\u{1F308}' },
};

export default function EncyclopediaScreen() {
  const encyclopedia = useGameStore(s => s.encyclopedia);
  const [filter, setFilter] = useState<string>('all');
  const [selectedEntry, setSelectedEntry] = useState<EncyclopediaEntry | null>(null);

  const discoveredCount = encyclopedia.filter(e => e.discovered).length;
  const totalCount = encyclopedia.length;
  const collectionRate = totalCount > 0 ? Math.round((discoveredCount / totalCount) * 100) : 0;

  const filteredEntries = filter === 'all'
    ? encyclopedia
    : encyclopedia.filter(e => {
        const master = SLIME_MASTER[e.masterId];
        return master && master.colorFamily === filter;
      });

  const sortedEntries = [...filteredEntries].sort((a, b) => {
    const ma = SLIME_MASTER[a.masterId];
    const mb = SLIME_MASTER[b.masterId];
    if (!ma || !mb) return 0;
    if (ma.colorFamily !== mb.colorFamily) return ma.colorFamily.localeCompare(mb.colorFamily);
    return ma.tier - mb.tier;
  });

  const selectedMaster = selectedEntry ? SLIME_MASTER[selectedEntry.masterId] : null;

  const handleShare = useCallback(async () => {
    const state = useGameStore.getState();
    const GAME_URL = 'https://slime-ranch.vercel.app';
    const message = `\u30B9\u30E9\u30A4\u30E0\u7267\u5834 \u{1F40C} \u30B3\u30EC\u30AF\u30B7\u30E7\u30F3\u7387 ${collectionRate}% (${discoveredCount}/${totalCount}\u7A2E)\n\u516836\u7A2E\u30B9\u30E9\u30A4\u30E0\u3092\u96C6\u3081\u3088\u3046\uD83D\uDC47\n${GAME_URL}\n#\u30B9\u30E9\u30A4\u30E0\u7267\u5834 #\u653E\u7F6E\u30B2\u30FC\u30E0 #\u30DE\u30FC\u30B8\u30B2\u30FC\u30E0`;

    // Try Canvas OGP card first
    const dataUrl = await generateShareCard({
      slimes: state.slimes,
      backgroundTheme: state.ranch.backgroundTheme,
      ranchRank: state.ranchRank,
      discoveredCount,
      totalCount,
      highestTierReached: state.statistics.highestTierReached,
    });

    if (dataUrl) {
      await shareCard(dataUrl, message);
      return;
    }

    // Fallback to text share
    try {
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({ text: message });
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(message);
        }
      } else {
        await Share.share({ message });
      }
    } catch {
      // User cancelled
    }
  }, [collectionRate, discoveredCount, totalCount]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.count}>\u767A\u898B: {discoveredCount}/{totalCount} ({collectionRate}%)</Text>
        <Pressable style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareText}>{'\u{1F4E4}'} \u30B7\u30A7\u30A2</Text>
        </Pressable>
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${collectionRate}%` }]} />
      </View>

      {/* Color filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        <Pressable
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>{'\u{1F308}'}\u5168\u3066</Text>
        </Pressable>
        {COLOR_FAMILIES.map(cf => (
          <Pressable
            key={cf}
            style={[styles.filterTab, filter === cf && styles.filterTabActive]}
            onPress={() => setFilter(cf)}
          >
            <Text style={[styles.filterText, filter === cf && styles.filterTextActive]}>
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
              <Text style={styles.modalStat}>{'\u{1F4B0}'} {selectedMaster.coinsPerMinute} coin/min</Text>
              {selectedMaster.ability !== 'none' && (
                <Text style={styles.modalAbility}>{'\u2728'} {selectedMaster.ability}</Text>
              )}
              <Text style={styles.modalDesc}>{selectedMaster.description}</Text>
              <Text style={styles.modalMergeCount}>\u5408\u6210\u56DE\u6570: {selectedEntry.mergeCount}</Text>

              {selectedEntry.discoveredAt && (
                <Text style={styles.modalDate}>
                  \u767A\u898B\u65E5: {new Date(selectedEntry.discoveredAt).toLocaleDateString('ja-JP')}
                </Text>
              )}

              {selectedEntry.discoveredAt && (
                <View style={styles.newDiscoveryBanner}>
                  <Text style={styles.newDiscoveryText}>{'\uD83C\uDF89'} \u65B0\u7A2E\u767A\u898B\uFF01</Text>
                  <Pressable
                    style={styles.discoveryShareBtn}
                    onPress={async () => {
                      try {
                        await Share.share({
                          message: `\u30B9\u30E9\u30A4\u30E0\u7267\u5834\u3067\u300C${selectedMaster?.name ?? ''}\u300D\u3092\u767A\u898B\uFF01\n#\u30B9\u30E9\u30A4\u30E0\u7267\u5834 #\u65B0\u7A2E\u767A\u898B`,
                        });
                      } catch {
                        // User cancelled
                      }
                    }}
                  >
                    <Text style={styles.discoveryShareText}>{'\uD83D\uDCE4'} \u30B7\u30A7\u30A2</Text>
                  </Pressable>
                </View>
              )}

              <Pressable style={styles.modalClose} onPress={() => setSelectedEntry(null)}>
                <Text style={styles.modalCloseText}>\u9589\u3058\u308B</Text>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 4,
  },
  count: { fontSize: 14, fontWeight: 'bold', color: THEME_COLORS.text },
  shareButton: {
    backgroundColor: THEME_COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  shareText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressContainer: {
    height: 6,
    backgroundColor: THEME_COLORS.progressBarBg,
    borderRadius: 3,
    marginHorizontal: 12,
    marginTop: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: THEME_COLORS.progressBar,
    borderRadius: 3,
  },
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
  filterText: { fontSize: 12, fontWeight: '600', color: THEME_COLORS.text },
  filterTextActive: { color: '#FFF' },
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
  newDiscoveryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9C4',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 10,
    gap: 8,
  },
  newDiscoveryText: { fontSize: 13, fontWeight: 'bold', color: '#E65100', flex: 1 },
  discoveryShareBtn: {
    backgroundColor: THEME_COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discoveryShareText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
});
