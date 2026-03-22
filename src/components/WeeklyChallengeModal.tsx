import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { getCurrentWeeklyChallenge } from '../constants/weekly-challenge';
import { useGameStore } from '../store/gameStore';

interface Props { visible: boolean; onClose: () => void; }

export const WeeklyChallengeModal: React.FC<Props> = ({ visible, onClose }) => {
  const challenge = getCurrentWeeklyChallenge();
  const weeklyChallenge = useGameStore(s => s.weeklyChallenge);
  const addCoins = useGameStore(s => s.addCoins);

  if (!weeklyChallenge) return null;

  const currentValue =
    challenge.targetType === 'merge_count' ? weeklyChallenge.mergesThisWeek :
    challenge.targetType === 'discover_count' ? weeklyChallenge.discoversThisWeek :
    weeklyChallenge.coinsThisWeek;

  const progress = Math.min(1, currentValue / challenge.targetValue);
  const completed = currentValue >= challenge.targetValue;
  const claimed = weeklyChallenge.claimed;

  const handleClaim = () => {
    if (!completed || claimed) return;
    addCoins(challenge.rewardCoins);
    useGameStore.setState((s: any) => ({
      gems: (s.gems ?? 0) + challenge.rewardGems,
      weeklyChallenge: s.weeklyChallenge ? { ...s.weeklyChallenge, claimed: true } : null,
    }));
    onClose();
  };

  const now = new Date();
  const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
  const hoursLeft = daysUntilSunday * 24 - now.getHours();

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.badge}>⏰ 今週限定</Text>
          <Text style={styles.title}>週次チャレンジ</Text>
          <View style={[styles.slimeDot, { backgroundColor: challenge.challengeSlimeColor }]} />
          <Text style={styles.slimeName}>{challenge.challengeSlimeName}</Text>
          <Text style={styles.desc}>{challenge.description}</Text>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
          </View>
          <Text style={styles.progressText}>{currentValue} / {challenge.targetValue}</Text>
          <Text style={styles.timeLeft}>リセットまで約{hoursLeft}時間</Text>
          <Pressable
            style={[styles.claimBtn, (!completed || claimed) && styles.claimBtnDisabled]}
            onPress={handleClaim}
            disabled={!completed || claimed}
          >
            <Text style={styles.claimText}>
              {claimed ? '受取済み' : completed ? `🎉 受け取る (+${challenge.rewardGems}💎)` : 'チャレンジ中...'}
            </Text>
          </Pressable>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeTxt}>閉じる</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#1a1a2e', borderRadius: 20, padding: 24, width: '88%', maxWidth: 360, alignItems: 'center' },
  badge: { backgroundColor: '#FF6B35', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, color: '#FFF', fontWeight: 'bold', fontSize: 12, overflow: 'hidden' },
  title: { color: '#FFD700', fontSize: 22, fontWeight: 'bold', marginTop: 10 },
  slimeDot: { width: 60, height: 60, borderRadius: 30, marginTop: 16, borderWidth: 3, borderColor: '#FFD700' },
  slimeName: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginTop: 8 },
  desc: { color: '#CCC', fontSize: 13, textAlign: 'center', marginTop: 6 },
  progressBg: { width: '100%', height: 12, backgroundColor: '#333', borderRadius: 6, marginTop: 16, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 6 },
  progressText: { color: '#FFF', fontSize: 14, fontWeight: 'bold', marginTop: 6 },
  timeLeft: { color: '#FF9800', fontSize: 12, marginTop: 4 },
  claimBtn: { backgroundColor: '#4CAF50', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 16 },
  claimBtnDisabled: { backgroundColor: '#444' },
  claimText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  closeBtn: { marginTop: 12, padding: 8 },
  closeTxt: { color: '#888', fontSize: 14 },
});
