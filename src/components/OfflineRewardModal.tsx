import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { formatNumber, formatTime } from '../utils/format';
import { THEME_COLORS } from '../constants/colors';

export const OfflineRewardModal: React.FC = () => {
  const reward = useGameStore(s => s.pendingOfflineReward);
  const dismiss = useGameStore(s => s.dismissOfflineReward);

  if (!reward || reward.coins <= 0) return null;

  return (
    <Modal visible={true} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.emoji}>&#x1F319;</Text>
          <Text style={styles.title}>おかえりなさい！</Text>
          <Text style={styles.subtitle}>留守の間にスライムたちが{'\n'}頑張ってくれました！</Text>

          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>&#x23F1; 離れていた時間:</Text>
            <Text style={styles.timeValue}>{formatTime(reward.elapsedSeconds)}</Text>
          </View>

          <View style={styles.coinRow}>
            <Text style={styles.coinLabel}>&#x1F4B0; 獲得コイン:</Text>
            <Text style={styles.coinValue}>{formatNumber(reward.coins)}</Text>
          </View>

          <Pressable style={styles.doubleButton} onPress={() => dismiss(true)}>
            <Text style={styles.doubleText}>&#x1F4E2; 広告を見て2倍 → {formatNumber(reward.coins * 2)}</Text>
          </Pressable>

          <Pressable style={styles.normalButton} onPress={() => dismiss(false)}>
            <Text style={styles.normalText}>受け取る</Text>
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
  doubleButton: {
    backgroundColor: THEME_COLORS.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  doubleText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  normalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 12,
  },
  normalText: {
    color: THEME_COLORS.textSecondary,
    fontSize: 14,
  },
});
