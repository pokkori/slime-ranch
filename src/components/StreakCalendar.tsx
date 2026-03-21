import React from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { useGameStore } from '../store/gameStore';

const STREAK_REWARDS = [
  { day: 1, label: '🪙 100', coins: 100, gems: 0 },
  { day: 2, label: '🪙 200', coins: 200, gems: 0 },
  { day: 3, label: '💎 1',   coins: 0,   gems: 1 },
  { day: 4, label: '🪙 500', coins: 500, gems: 0 },
  { day: 5, label: '💎 2',   coins: 0,   gems: 2 },
  { day: 6, label: '🪙 1000', coins: 1000, gems: 0 },
  { day: 7, label: '💎 5 + ⭐スライム', coins: 0, gems: 5 },
];

interface Props { onClose: () => void; }

export const StreakCalendar: React.FC<Props> = ({ onClose }) => {
  const loginStreak = useGameStore(s => s.loginStreak);
  const streakRewardsClaimed = useGameStore(s => s.streakRewardsClaimed ?? []);
  const lastDate = useGameStore(s => s.lastLoginStreakDate ?? '');
  const gems = useGameStore(s => s.gems ?? 0);
  const dayInCycle = ((loginStreak - 1) % 7) + 1;

  const yesterday = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split("T")[0]; })();
  const today = new Date().toISOString().split("T")[0];
  const isStreakBroken = loginStreak === 0 || (lastDate !== yesterday && lastDate !== today);

  const handleClaim = (day: number) => {
    if (day !== dayInCycle) return;
    if (streakRewardsClaimed.includes(day)) return;
    const reward = STREAK_REWARDS.find(r => r.day === day);
    if (!reward) return;
    if (reward.coins > 0) {
      const addCoins = useGameStore.getState().addCoins;
      if (addCoins) addCoins(reward.coins);
    }
    if (reward.gems > 0) {
      useGameStore.setState(s => ({ gems: (s.gems ?? 0) + reward.gems }));
    }
    useGameStore.setState(s => ({
      streakRewardsClaimed: [...(s.streakRewardsClaimed ?? []), day],
    }));
    onClose();
  };

  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>🔥 {loginStreak}日連続ログイン！</Text>
          <View style={styles.grid}>
            {STREAK_REWARDS.map(r => (
              <Pressable
                key={r.day}
                style={[
                  styles.dayBox,
                  r.day < dayInCycle ? styles.claimed : null,
                  r.day === dayInCycle ? styles.today : null,
                  r.day > dayInCycle ? styles.locked : null,
                ]}
                onPress={() => handleClaim(r.day)}
              >
                <Text style={styles.dayNum}>DAY {r.day}</Text>
                <Text style={styles.reward}>{r.label}</Text>
                {r.day < dayInCycle && <Text style={styles.check}>✓</Text>}
              </Pressable>
            ))}
          </View>
          {isStreakBroken && gems >= 2 && (
            <Pressable
              style={{ backgroundColor: '#4a3a00', borderRadius: 10, padding: 10, marginTop: 8, alignItems: 'center' }}
              onPress={() => useGameStore.getState().recoverStreak?.()}
            >
              <Text style={{ color: '#FFD700', fontWeight: 'bold' }}>💎 2でストリーク回復</Text>
            </Pressable>
          )}
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
  card: { backgroundColor: '#1a1a2e', borderRadius: 20, padding: 20, width: '90%', maxWidth: 400 },
  title: { color: '#FFD700', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  dayBox: { width: 80, borderRadius: 10, padding: 8, alignItems: 'center', backgroundColor: '#2a2a4e' },
  claimed: { backgroundColor: '#2a4a2e', opacity: 0.7 },
  today: { backgroundColor: '#4a3a00', borderWidth: 2, borderColor: '#FFD700' },
  locked: { backgroundColor: '#2a2a4e', opacity: 0.5 },
  dayNum: { color: '#888', fontSize: 10 },
  reward: { color: '#FFF', fontSize: 11, textAlign: 'center', marginTop: 2 },
  check: { color: '#00FF88', fontSize: 16 },
  closeBtn: { marginTop: 16, backgroundColor: '#333', borderRadius: 10, padding: 12, alignItems: 'center' },
  closeTxt: { color: '#FFF', fontSize: 16 },
});
