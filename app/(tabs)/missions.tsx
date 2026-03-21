import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useGameStore } from '../../src/store/gameStore';
import { MissionCard } from '../../src/components/MissionCard';
import { AchievementCard } from '../../src/components/AchievementCard';
import { THEME_COLORS } from '../../src/constants/colors';
import { formatCountdown } from '../../src/utils/format';

export default function MissionsScreen() {
  const [tab, setTab] = useState<'daily' | 'achievements'>('daily');
  const dailyMissions = useGameStore(s => s.dailyMissions);
  const achievements = useGameStore(s => s.achievements);
  const claimMissionReward = useGameStore(s => s.claimMissionReward);
  const claimAllMissionBonus = useGameStore(s => s.claimAllMissionBonus);
  const allMissionBonusClaimed = useGameStore(s => s.allMissionBonusClaimed);

  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setHours(24, 0, 0, 0);
      const diff = Math.floor((tomorrow.getTime() - now.getTime()) / 1000);
      setCountdown(formatCountdown(diff));
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const allClaimed = dailyMissions.every(m => m.claimed);
  const allCompleted = dailyMissions.every(m => m.completed);

  return (
    <View style={styles.container}>
      {/* Segment tabs */}
      <View style={styles.segmentRow}>
        <Pressable
          style={[styles.segment, tab === 'daily' && styles.segmentActive]}
          onPress={() => setTab('daily')}
        >
          <Text style={[styles.segmentText, tab === 'daily' && styles.segmentTextActive]}>
            &#x1F4CB; デイリー
          </Text>
        </Pressable>
        <Pressable
          style={[styles.segment, tab === 'achievements' && styles.segmentActive]}
          onPress={() => setTab('achievements')}
        >
          <Text style={[styles.segmentText, tab === 'achievements' && styles.segmentTextActive]}>
            &#x1F3C6; 実績
          </Text>
        </Pressable>
      </View>

      {tab === 'daily' ? (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          <Text style={styles.resetText}>&#x23F0; リセットまで: {countdown}</Text>

          {dailyMissions.map(mission => (
            <MissionCard
              key={mission.missionId}
              mission={mission}
              onClaim={() => claimMissionReward(mission.missionId)}
            />
          ))}

          {/* All complete bonus */}
          <View style={[styles.bonusCard, allClaimed && styles.bonusCardClaimed]}>
            <Text style={styles.bonusTitle}>&#x1F381; 全ミッション達成ボーナス</Text>
            <Text style={styles.bonusReward}>&#x1F48E; 5</Text>
            {allCompleted && allClaimed && !allMissionBonusClaimed ? (
              <Pressable style={styles.bonusButton} onPress={claimAllMissionBonus}>
                <Text style={styles.bonusButtonText}>受け取る</Text>
              </Pressable>
            ) : allMissionBonusClaimed ? (
              <Text style={styles.bonusClaimed}>受取済み</Text>
            ) : (
              <Text style={styles.bonusIncomplete}>未達成</Text>
            )}
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {achievements.map(ach => (
            <AchievementCard key={ach.achievementId} achievement={ach} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME_COLORS.background },
  segmentRow: {
    flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 8,
  },
  segment: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    borderRadius: 12, backgroundColor: THEME_COLORS.cardBg,
    borderWidth: 1, borderColor: THEME_COLORS.cardBorder,
  },
  segmentActive: {
    backgroundColor: THEME_COLORS.primary, borderColor: THEME_COLORS.primary,
  },
  segmentText: { fontSize: 14, fontWeight: '600', color: THEME_COLORS.text },
  segmentTextActive: { color: '#FFF' },
  list: { flex: 1 },
  listContent: { padding: 12, paddingBottom: 30 },
  resetText: {
    fontSize: 13, color: THEME_COLORS.textSecondary, marginBottom: 12, textAlign: 'center',
  },
  bonusCard: {
    backgroundColor: '#FFF3E0', borderRadius: 12, padding: 16,
    borderWidth: 2, borderColor: THEME_COLORS.accent, alignItems: 'center',
    marginTop: 8,
  },
  bonusCardClaimed: { opacity: 0.6 },
  bonusTitle: { fontSize: 15, fontWeight: 'bold', color: THEME_COLORS.text },
  bonusReward: { fontSize: 18, marginTop: 8 },
  bonusButton: {
    backgroundColor: THEME_COLORS.accent, paddingHorizontal: 20, paddingVertical: 8,
    borderRadius: 16, marginTop: 8,
  },
  bonusButtonText: { color: '#FFF', fontWeight: 'bold' },
  bonusClaimed: { color: THEME_COLORS.textSecondary, marginTop: 8 },
  bonusIncomplete: { color: THEME_COLORS.textSecondary, marginTop: 8 },
});
