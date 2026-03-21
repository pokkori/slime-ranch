import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useGameStore } from '../../src/store/gameStore';
import { SHOP_ITEMS } from '../../src/constants/shop-items';
import { ShopItemCard } from '../../src/components/ShopItemCard';
import { CoinDisplay } from '../../src/components/CoinDisplay';
import { THEME_COLORS } from '../../src/constants/colors';
import { ShopCategory, ShopItem } from '../../src/types/shop';
import { playPurchaseSound } from '../../src/utils/sound';

const CATEGORIES: { key: ShopCategory; label: string; icon: string }[] = [
  { key: 'decoration', label: '装飾', icon: '🎨' },
  { key: 'background', label: '背景', icon: '🖼' },
  { key: 'booster', label: 'ブースター', icon: '⚡' },
  { key: 'expansion', label: '拡張', icon: '📐' },
];

export default function ShopScreen() {
  const [category, setCategory] = useState<ShopCategory>('decoration');
  const coins = useGameStore(s => s.coins);
  const gems = useGameStore(s => s.gems);
  const spendCoins = useGameStore(s => s.spendCoins);
  const spendGems = useGameStore(s => s.spendGems);
  const setDecoration = useGameStore(s => s.setDecoration);
  const setBackground = useGameStore(s => s.setBackground);
  const addBooster = useGameStore(s => s.addBooster);
  const ranch = useGameStore(s => s.ranch);
  const unlockSlot = useGameStore(s => s.unlockSlot);
  const sfxEnabled = useGameStore(s => s.settings.sfxEnabled);

  // Track purchased items locally (in a real app this would be persisted)
  const [purchasedItems, setPurchasedItems] = useState<Set<string>>(new Set());

  const filteredItems = useMemo(() =>
    SHOP_ITEMS.filter(item => item.category === category),
    [category]
  );

  const handlePurchase = (item: ShopItem) => {
    const cost = item.cost;
    const isCoin = item.costType === 'coin';

    if (isCoin ? coins < cost : gems < cost) {
      Alert.alert('残高不足', isCoin ? 'コインが足りません' : 'ジェムが足りません');
      return;
    }

    const success = isCoin ? spendCoins(cost) : spendGems(cost);
    if (!success) return;

    // Apply effect
    const effect = item.effect;
    switch (effect.type) {
      case 'decoration': {
        // Find first unlocked non-decorated slot
        const slot = ranch.slots.find(s => s.state === 'unlocked' && !s.decoration);
        if (slot) {
          setDecoration(slot.slotId, effect.decorationId);
        }
        break;
      }
      case 'background':
        setBackground(effect.theme);
        break;
      case 'coin_boost':
      case 'offline_boost':
        addBooster({
          type: effect.type,
          multiplier: effect.multiplier,
          expiresAt: new Date(Date.now() + effect.durationMinutes * 60000).toISOString(),
        });
        break;
      case 'auto_merge':
        addBooster({
          type: 'auto_merge',
          multiplier: 1,
          expiresAt: new Date(Date.now() + effect.durationMinutes * 60000).toISOString(),
        });
        break;
      case 'slot_unlock': {
        const locked = ranch.slots.find(s => s.state === 'locked');
        if (locked) unlockSlot(locked.slotId);
        break;
      }
      case 'max_slime_up':
        break;
    }

    if (sfxEnabled) playPurchaseSound();

    if (item.maxPurchase === 1) {
      setPurchasedItems(prev => new Set([...prev, item.itemId]));
    }
  };

  return (
    <View style={styles.container}>
      {/* Category tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabRow}>
        {CATEGORIES.map(cat => (
          <Pressable
            key={cat.key}
            style={[styles.tab, category === cat.key && styles.tabActive]}
            onPress={() => setCategory(cat.key)}
          >
            <Text style={[styles.tabText, category === cat.key && styles.tabTextActive]}>
              {cat.icon} {cat.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Items */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {filteredItems.map(item => (
          <ShopItemCard
            key={item.itemId}
            item={item}
            onPurchase={() => handlePurchase(item)}
            canAfford={item.costType === 'coin' ? coins >= item.cost : gems >= item.cost}
            alreadyPurchased={purchasedItems.has(item.itemId)}
          />
        ))}
      </ScrollView>

      {/* Ranch slot unlock section */}
      {category === 'expansion' && (
        <View style={styles.slotsSection}>
          <Text style={styles.slotsTitle}>牧場区画</Text>
          <View style={styles.slotsGrid}>
            {ranch.slots.map(slot => (
              <Pressable
                key={slot.slotId}
                style={[
                  styles.slotCell,
                  slot.state === 'unlocked' && styles.slotUnlocked,
                  slot.state === 'decorated' && styles.slotDecorated,
                ]}
                onPress={() => {
                  if (slot.state === 'locked' && coins >= slot.unlockCost) {
                    unlockSlot(slot.slotId);
                  }
                }}
              >
                {slot.state === 'locked' ? (
                  <Text style={styles.slotCost}>🔒{'\n'}{slot.unlockCost}</Text>
                ) : slot.decoration ? (
                  <Text style={styles.slotDeco}>✨</Text>
                ) : (
                  <Text style={styles.slotOpen}>✓</Text>
                )}
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME_COLORS.background },
  tabRow: { maxHeight: 48, paddingHorizontal: 8, paddingVertical: 8 },
  tab: {
    paddingHorizontal: 14, paddingVertical: 8, marginHorizontal: 4,
    borderRadius: 16, backgroundColor: THEME_COLORS.cardBg,
    borderWidth: 1, borderColor: THEME_COLORS.cardBorder,
  },
  tabActive: { backgroundColor: THEME_COLORS.primary, borderColor: THEME_COLORS.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: THEME_COLORS.text },
  tabTextActive: { color: '#FFF' },
  list: { flex: 1 },
  listContent: { padding: 12 },
  slotsSection: { padding: 12, borderTopWidth: 1, borderTopColor: THEME_COLORS.cardBorder },
  slotsTitle: { fontSize: 16, fontWeight: 'bold', color: THEME_COLORS.text, marginBottom: 8 },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  slotCell: {
    width: 70, height: 50, borderRadius: 8, backgroundColor: '#E0E0E0',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#BDBDBD',
  },
  slotUnlocked: { backgroundColor: '#C8E6C9', borderColor: THEME_COLORS.primary },
  slotDecorated: { backgroundColor: '#FFE0B2', borderColor: THEME_COLORS.accent },
  slotCost: { fontSize: 10, textAlign: 'center', color: THEME_COLORS.textSecondary },
  slotDeco: { fontSize: 18 },
  slotOpen: { fontSize: 16, color: THEME_COLORS.primary, fontWeight: 'bold' },
});
