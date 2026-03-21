import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Achievement } from '../types/mission';
import { THEME_COLORS } from '../constants/colors';

interface AchievementCardProps {
  achievement: Achievement;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({ achievement }) => {
  const progress = Math.min(achievement.currentValue / achievement.targetValue, 1);

  return (
    <View style={[styles.card, achievement.unlocked && styles.cardUnlocked]}>
      <View style={styles.iconContainer}>
        <Ionicons
          name={achievement.icon as any}
          size={24}
          color={achievement.unlocked ? THEME_COLORS.accent : THEME_COLORS.textSecondary}
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{achievement.title}</Text>
        <Text style={styles.description}>{achievement.description}</Text>

        {!achievement.unlocked && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        )}

        <View style={styles.rewards}>
          {achievement.rewardCoins > 0 && (
            <Text style={styles.reward}>&#x1F4B0;{achievement.rewardCoins}</Text>
          )}
          {achievement.rewardGems > 0 && (
            <Text style={styles.reward}>&#x1F48E;{achievement.rewardGems}</Text>
          )}
        </View>
      </View>

      {achievement.unlocked && (
        <Text style={styles.unlocked}>&#x2705;</Text>
      )}
      {!achievement.unlocked && (
        <Text style={styles.progressText}>{achievement.currentValue}/{achievement.targetValue}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: THEME_COLORS.cardBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: THEME_COLORS.cardBorder,
    alignItems: 'center',
  },
  cardUnlocked: {
    borderColor: THEME_COLORS.accent,
    backgroundColor: '#FFF8E1',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME_COLORS.text,
  },
  description: {
    fontSize: 12,
    color: THEME_COLORS.textSecondary,
    marginTop: 2,
  },
  progressBar: {
    height: 4,
    backgroundColor: THEME_COLORS.progressBarBg,
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: THEME_COLORS.accent,
    borderRadius: 2,
  },
  rewards: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  reward: {
    fontSize: 11,
    color: THEME_COLORS.textSecondary,
  },
  unlocked: {
    fontSize: 20,
    marginLeft: 8,
  },
  progressText: {
    fontSize: 11,
    color: THEME_COLORS.textSecondary,
    marginLeft: 8,
  },
});
