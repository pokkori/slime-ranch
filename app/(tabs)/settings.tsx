import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Pressable, Alert } from 'react-native';
import { useGameStore } from '../../src/store/gameStore';
import { THEME_COLORS } from '../../src/constants/colors';
import { formatNumber, formatTime } from '../../src/utils/format';

export default function SettingsScreen() {
  const settings = useGameStore(s => s.settings);
  const statistics = useGameStore(s => s.statistics);
  const updateSettings = useGameStore(s => s.updateSettings);
  const resetGame = useGameStore(s => s.resetGame);

  const handleReset = () => {
    Alert.alert(
      'データリセット',
      '全てのゲームデータが削除されます。この操作は元に戻せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'リセット',
          style: 'destructive',
          onPress: () => {
            resetGame();
            Alert.alert('完了', 'ゲームデータをリセットしました');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Sound & Haptics */}
      <Text style={styles.sectionTitle}>サウンド・操作</Text>
      <View style={styles.card}>
        <SettingRow
          label="&#x1F50A; BGM"
          value={settings.bgmEnabled}
          onToggle={(v) => updateSettings({ bgmEnabled: v })}
        />
        <SettingRow
          label="&#x1F50A; 効果音"
          value={settings.sfxEnabled}
          onToggle={(v) => updateSettings({ sfxEnabled: v })}
        />
        <SettingRow
          label="&#x1F4F3; 振動"
          value={settings.hapticsEnabled}
          onToggle={(v) => updateSettings({ hapticsEnabled: v })}
        />
      </View>

      {/* Notifications */}
      <Text style={styles.sectionTitle}>通知</Text>
      <View style={styles.card}>
        <SettingRow
          label="&#x1F514; 通知"
          value={settings.notificationsEnabled}
          onToggle={(v) => updateSettings({ notificationsEnabled: v })}
        />
      </View>

      {/* Statistics */}
      <Text style={styles.sectionTitle}>&#x1F4CA; 統計データ</Text>
      <View style={styles.card}>
        <StatRow label="総タップ数" value={formatNumber(statistics.totalTaps)} />
        <StatRow label="総合体回数" value={formatNumber(statistics.totalMerges)} />
        <StatRow label="累計コイン" value={formatNumber(statistics.totalCoinsEarned)} />
        <StatRow label="累計ジェム" value={formatNumber(statistics.totalGemsEarned)} />
        <StatRow label="最高Tier" value={`Tier ${statistics.highestTierReached}`} />
        <StatRow label="連続ログイン" value={`${statistics.currentLoginStreak}日`} />
        <StatRow label="最長連続ログイン" value={`${statistics.longestLoginStreak}日`} />
      </View>

      {/* Data management */}
      <Text style={styles.sectionTitle}>データ管理</Text>
      <View style={styles.card}>
        <Pressable style={styles.dangerButton} onPress={handleReset}>
          <Text style={styles.dangerText}>&#x1F504; データリセット</Text>
        </Pressable>
      </View>

      {/* Legal */}
      <Text style={styles.sectionTitle}>情報</Text>
      <View style={styles.card}>
        <Text style={styles.legalText}>&#x1F4DD; 利用規約</Text>
        <Text style={styles.legalText}>&#x1F512; プライバシーポリシー</Text>
        <Text style={styles.versionText}>スライム牧場 v1.0.0</Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function SettingRow({ label, value, onToggle }: { label: string; value: boolean; onToggle: (v: boolean) => void }) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#E0E0E0', true: THEME_COLORS.primary }}
        thumbColor="#FFF"
      />
    </View>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME_COLORS.background },
  content: { padding: 16 },
  sectionTitle: {
    fontSize: 14, fontWeight: 'bold', color: THEME_COLORS.textSecondary,
    marginTop: 16, marginBottom: 8, paddingHorizontal: 4,
  },
  card: {
    backgroundColor: THEME_COLORS.cardBg, borderRadius: 12, padding: 4,
    borderWidth: 1, borderColor: THEME_COLORS.cardBorder,
  },
  settingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
  },
  settingLabel: { fontSize: 15, color: THEME_COLORS.text },
  statRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10,
  },
  statLabel: { fontSize: 14, color: THEME_COLORS.textSecondary },
  statValue: { fontSize: 14, fontWeight: '600', color: THEME_COLORS.text },
  dangerButton: {
    paddingHorizontal: 14, paddingVertical: 14, alignItems: 'center',
  },
  dangerText: { fontSize: 15, color: THEME_COLORS.error, fontWeight: '600' },
  legalText: {
    fontSize: 14, color: THEME_COLORS.text, paddingHorizontal: 14, paddingVertical: 12,
  },
  versionText: {
    fontSize: 12, color: THEME_COLORS.textSecondary, textAlign: 'center',
    paddingVertical: 12,
  },
});
