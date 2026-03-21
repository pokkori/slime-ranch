import React, { useEffect, useRef, useCallback, useState } from 'react';
import { View, StyleSheet, Dimensions, Text, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useGameStore } from '../../src/store/gameStore';
import { SLIME_MASTER } from '../../src/constants/slimes';
import { MILESTONES } from '../../src/constants/milestones';
import { BACKGROUND_COLORS, THEME_COLORS } from '../../src/constants/colors';
import { SlimeBlob } from '../../src/rendering/SlimeBlob';
import { CoinFloat } from '../../src/rendering/CoinFloat';
import { MergeEffect } from '../../src/rendering/MergeEffect';
import { CoinDisplay } from '../../src/components/CoinDisplay';
import { SlimeInfo } from '../../src/components/SlimeInfo';
import { OfflineRewardModal } from '../../src/components/OfflineRewardModal';
import { TutorialOverlay } from '../../src/components/TutorialOverlay';
import { MilestonePopup } from '../../src/components/MilestonePopup';
import { canMerge, findMergeGroup, MERGE_DISTANCE } from '../../src/engine/merge-logic';
import { SlimeInstance } from '../../src/types/slime';
import { formatNumber } from '../../src/utils/format';
import {
  playMergeSound, playCoinSound, playSplitSound, setSfxVolume,
  startBGM, stopBGM, setBgmVolume, playComboSound,
} from '../../src/utils/sound';
import { generateShareCard, shareCard } from '../../src/utils/share-card';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GROUND_Y = SCREEN_HEIGHT - 180;
const WALL_LEFT = 10;
const WALL_RIGHT = SCREEN_WIDTH - 10;

const AUTO_SPAWN_INTERVAL_MS = 30000; // 30 seconds base

export default function RanchScreen() {
  const slimes = useGameStore(s => s.slimes);
  const ranch = useGameStore(s => s.ranch);
  const floatingCoins = useGameStore(s => s.floatingCoins);
  const mergeAnimation = useGameStore(s => s.mergeAnimation);
  const tapSlime = useGameStore(s => s.tapSlime);
  const tryMerge = useGameStore(s => s.tryMerge);
  const tryMultiMerge = useGameStore(s => s.tryMultiMerge);
  const completeMergeAnimation = useGameStore(s => s.completeMergeAnimation);
  const tickCoins = useGameStore(s => s.tickCoins);
  const clearFloatingCoin = useGameStore(s => s.clearFloatingCoin);
  const updateSlimePositions = useGameStore(s => s.updateSlimePositions);
  const autoSpawnSlime = useGameStore(s => s.autoSpawnSlime);
  const coins = useGameStore(s => s.coins);
  const gems = useGameStore(s => s.gems);
  const settings = useGameStore(s => s.settings);
  const ranchRank = useGameStore(s => s.ranchRank);
  const pendingMilestoneRank = useGameStore(s => s.pendingMilestoneRank);
  const dismissMilestone = useGameStore(s => s.dismissMilestone);
  const comboCounter = useGameStore(s => s.comboCounter);
  const flashActive = useGameStore(s => s.flashActive);
  const encyclopedia = useGameStore(s => s.encyclopedia);
  const todayMergeCount = useGameStore(s => s.todayMergeCount);

  // Sync SE volume from settings on mount / change
  useEffect(() => {
    setSfxVolume(settings.sfxVolume);
  }, [settings.sfxVolume]);

  // Sync BGM volume
  useEffect(() => {
    setBgmVolume(settings.bgmVolume);
  }, [settings.bgmVolume]);

  // BGM: start on foreground, stop on background
  useEffect(() => {
    if (settings.bgmEnabled) {
      startBGM(ranch.backgroundTheme);
    } else {
      stopBGM();
    }
    return () => {
      stopBGM();
    };
  }, [settings.bgmEnabled, ranch.backgroundTheme]);

  const allMissionBonusClaimed = useGameStore(s => s.allMissionBonusClaimed);
  const [showMissionComplete, setShowMissionComplete] = useState(false);
  const prevAllClaimedRef = useRef(false);

  const [selectedSlime, setSelectedSlime] = useState<SlimeInstance | null>(null);
  const [mergeTarget, setMergeTarget] = useState<string | null>(null);
  const [comboDisplay, setComboDisplay] = useState<{ level: number; visible: boolean }>({ level: 0, visible: false });
  const [flash, setFlash] = useState(false);
  const animationRef = useRef<number | null>(null);
  const lastTickRef = useRef(Date.now());
  const coinTickRef = useRef(Date.now());
  const autoSpawnTickRef = useRef(Date.now());
  const draggedSlimeRef = useRef<string | null>(null);

  // Simple physics simulation
  const slimePhysicsRef = useRef<Map<string, { vx: number; vy: number }>>(new Map());

  const bgColors = BACKGROUND_COLORS[ranch.backgroundTheme] || BACKGROUND_COLORS.meadow;

  // 全ミッション達成フルスクリーン演出 (R7)
  useEffect(() => {
    if (allMissionBonusClaimed && !prevAllClaimedRef.current) {
      setShowMissionComplete(true);
      const timer = setTimeout(() => setShowMissionComplete(false), 3000);
      return () => clearTimeout(timer);
    }
    prevAllClaimedRef.current = allMissionBonusClaimed;
  }, [allMissionBonusClaimed]);

  // Flash effect for 5-match
  useEffect(() => {
    if (flashActive) {
      setFlash(true);
      const timer = setTimeout(() => {
        setFlash(false);
        useGameStore.setState({ flashActive: false });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [flashActive]);

  // Screen shake shared value for Tier 4+ merges
  const shakeX = useSharedValue(0);
  const shakeY = useSharedValue(0);

  // COMBO popup shared values
  const comboScale = useSharedValue(0);
  const comboOpacity = useSharedValue(0);

  // Rank scale animation for rank-up (R8)
  const rankScaleAnim = useSharedValue(1);

  const canvasShakeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shakeX.value },
      { translateY: shakeY.value },
    ],
  }));

  const comboPopupStyle = useAnimatedStyle(() => ({
    transform: [{ scale: comboScale.value }],
    opacity: comboOpacity.value,
  }));

  const rankAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rankScaleAnim.value }],
  }));

  // Rank-up scale animation (R8)
  useEffect(() => {
    if (pendingMilestoneRank && pendingMilestoneRank > 0) {
      rankScaleAnim.value = withSequence(
        withTiming(1.4, { duration: 200 }),
        withSpring(1, { damping: 10, stiffness: 200 }),
      );
    }
  }, [pendingMilestoneRank]);

  // COMBO popup animation effect (triggers when comboDisplay level >= 3)
  useEffect(() => {
    if (comboDisplay.visible && comboDisplay.level >= 3) {
      comboScale.value = 0;
      comboOpacity.value = 1;
      comboScale.value = withSequence(
        withSpring(1.4, { damping: 6, stiffness: 200 }),
        withSpring(1.0, { damping: 8, stiffness: 150 }),
      );
      comboOpacity.value = withDelay(800, withTiming(0, { duration: 400 }));
    }
  }, [comboDisplay]);

  // todayMergeCount badge spring animation (R10)
  const mergeCountScale = useSharedValue(1);
  useEffect(() => {
    if (todayMergeCount > 0) {
      mergeCountScale.value = withSequence(
        withSpring(1.4, { damping: 4, stiffness: 300 }),
        withSpring(1.0, { damping: 10, stiffness: 200 }),
      );
    }
  }, [todayMergeCount]);

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
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }, 100);
        setTimeout(() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 200);
      } else if (resultTier >= 5) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setTimeout(() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 100);
      } else if (resultTier >= 3) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
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

  // Combo chain helper
  const performChainMerge = useCallback((resultInstanceId: string, chainLevel: number) => {
    if (chainLevel >= 3) return; // Max 3 chains

    setTimeout(() => {
      const state = useGameStore.getState();
      const resultSlime = state.slimes.find(s => s.instanceId === resultInstanceId);
      if (!resultSlime) return;

      const group = findMergeGroup(state.slimes, resultSlime, resultSlime.x, resultSlime.y);
      if (group) {
        const midX = resultSlime.x;
        const midY = resultSlime.y;
        const master = SLIME_MASTER[group.resultMasterId];
        const resultTier = master ? master.tier : 1;

        useGameStore.getState().tryMultiMerge(group, midX, midY);
        useGameStore.setState({ comboCounter: chainLevel + 1 });

        // Show combo display
        setComboDisplay({ level: chainLevel + 1, visible: true });
        setTimeout(() => setComboDisplay(prev => ({ ...prev, visible: false })), 1000);

        if (settings.sfxEnabled) {
          playComboSound(chainLevel + 1);
          playMergeSound(resultTier);
        }
        triggerMergeHaptic(resultTier);
        if (resultTier >= 4) triggerScreenShake();

        // Check for further chains
        const newState = useGameStore.getState();
        const newResultSlime = newState.slimes.find(s => {
          const m = SLIME_MASTER[s.masterId];
          return m && m.colorFamily === master?.colorFamily && m.tier === master?.tier && s.isNew;
        });
        if (newResultSlime) {
          performChainMerge(newResultSlime.instanceId, chainLevel + 1);
        }
      }
    }, 400);
  }, [settings.sfxEnabled, triggerMergeHaptic, triggerScreenShake]);

  // Drag handlers
  const handleDragStart = useCallback((instanceId: string) => {
    draggedSlimeRef.current = instanceId;
    const physics = slimePhysicsRef.current.get(instanceId);
    if (physics) {
      physics.vx = 0;
      physics.vy = 0;
    }
  }, []);

  const handleDragMove = useCallback((instanceId: string, x: number, y: number) => {
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

    // First: try 3+ match merge
    const group = findMergeGroup(currentSlimes, dragged, x, y);
    if (group) {
      const midX = x;
      const midY = y;
      const master = SLIME_MASTER[group.resultMasterId];
      const resultTier = master ? master.tier : 1;

      const merged = tryMultiMerge(group, midX, midY);
      if (merged) {
        useGameStore.setState({ comboCounter: 1 });

        // Show combo display for 3-match
        setComboDisplay({ level: 1, visible: true });
        setTimeout(() => setComboDisplay(prev => ({ ...prev, visible: false })), 1000);

        triggerMergeHaptic(resultTier);
        if (settings.sfxEnabled) {
          playComboSound(1);
          playMergeSound(resultTier);
        }
        if (resultTier >= 4 || group.is5Match) {
          triggerScreenShake();
        }

        // Check for chain merges
        setTimeout(() => {
          const newState = useGameStore.getState();
          const newResultSlime = newState.slimes.find(s => {
            const m = SLIME_MASTER[s.masterId];
            return m && m.colorFamily === master?.colorFamily && m.tier === master?.tier && s.isNew;
          });
          if (newResultSlime) {
            performChainMerge(newResultSlime.instanceId, 1);
          }
        }, 300);
      }
      setMergeTarget(null);
      return;
    }

    // Fallback: standard 1:1 merge
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
      const resultTier = masterTarget ? Math.min(masterTarget.tier + 1, 6) : 1;

      const merged = tryMerge(instanceId, bestId);
      if (merged) {
        useGameStore.setState({ comboCounter: 0 });
        triggerMergeHaptic(resultTier);
        if (settings.sfxEnabled) playMergeSound(resultTier);
        if (resultTier >= 4) {
          triggerScreenShake();
        }
      }
    }

    setMergeTarget(null);
  }, [tryMerge, tryMultiMerge, triggerMergeHaptic, triggerScreenShake, performChainMerge]);

  // Calculate spawn rate bonus from decorations
  const getSpawnRateBonus = useCallback(() => {
    let bonus = 1.0;
    for (const slot of useGameStore.getState().ranch.slots) {
      if (slot.bonus?.type === 'spawn_rate') {
        bonus *= slot.bonus.multiplier;
      }
    }
    return bonus;
  }, []);

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

    // Slime-slime collisions
    for (let i = 0; i < currentSlimes.length; i++) {
      for (let j = i + 1; j < currentSlimes.length; j++) {
        const a = currentSlimes[i];
        const b = currentSlimes[j];
        if (a.isMerging || b.isMerging) continue;
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
      const earned = tickCoins();
      if (earned > 0 && useGameStore.getState().settings.sfxEnabled) {
        playCoinSound();
      }
    }

    // Auto-spawn check (Improvement 6)
    const spawnBonus = getSpawnRateBonus();
    const adjustedInterval = AUTO_SPAWN_INTERVAL_MS / spawnBonus;
    if (now - autoSpawnTickRef.current >= adjustedInterval) {
      autoSpawnTickRef.current = now;
      autoSpawnSlime();
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
    if (settings.sfxEnabled) playSplitSound();
  }, [tapSlime, triggerHaptic, settings.sfxEnabled]);

  const handleLongPress = useCallback((instanceId: string) => {
    const slime = useGameStore.getState().slimes.find(s => s.instanceId === instanceId);
    if (slime) setSelectedSlime(slime);
  }, []);

  // Share card handler (R7: todayMergeCount 型安全化)
  const handleShareCard = useCallback(async () => {
    const state = useGameStore.getState();
    const discoveredCount = state.encyclopedia.filter(e => e.discovered).length;
    const totalCount = state.encyclopedia.length;
    const todayMergeCount = state.todayMergeCount ?? 0;

    const dataUrl = await generateShareCard({
      slimes: state.slimes,
      backgroundTheme: state.ranch.backgroundTheme,
      ranchRank: state.ranchRank,
      discoveredCount,
      totalCount,
      highestTierReached: state.statistics.highestTierReached,
      todayMergeCount,
      todayCoins: state.coins,
    });

    const mergeText = todayMergeCount > 0 ? ` 今日の合体: ${todayMergeCount}回` : '';
    const text = `スライム牧場 🐌 ランク${state.ranchRank} | 図鑑 ${discoveredCount}/${totalCount}種${mergeText} #スライム牧場 #放置ゲーム`;

    if (Platform.OS !== 'web') {
      // ネイティブ: generateShareCardはnullを返すが、shareCardはnullでも対応
      await shareCard(dataUrl ?? '', text);
    } else if (dataUrl) {
      await shareCard(dataUrl, text);
    }
  }, []);

  // Milestone progress calculation
  const currentMilestone = MILESTONES.find(m => m.rank === ranchRank);
  const nextMilestone = MILESTONES.find(m => m.rank === ranchRank + 1);
  const discoveredCount = encyclopedia.filter(e => e.discovered).length;

  // Calculate progress to next rank
  let progressPercent = 100;
  if (nextMilestone) {
    if (nextMilestone.condition === 'first_merge') {
      const state = useGameStore.getState();
      progressPercent = state.statistics.totalMerges >= 1 ? 100 : 0;
    } else if (nextMilestone.condition === 'discover_5') {
      progressPercent = Math.min(100, (discoveredCount / 5) * 100);
    } else if (nextMilestone.condition === 'tier3_owned') {
      const hasTier3 = slimes.some(s => { const m = SLIME_MASTER[s.masterId]; return m && m.tier >= 3; });
      progressPercent = hasTier3 ? 100 : 0;
    } else if (nextMilestone.condition === 'discover_15') {
      progressPercent = Math.min(100, (discoveredCount / 15) * 100);
    } else if (nextMilestone.condition === 'tier5_owned') {
      const hasTier5 = slimes.some(s => { const m = SLIME_MASTER[s.masterId]; return m && m.tier >= 5; });
      progressPercent = hasTier5 ? 100 : 0;
    } else if (nextMilestone.condition === 'complete_all') {
      progressPercent = Math.min(100, (discoveredCount / 36) * 100);
    }
  }

  const rankEmojis = ['\u2B50', '\u{1F331}', '\u{1F33F}', '\u{1F333}', '\u2728', '\u{1F451}', '\u{1F308}'];
  const rankEmoji = rankEmojis[ranchRank] || '\u2B50';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColors.top }]}>
        {/* Header with rank badge and share button */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Animated.Text style={[styles.rankBadge, rankAnimStyle]}>
              {`\u30E9\u30F3\u30AF ${ranchRank} ${ranchRank >= 10 ? '\u2B50' : ranchRank >= 5 ? '\u{1F31F}' : ''}`}
            </Animated.Text>
            <View>
              <Text style={styles.title}>{'\u30B9\u30E9\u30A4\u30E0\u7267\u5834'}</Text>
              {currentMilestone && (
                <Text style={styles.rankName}>{currentMilestone.name}</Text>
              )}
              <Text style={styles.todayMerge}>{`\u4ECA\u65E5\u306E\u5408\u4F53: ${todayMergeCount}\u56DE`}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Pressable style={styles.shareBtn} onPress={handleShareCard}>
              <Text style={styles.shareBtnText}>{'\u{1F4F7}'}</Text>
            </Pressable>
            <CoinDisplay />
          </View>
        </View>
        {todayMergeCount > 0 && (
          <Animated.View style={[useAnimatedStyle(() => ({ transform: [{ scale: mergeCountScale.value }] })), styles.mergeCountBadge]}>
            <Text style={styles.mergeCountText}>{`\u2728\u4ECA\u65E5\u306E\u5408\u4F53: ${todayMergeCount}\u56DE`}</Text>
          </Animated.View>
        )}

        {/* Rank progress bar */}
        {nextMilestone && (
          <View style={styles.rankProgressContainer}>
            <Text style={styles.rankProgressLabel}>
              {'\u6B21'}: {nextMilestone.name}
            </Text>
            <View style={styles.rankProgressBg}>
              <View style={[styles.rankProgressFill, { width: `${progressPercent}%` }]} />
            </View>
          </View>
        )}

        {/* Ranch canvas with screen shake support */}
        <Animated.View style={[styles.canvas, { backgroundColor: bgColors.bottom }, canvasShakeStyle]}>
          {/* 5-match flash overlay */}
          {flash && <View style={styles.flashOverlay} />}

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

          {/* Combo counter display */}
          {comboDisplay.visible && comboDisplay.level > 0 && comboDisplay.level < 3 && (
            <View style={styles.comboContainer}>
              <Text style={styles.comboText}>COMBO x{comboDisplay.level + 1}!</Text>
            </View>
          )}
          {comboDisplay.level >= 3 && (
            <Animated.View style={[styles.comboContainer, comboPopupStyle]}>
              <Text style={styles.comboTextBig}>COMBO x{comboDisplay.level + 1}!</Text>
            </Animated.View>
          )}

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

        {/* 全ミッション達成フルスクリーン演出 (R7) */}
        {showMissionComplete && (
          <Animated.View style={styles.missionCompleteOverlay}>
            <Text style={styles.missionCompleteText}>🎊 全ミッション達成！</Text>
            <Text style={styles.missionCompleteGems}>+10 💎</Text>
          </Animated.View>
        )}

        {/* Tutorial overlay */}
        <TutorialOverlay />

        {/* Offline reward modal */}
        <OfflineRewardModal />

        {/* Milestone popup */}
        <MilestonePopup
          rank={pendingMilestoneRank}
          onClose={dismissMilestone}
          onShare={handleShareCard}
        />

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
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: THEME_COLORS.headerBg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rankBadge: {
    fontSize: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  rankName: {
    fontSize: 11,
    color: '#FFD700',
    fontWeight: '600',
  },
  todayMerge: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginTop: 1,
  },
  mergeCountBadge: {
    backgroundColor: 'rgba(255,215,0,0.2)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.5)',
    alignSelf: 'center',
    marginBottom: 2,
  },
  mergeCountText: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '700',
  },
  shareBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareBtnText: {
    fontSize: 16,
  },
  rankProgressContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  rankProgressLabel: {
    fontSize: 10,
    color: '#FFF',
    marginBottom: 2,
  },
  rankProgressBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  rankProgressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 2,
  },
  canvas: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  flashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    zIndex: 100,
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
  comboContainer: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
  },
  comboText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  comboTextBig: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
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
  missionCompleteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
  },
  missionCompleteText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginBottom: 12,
  },
  missionCompleteGems: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E0F7FA',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
