import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useGameStore } from '../store/gameStore';
import { formatNumber, formatTime } from '../utils/format';
import { THEME_COLORS } from '../constants/colors';
import { SLIME_MASTER } from '../constants/slimes';
import { playOfflineRewardSound } from '../utils/sound';
import { showRewardedAd } from '../utils/admob';

export const OfflineRewardModal: React.FC = () => {
  const reward = useGameStore(s => s.pendingOfflineReward);
  const dismiss = useGameStore(s => s.dismissOfflineReward);
  const updateMissionProgress = useGameStore(s => s.updateMissionProgress);
  const sfxEnabled = useGameStore(s => s.settings.sfxEnabled);

  const handleDismiss = (doubleIt: boolean) => {
    if (sfxEnabled) playOfflineRewardSound();
    dismiss(doubleIt);
  };

  const handleWatchAd = () => {
    showRewardedAd(
      () => {
        // 視聴完了: 2倍付与 + ミッション進捗
        if (sfxEnabled) playOfflineRewardSound();
        updateMissionProgress('watch_ad', 1);
        dismiss(true);
      },
      () => {
        // 失敗時: 通常付与
        dismiss(false);
      }
    );
  };

  if (!reward || reward.coins <= 0) return null;

  return (
    <Modal visible={true} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.emoji}>{'\u{1F319}'}</Text>
          <Text style={styles.title}>{'\u304A\u304B\u3048\u308A\u306A\u3055\u3044\uFF01'}</Text>
          <Text style={styles.subtitle}>{'\u7559\u5B88\u306E\u9593\u306B\u30B9\u30E9\u30A4\u30E0\u305F\u3061\u304C'}{'\n'}{'\u9811\u5F35\u3063\u3066\u304F\u308C\u307E\u3057\u305F\uFF01'}</Text>

          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>{'\u23F1'} {'\u96E2\u308C\u3066\u3044\u305F\u6642\u9593'}:</Text>
            <Text style={styles.timeValue}>{formatTime(reward.elapsedSeconds)}</Text>
          </View>

          <View style={styles.coinRow}>
            <Text style={styles.coinLabel}>{'\u{1F4B0}'} {'\u7372\u5F97\u30B3\u30A4\u30F3'}:</Text>
            <Text style={styles.coinValue}>{formatNumber(reward.coins)}</Text>
          </View>

          {/* Offline spawned slimes section */}
          {reward.spawnedSlimes && reward.spawnedSlimes.length > 0 && (
            <View style={styles.spawnSection}>
              <Text style={styles.spawnTitle}>{'\u{1F331}'} {'\u7559\u5B88\u4E2D\u306B\u8D77\u304D\u305F\u3053\u3068'}</Text>
              {reward.spawnedSlimes.map((s, i) => {
                const master = SLIME_MASTER[s.masterId];
                const name = master ? master.name : s.masterId;
                if (s.isMutation) {
                  return (
                    <Text key={i} style={styles.spawnMutation}>
                      {'\u2728'} {'\u7A81\u7136\u5909\u7570\u304C\u767A\u751F\uFF01\u8679\u8272\u306E'}{name}{'\u304C\u73FE\u308C\u307E\u3057\u305F\uFF01'}
                    </Text>
                  );
                }
                return (
                  <Text key={i} style={styles.spawnNormal}>
                    {'\u{1F40C}'} {'\u65B0\u3057\u3044'}{name}{'\u304C\u3084\u3063\u3066\u304D\u307E\u3057\u305F\uFF01'}
                  </Text>
                );
              })}
            </View>
          )}

          {/* Prominent ad button with glow effect */}
          <View style={styles.doubleButtonContainer}>
            <View style={styles.doubleGlow} />
            <Pressable style={styles.doubleButton} onPress={handleWatchAd}>
              <Text style={styles.doubleEmoji}>{'\u{1F3AC}'}</Text>
              <View style={styles.doubleTextContainer}>
                <Text style={styles.doubleTitle}>{'\u5E83\u544A\u3092\u898B\u30662\u500D\uFF01'}</Text>
                <Text style={styles.doubleAmount}>{formatNumber(reward.coins * 2)} {'\u30B3\u30A4\u30F3'}</Text>
              </View>
            </Pressable>
            <View style={styles.doubleBadge}>
              <Text style={styles.doubleBadgeText}>x2</Text>
            </View>
          </View>

          <Pressable style={styles.normalButton} onPress={() => handleDismiss(false)}>
            <Text style={styles.normalText}>{formatNumber(reward.coins)} {'\u30B3\u30A4\u30F3\u3092\u53D7\u3051\u53D6\u308B'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 28,
    width: 300,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: THEME_COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  timeLabel: {
    fontSize: 13,
    color: THEME_COLORS.textSecondary,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME_COLORS.text,
  },
  coinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  coinLabel: {
    fontSize: 13,
    color: THEME_COLORS.textSecondary,
  },
  coinValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME_COLORS.coin,
  },
  doubleButtonContainer: {
    position: 'relative',
    width: '100%',
    marginTop: 20,
  },
  doubleGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 28,
    backgroundColor: '#FFD700',
    opacity: 0.3,
  },
  doubleButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  doubleEmoji: {
    fontSize: 24,
  },
  doubleTextContainer: {
    alignItems: 'flex-start',
  },
  doubleTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  doubleAmount: {
    color: '#FFF9C4',
    fontSize: 13,
    fontWeight: '600',
  },
  doubleBadge: {
    position: 'absolute',
    top: -8,
    right: -4,
    backgroundColor: '#F44336',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  doubleBadgeText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  spawnSection: {
    width: '100%',
    backgroundColor: '#F1F8E9',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  spawnTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME_COLORS.primary,
    marginBottom: 6,
  },
  spawnNormal: {
    fontSize: 12,
    color: THEME_COLORS.text,
    marginTop: 2,
    lineHeight: 18,
  },
  spawnMutation: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: 'bold',
    marginTop: 2,
    lineHeight: 18,
  },
  normalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 12,
  },
  normalText: {
    color: THEME_COLORS.textSecondary,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
