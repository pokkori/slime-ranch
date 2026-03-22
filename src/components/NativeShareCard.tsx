import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { SLIME_MASTER } from '../constants/slimes';

interface NativeShareCardProps {
  slimes: any[];
  backgroundTheme: string;
  ranchRank: number;
  discoveredCount: number;
  totalCount: number;
  highestTierReached: number;
  todayMergeCount: number;
}

const BG_COLORS: Record<string, string> = {
  meadow: '#4CAF50',
  ocean: '#2196F3',
  volcano: '#FF5722',
  sky: '#87CEEB',
  crystal: '#9C27B0',
};

export const NativeShareCard = React.forwardRef<View, NativeShareCardProps>((props, ref) => {
  const { slimes, backgroundTheme, ranchRank, discoveredCount, totalCount, highestTierReached, todayMergeCount } = props;
  const bgColor = BG_COLORS[backgroundTheme] || BG_COLORS.meadow;

  // 上位8スライム（tier順）
  const top8 = [...slimes]
    .sort((a: any, b: any) => (b.tier ?? 0) - (a.tier ?? 0))
    .slice(0, 8);

  return (
    <View
      ref={ref}
      style={[styles.card, { backgroundColor: bgColor }]}
      collapsable={false}
    >
      <Text style={styles.title}>🐌 スライム牧場</Text>
      <Text style={styles.rank}>ランク {ranchRank}</Text>
      <View style={styles.slimeRow}>
        {top8.map((s: any, i: number) => {
          const master = SLIME_MASTER[s.masterId];
          const color = master?.baseColor ?? s.color ?? '#4CAF50';
          const highlight = master?.highlightColor ?? '#81C784';
          const tier = master?.tier ?? 1;
          const r = 14;
          return (
            <View key={i} style={[styles.slimeDot, {
              backgroundColor: color,
              width: r * 2, height: r * 2, borderRadius: r,
              borderWidth: tier >= 3 ? 2 : 1,
              borderColor: tier >= 5 ? '#FFD700' : 'rgba(255,255,255,0.6)',
              overflow: 'hidden',
            }]}>
              {/* ハイライト */}
              <View style={{ position: 'absolute', top: r * 0.1, left: r * 0.1, width: r, height: r,
                borderRadius: r / 2, backgroundColor: highlight + '60' }} />
              {/* 目（左） */}
              <View style={{ position: 'absolute', top: r * 0.6, left: r * 0.35,
                width: r * 0.28, height: r * 0.36, borderRadius: r * 0.14, backgroundColor: '#fff',
                justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ width: r * 0.14, height: r * 0.14, borderRadius: r * 0.07, backgroundColor: '#333' }} />
              </View>
              {/* 目（右） */}
              <View style={{ position: 'absolute', top: r * 0.6, right: r * 0.35,
                width: r * 0.28, height: r * 0.36, borderRadius: r * 0.14, backgroundColor: '#fff',
                justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ width: r * 0.14, height: r * 0.14, borderRadius: r * 0.07, backgroundColor: '#333' }} />
              </View>
              {/* ほっぺ（左） */}
              <View style={{ position: 'absolute', top: r * 1.1, left: r * 0.2,
                width: r * 0.28, height: r * 0.18, borderRadius: r * 0.09, backgroundColor: 'rgba(255,120,120,0.5)' }} />
              {/* ほっぺ（右） */}
              <View style={{ position: 'absolute', top: r * 1.1, right: r * 0.2,
                width: r * 0.28, height: r * 0.18, borderRadius: r * 0.09, backgroundColor: 'rgba(255,120,120,0.5)' }} />
              {tier >= 5 && (
                <Text style={{ position: 'absolute', top: -8, fontSize: 8, alignSelf: 'center' }}>👑</Text>
              )}
            </View>
          );
        })}
      </View>
      <View style={styles.statsRow}>
        <Text style={styles.stat}>📖 {discoveredCount}/{totalCount}種</Text>
        <Text style={styles.stat}>⭐ Tier{highestTierReached}</Text>
        <Text style={styles.stat}>✨ 今日{todayMergeCount}回</Text>
      </View>
      <Text style={styles.hashtag}>#スライム牧場 #放置ゲーム</Text>
    </View>
  );
});

export async function captureAndShareNativeCard(
  cardRef: React.RefObject<View | null>,
  text: string
): Promise<boolean> {
  if (!cardRef.current) return false;
  try {
    const uri = await captureRef(cardRef, { format: 'png', quality: 0.95 });
    const isAvail = await Sharing.isAvailableAsync();
    if (isAvail) {
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: text, UTI: 'public.png' });
      return true;
    }
  } catch (e) {
    console.log('NativeShareCard capture failed', e);
  }
  return false;
}

const styles = StyleSheet.create({
  card: {
    width: 320,
    height: 168,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  rank: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: '700',
    marginTop: 2,
  },
  slimeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  slimeDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slimeFace: {
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  stat: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: '600',
  },
  hashtag: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 6,
  },
});
