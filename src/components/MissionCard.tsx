import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { DailyMission } from '../types/mission';
import { THEME_COLORS } from '../constants/colors';
import { ALL_DAILY_MISSIONS, DailyMissionTemplate } from '../constants/missions';

interface MissionCardProps {
  mission: DailyMission;
  onClaim: () => void;
}

const MISSION_TEXTS: Record<string, string> = {};
for (const m of ALL_DAILY_MISSIONS) {
  MISSION_TEXTS[m.missionId] = m.text;
}

export const MissionCard: React.FC<MissionCardProps> = ({ mission, onClaim }) => {
  const progress = Math.min(mission.currentValue / mission.targetValue, 1);
  const text = MISSION_TEXTS[mission.missionId] || mission.type;

  return (
    <View style={[styles.card, mission.claimed && styles.cardClaimed]}>
      <View style={styles.header}>
        <Text style={styles.check}>
          {mission.claimed ? '\u2611' : mission.completed ? '\u2705' : '\u25A1'}
        </Text>
        <Text style={styles.text} numberOfLines={1}>{text}</Text>
        <Text style={styles.progressText}>{mission.currentValue}/{mission.targetValue}</Text>
      </View>

      {!mission.completed && (
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.rewards}>
          {mission.rewardCoins > 0 && (
            <Text style={styles.reward}>&#x1F4B0;{mission.rewardCoins}</Text>
          )}
          {mission.rewardGems > 0 && (
            <Text style={styles.reward}>&#x1F48E;{mission.rewardGems}</Text>
          )}
        </View>

        {mission.completed && !mission.claimed && (
          <Pressable style={styles.claimButton} onPress={onClaim}>
            <Text style={styles.claimText}>受け取る</Text>
          </Pressable>
        )}
        {mission.claimed && (
          <Text style={styles.claimedText}>受取済み</Text>
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
  cardClaimed: {
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  check: {
    fontSize: 18,
  },
  text: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: THEME_COLORS.text,
  },
  progressText: {
    fontSize: 12,
    color: THEME_COLORS.textSecondary,
  },
  progressBar: {
    height: 6,
    backgroundColor: THEME_COLORS.progressBarBg,
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: THEME_COLORS.progressBar,
    borderRadius: 3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  rewards: {
    flexDirection: 'row',
    gap: 8,
  },
  reward: {
    fontSize: 13,
    color: THEME_COLORS.textSecondary,
  },
  claimButton: {
    backgroundColor: THEME_COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  claimText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  claimedText: {
    color: THEME_COLORS.textSecondary,
    fontSize: 12,
  },
});
