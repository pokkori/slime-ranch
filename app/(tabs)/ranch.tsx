import React, { useEffect, useRef, useCallback, useState } from 'react';
import { View, StyleSheet, Dimensions, Text, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useGameStore } from '../../src/store/gameStore';
import { SLIME_MASTER } from '../../src/constants/slimes';
import { BACKGROUND_COLORS, THEME_COLORS } from '../../src/constants/colors';
import { SlimeBlob } from '../../src/rendering/SlimeBlob';
import { CoinFloat } from '../../src/rendering/CoinFloat';
import { MergeEffect } from '../../src/rendering/MergeEffect';
import { CoinDisplay } from '../../src/components/CoinDisplay';
import { SlimeInfo } from '../../src/components/SlimeInfo';
import { OfflineRewardModal } from '../../src/components/OfflineRewardModal';
import { TutorialOverlay } from '../../src/components/TutorialOverlay';
import { canMerge } from '../../src/engine/merge-logic';
import { SlimeInstance } from '../../src/types/slime';
import { formatNumber } from '../../src/utils/format';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GROUND_Y = SCREEN_HEIGHT - 180;
const WALL_LEFT = 10;
const WALL_RIGHT = SCREEN_WIDTH - 10;
const MERGE_DISTANCE = 60; // distance threshold for drag-merge

export default function RanchScreen() {
  const slimes = useGameStore(s => s.slimes);
  const ranch = useGameStore(s => s.ranch);
  const floatingCoins = useGameStore(s => s.floatingCoins);
  const mergeAnimation = useGameStore(s => s.mergeAnimation);
  const tapSlime = useGameStore(s => s.tapSlime);
  const tryMerge = useGameStore(s => s.tryMerge);
  const completeMergeAnimation = useGameStore(s => s.completeMergeAnimation);
  const tickCoins = useGameStore(s => s.tickCoins);
  const clearFloatingCoin = useGameStore(s => s.clearFloatingCoin);
  const updateSlimePositions = useGameStore(s => s.updateSlimePositions);
  const coins = useGameStore(s => s.coins);
  const gems = useGameStore(s => s.gems);
  const settings = useGameStore(s => s.settings);

  const [selectedSlime, setSelectedSlime] = useState<SlimeInstance | null>(null);
  const [mergeTarget, setMergeTarget] = useState<string | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastTickRef = useRef(Date.now());
  const coinTickRef = useRef(Date.now());
  const draggedSlimeRef = useRef<string | null>(null);

  // Simple physics simulation
  const slimePhysicsRef = useRef<Map<string, { vx: number; vy: number }>>(new Map());

  const bgColors = BACKGROUND_COLORS[ranch.backgroundTheme] || BACKGROUND_COLORS.meadow;

  // Screen shake shared value for Tier 4+ merges
  const shakeX = useSharedValue(0);
  const shakeY = useSharedValue(0);

  const canvasShakeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shakeX.value },
      { translateY: shakeY.value },
    ],
  }));

  const triggerScreenShake = useCallback(() => {
    shakeX.value = withSequence(
      withTiming(6, { duration: 30 }),
      withTiming(-5, { duration: 30 }),
      withTiming(4, { duration: 30 }),
      withTiming(-3, { duration: 30 }),
      withTiming(2, { duration: 30 }),
      withTiming(0, { duration: 30 }),
    );
    shakeY.value = withSequence(
      withTiming(-4, { duration: 30 }),
      withTiming(3, { duration: 30 }),
      withTiming(-2, { duration: 30 }),
      withTiming(1, { duration: 30 }),
      withTiming(0, { duration: 40 }),
    );
  }, []);

  // Tier-aware haptic feedback
  const triggerMergeHaptic = useCallback((resultTier: number) => {
    if (!settings.hapticsEnabled) return;
    if (Platform.OS === 'web') return;
    try {
      if (resultTier >= 6) {
        // Legend: Heavy x2 + Success notification
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }, 100);
        setTimeout(() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 200);
      } else if (resultTier >= 5) {
        // Elder: Heavy + Success notification
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setTimeout(() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 100);
      } else if (resultTier >= 3) {
        // Teen+: Medium
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        // Normal: Light
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch {
      // Haptics not available
    }
  }, [settings.hapticsEnabled]);

  // Simple haptic for taps / splits
  const triggerHaptic = useCallback((type: 'light' | 'success') => {
    if (!settings.hapticsEnabled) return;
    if (Platform.OS === 'web') return;
    try {
      if (type === 'light') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      // Haptics not available
    }
  }, [settings.hapticsEnabled]);

  // Drag handlers
  const handleDragStart = useCallback((instanceId: string) => {
    draggedSlimeRef.current = instanceId;
    // Pause physics for dragged slime
    const physics = slimePhysicsRef.current.get(instanceId);
    if (physics) {
      physics.vx = 0;
      physics.vy = 0;
    }
  }, []);

  const handleDragMove = useCallback((instanceId: string, x: number, y: number) => {
    // Find nearest merge-compatible slime
    const currentSlimes = useGameStore.getState().slimes;
    const dragged = currentSlimes.find(s => s.instanceId === instanceId);
    if (!dragged) return;

    let bestId: string | null = null;
    let bestDist = MERGE_DISTANCE;

    for (const other of currentSlimes) {
      if (other.instanceId === instanceId || other.isMerging) continue;
      if (!canMerge(dragged, other)) continue;

      const dx = other.x - x;
      const dy = other.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bestDist) {
        bestDist = dist;
        bestId = other.instanceId;
      }
    }

    setMergeTarget(bestId);
  }, []);

  const handleDragEnd = useCallback((instanceId: string, x: number, y: number) => {
    draggedSlimeRef.current = null;

    const currentSlimes = useGameStore.getState().slimes;
    const dragged = currentSlimes.find(s => s.instanceId === instanceId);
    if (!dragged) {
      setMergeTarget(null);
      return;
    }

    // Find merge target
    let bestId: string | null = null;
    let bestDist = MERGE_DISTANCE;

    for (const other of currentSlimes) {
      if (other.instanceId === instanceId || other.isMerging) continue;
      if (!canMerge(dragged, other)) continue;

      const dx = other.x - x;
      const dy = other.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bestDist) {
        bestDist = dist;
        bestId = other.instanceId;
      }
    }

    if (bestId) {
      const target = currentSlimes.find(s => s.instanceId === bestId);
      const masterTarget = target ? SLIME_MASTER[target.masterId] : null;
      // The result tier is one above the current tier
      const resultTier = masterTarget ? Math.min(masterTarget.tier + 1, 6) : 1;

      const merged = tryMerge(instanceId, bestId);
      if (merged) {
        triggerMergeHaptic(resultTier);
        // Screen shake for Tier 4+ results
        if (resultTier >= 4) {
          triggerScreenShake();
        }
      }
    }

    setMergeTarget(null);
  }, [tryMerge, triggerMergeHaptic, triggerScreenShake]);

  // Physics update loop
  const updatePhysics = useCallback(() => {
    const now = Date.now();
    const dt = Math.min((now - lastTickRef.current) / 1000, 0.05);
    lastTickRef.current = now;

    const currentSlimes = useGameStore.getState().slimes;
    if (currentSlimes.length === 0) {
      animationRef.current = requestAnimationFrame(updatePhysics);
      return;
    }

    const updates: Array<{ id: string; x: number; y: number }> = [];
    const physics = slimePhysicsRef.current;

    // Initialize physics for new slimes
    for (const s of currentSlimes) {
      if (!physics.has(s.instanceId)) {
        physics.set(s.instanceId, {
          vx: (Math.random() - 0.5) * 60,
          vy: 0,
        });
      }
    }

    // Clean up removed slimes
    for (const key of physics.keys()) {
      if (!currentSlimes.find(s => s.instanceId === key)) {
        physics.delete(key);
      }
    }

    // Update each slime
    for (const slime of currentSlimes) {
      if (slime.isMerging) continue;
      // Skip physics for dragged slime
      if (draggedSlimeRef.current === slime.instanceId) continue;

      const master = SLIME_MASTER[slime.masterId];
      if (!master) continue;

      const p = physics.get(slime.instanceId)!;
      const radius = master.baseRadius;

      p.vy += 400 * dt;
      p.vx *= 0.99;
      p.vy *= 0.99;
      p.vx += (Math.random() - 0.5) * 20 * dt;

      const speedMul = master.ability === 'speedy' ? 2 : 1;

      let newX = slime.x + p.vx * dt * speedMul;
      let newY = slime.y + p.vy * dt * speedMul;

      if (newX - radius < WALL_LEFT) {
        newX = WALL_LEFT + radius;
        p.vx = Math.abs(p.vx) * 0.6;
      }
      if (newX + radius > WALL_RIGHT) {
        newX = WALL_RIGHT - radius;
        p.vx = -Math.abs(p.vx) * 0.6;
      }
      if (newY + radius > GROUND_Y) {
        newY = GROUND_Y - radius;
        p.vy = -Math.abs(p.vy) * 0.5;
        if (Math.abs(p.vy) < 10) {
          p.vy = -Math.random() * 30 - 10;
        }
      }
      if (newY - radius < 80) {
        newY = 80 + radius;
        p.vy = Math.abs(p.vy) * 0.3;
      }

      updates.push({ id: slime.instanceId, x: newX, y: newY });
    }

    // Slime-slime collisions (no auto-merge, collisions only)
    for (let i = 0; i < currentSlimes.length; i++) {
      for (let j = i + 1; j < currentSlimes.length; j++) {
        const a = currentSlimes[i];
        const b = currentSlimes[j];
        if (a.isMerging || b.isMerging) continue;
        // Skip collision for dragged slime
        if (draggedSlimeRef.current === a.instanceId || draggedSlimeRef.current === b.instanceId) continue;

        const masterA = SLIME_MASTER[a.masterId];
        const masterB = SLIME_MASTER[b.masterId];
        if (!masterA || !masterB) continue;

        const ua = updates.find(u => u.id === a.instanceId);
        const ub = updates.find(u => u.id === b.instanceId);
        const ax = ua?.x ?? a.x;
        const ay = ua?.y ?? a.y;
        const bx = ub?.x ?? b.x;
        const by = ub?.y ?? b.y;

        const dx = bx - ax;
        const dy = by - ay;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = masterA.baseRadius + masterB.baseRadius;

        if (dist < minDist && dist > 0) {
          const overlap = minDist - dist;
          const nx = dx / dist;
          const ny = dy / dist;

          const uaRef = updates.find(u => u.id === a.instanceId);
          const ubRef = updates.find(u => u.id === b.instanceId);
          if (uaRef) {
            uaRef.x -= nx * overlap * 0.5;
            uaRef.y -= ny * overlap * 0.5;
          }
          if (ubRef) {
            ubRef.x += nx * overlap * 0.5;
            ubRef.y += ny * overlap * 0.5;
          }

          const pa = physics.get(a.instanceId);
          const pb = physics.get(b.instanceId);
          if (pa && pb) {
            const relVx = pb.vx - pa.vx;
            const relVy = pb.vy - pa.vy;
            const dot = relVx * nx + relVy * ny;
            if (dot < 0) {
              const bounce = 0.5;
              pa.vx += dot * nx * bounce;
              pa.vy += dot * ny * bounce;
              pb.vx -= dot * nx * bounce;
              pb.vy -= dot * ny * bounce;
            }
          }
        }
      }
    }

    if (updates.length > 0) {
      updateSlimePositions(updates);
    }

    // Coin tick every second
    if (now - coinTickRef.current >= 1000) {
      coinTickRef.current = now;
      tickCoins();
    }

    animationRef.current = requestAnimationFrame(updatePhysics);
  }, []);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(updatePhysics);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [updatePhysics]);

  const handleTap = useCallback((instanceId: string) => {
    tapSlime(instanceId);
    triggerHaptic('light');
  }, [tapSlime, triggerHaptic]);

  const handleLongPress = useCallback((instanceId: string) => {
    const slime = useGameStore.getState().slimes.find(s => s.instanceId === instanceId);
    if (slime) setSelectedSlime(slime);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColors.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>スライム牧場</Text>
          <CoinDisplay />
        </View>

        {/* Ranch canvas with screen shake support */}
        <Animated.View style={[styles.canvas, { backgroundColor: bgColors.bottom }, canvasShakeStyle]}>
          {/* Ground */}
          <View style={[styles.ground, { backgroundColor: bgColors.ground, top: GROUND_Y - 80 }]}>
            <View style={styles.grassRow}>
              {['\u{1F33F}','\u{1F338}','\u{1F344}','\u26F2','\u{1F33F}','\u{1F338}','\u{1F344}','\u{1F33F}'].map((emoji, i) => (
                <Text key={i} style={styles.grassEmoji}>{emoji}</Text>
              ))}
            </View>
          </View>

          {/* Merge target highlight */}
          {mergeTarget && (() => {
            const target = slimes.find(s => s.instanceId === mergeTarget);
            if (!target) return null;
            const master = SLIME_MASTER[target.masterId];
            if (!master) return null;
            return (
              <View style={[styles.mergeHighlight, {
                left: target.x - master.baseRadius - 8,
                top: target.y - master.baseRadius - 8,
                width: (master.baseRadius + 8) * 2,
                height: (master.baseRadius + 8) * 2,
                borderRadius: master.baseRadius + 8,
              }]} />
            );
          })()}

          {/* Slimes */}
          {slimes.map(slime => (
            <SlimeBlob
              key={slime.instanceId}
              slime={slime}
              onTap={handleTap}
              onLongPress={handleLongPress}
              onDragStart={handleDragStart}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
            />
          ))}

          {/* Floating coins */}
          {floatingCoins.map(coin => (
            <CoinFloat
              key={coin.id}
              x={coin.x}
              y={coin.y}
              value={coin.value}
              onComplete={() => clearFloatingCoin(coin.id)}
            />
          ))}

          {/* Merge effect */}
          {mergeAnimation && (
            <MergeEffect
              resultMasterId={mergeAnimation.resultMasterId}
              midX={mergeAnimation.midX}
              midY={mergeAnimation.midY}
              isRare={mergeAnimation.isRare}
              onComplete={completeMergeAnimation}
            />
          )}
        </Animated.View>

        {/* Status bar */}
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>
            {'\u{1F7E2}'} {slimes.length}/{ranch.maxSlimes}
          </Text>
          <Text style={styles.statusText}>
            {'\u{1F4B0}'} {formatNumber(coins)}
          </Text>
        </View>

        {/* Tutorial overlay */}
        <TutorialOverlay />

        {/* Offline reward modal */}
        <OfflineRewardModal />

        {/* Slime info popup */}
        <SlimeInfo
          slime={selectedSlime}
          visible={!!selectedSlime}
          onClose={() => setSelectedSlime(null)}
        />
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: THEME_COLORS.headerBg,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  canvas: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  ground: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 200,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  grassRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingHorizontal: 10,
  },
  grassEmoji: {
    fontSize: 18,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  statusText: {
    fontSize: 12,
    color: THEME_COLORS.textSecondary,
  },
  mergeHighlight: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255,215,0,0.15)',
    zIndex: 0,
  },
});
