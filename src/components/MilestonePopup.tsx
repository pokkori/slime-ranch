import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { MILESTONES, Milestone } from '../constants/milestones';
import { THEME_COLORS } from '../constants/colors';

interface MilestonePopupProps {
  rank: number | null;
  onClose: () => void;
  onShare?: () => void;
}

export const MilestonePopup: React.FC<MilestonePopupProps> = ({ rank, onClose, onShare }) => {
  const milestone = rank !== null ? MILESTONES.find(m => m.rank === rank) : null;

  const scale = useSharedValue(0);
  const borderOpacity = useSharedValue(0);
  const rewardY = useSharedValue(30);
  const rewardOpacity = useSharedValue(0);

  useEffect(() => {
    if (milestone) {
      scale.value = withSpring(1, { damping: 8, stiffness: 100 });
      borderOpacity.value = withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0.5, { duration: 500 }),
        withTiming(1, { duration: 500 }),
      );
      rewardY.value = withDelay(400, withSpring(0, { damping: 10 }));
      rewardOpacity.value = withDelay(400, withTiming(1, { duration: 300 }));
    } else {
      scale.value = 0;
      borderOpacity.value = 0;
      rewardY.value = 30;
      rewardOpacity.value = 0;
    }
  }, [milestone]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const borderStyle = useAnimatedStyle(() => ({
    opacity: borderOpacity.value,
  }));

  const rewardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: rewardY.value }],
    opacity: rewardOpacity.value,
  }));

  if (!milestone) return null;

  const rankEmojis = ['\u{1F331}', '\u{1F33F}', '\u{1F333}', '\u2728', '\u{1F451}', '\u{1F308}'];
  const rankEmoji = rankEmojis[milestone.rank - 1] || '\u2B50';

  return (
    <Modal visible={true} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, cardStyle]}>
          {/* Gold border glow */}
          <Animated.View style={[styles.goldBorder, borderStyle]} />

          <Text style={styles.rankUpText}>RANK UP!</Text>
          <Text style={styles.emoji}>{rankEmoji}</Text>
          <Text style={styles.rankName}>{milestone.name}</Text>
          <Text style={styles.rankNumber}>ランク {milestone.rank}</Text>

          <Animated.View style={[styles.rewardBox, rewardStyle]}>
            <Text style={styles.rewardLabel}>{'\u{1F381}'} 報酬</Text>
            <Text style={styles.rewardText}>{milestone.rewardDescription}</Text>
          </Animated.View>

          {onShare && (
            <Pressable style={styles.shareButton} onPress={() => { onShare(); onClose(); }}>
              <Text style={styles.shareText}>🎉 シェアする</Text>
            </Pressable>
          )}

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>OK!</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 32,
    width: 300,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  goldBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: '#FFD700',
  },
  rankUpText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: 4,
    marginBottom: 8,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  rankName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME_COLORS.text,
    marginBottom: 4,
  },
  rankNumber: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
    marginBottom: 16,
  },
  rewardBox: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  rewardLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 4,
  },
  rewardText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME_COLORS.text,
  },
  shareButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 10,
  },
  shareText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  closeButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 24,
  },
  closeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
});
