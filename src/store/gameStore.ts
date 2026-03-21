import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SlimeInstance, EncyclopediaEntry } from '../types/slime';
import { RanchState } from '../types/ranch';
import { DailyMission, Achievement } from '../types/mission';
import { ActiveBooster, SettingsData, StatisticsData } from '../types/storage';
import { SLIME_MASTER, ALL_SLIMES, TOTAL_SLIME_COUNT } from '../constants/slimes';
import { INITIAL_RANCH_SLOTS, SLIMES_PER_SLOT, INITIAL_MAX_SLIMES } from '../constants/ranch-upgrades';
import { ALL_ACHIEVEMENTS } from '../constants/achievements';
import { selectDailyMissions, ALL_COMPLETE_BONUS_GEMS } from '../constants/missions';
import { DECORATION_BONUSES } from '../constants/shop-items';
import { canMerge, getMergeResult, getRandomTier1MasterId, findMergeGroup, MergeGroupResult } from '../engine/merge-logic';
import { calculateOfflineReward, OfflineRewardResult } from '../engine/offline-reward';
import { MILESTONES } from '../constants/milestones';
import { getTodayString } from '../utils/format';

const SPAWN_WALL_LEFT = 10;
const SPAWN_WALL_RIGHT = 370; // approximate screen width - 10

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createSlimeInstance(masterId: string, x: number, y: number): SlimeInstance {
  return {
    instanceId: generateId(),
    masterId,
    x,
    y,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    scale: 1,
    wobblePhase: Math.random() * Math.PI * 2,
    wobbleAmplitude: 0.06,
    lastCoinTime: Date.now(),
    isNew: true,
    isMerging: false,
  };
}

export interface GameState {
  // Core state
  coins: number;
  gems: number;
  slimes: SlimeInstance[];
  ranch: RanchState;
  activeBoosters: ActiveBooster[];
  tutorialDone: boolean;

  // Encyclopedia
  encyclopedia: EncyclopediaEntry[];

  // Missions
  dailyMissions: DailyMission[];
  dailyMissionDate: string;
  allMissionBonusClaimed: boolean;

  // Achievements
  achievements: Achievement[];

  // Statistics
  statistics: StatisticsData;

  // Settings
  settings: SettingsData;

  // Last active
  lastActiveAt: string;

  // Offline reward pending
  pendingOfflineReward: OfflineRewardResult | null;

  // Floating coins for animation
  floatingCoins: Array<{ x: number; y: number; value: number; id: string }>;

  // Merge animation state
  mergeAnimation: {
    active: boolean;
    slimeAId: string;
    slimeBId: string;
    resultMasterId: string;
    midX: number;
    midY: number;
    isRare: boolean;
  } | null;

  // Ranch rank (milestones)
  ranchRank: number;
  pendingMilestoneRank: number | null;

  // Auto spawn timer
  lastAutoSpawnTime: number;

  // Combo counter for 3-match chains
  comboCounter: number;

  // 5-match flash indicator
  flashActive: boolean;

  // Actions
  initGame: () => void;
  tapSlime: (instanceId: string) => void;
  tryMerge: (aId: string, bId: string) => boolean;
  tryMultiMerge: (group: MergeGroupResult, midX: number, midY: number) => boolean;
  completeMergeAnimation: () => void;
  checkMilestone: () => void;
  dismissMilestone: () => void;
  autoSpawnSlime: () => boolean;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  spendGems: (amount: number) => boolean;
  unlockSlot: (slotId: number) => boolean;
  setDecoration: (slotId: number, decorationId: string) => void;
  setBackground: (theme: RanchState['backgroundTheme']) => void;
  addBooster: (booster: ActiveBooster) => void;
  claimMissionReward: (missionId: string) => void;
  claimAllMissionBonus: () => void;
  updateMissionProgress: (type: DailyMission['type'], amount: number) => void;
  checkAchievements: () => Achievement[];
  dismissOfflineReward: (doubleIt: boolean) => void;
  checkOfflineReward: () => void;
  refreshDailyMissions: () => void;
  updateSlimePositions: (updates: Array<{ id: string; x: number; y: number }>) => void;
  tickCoins: () => number;
  setTutorialDone: () => void;
  updateSettings: (partial: Partial<SettingsData>) => void;
  clearFloatingCoin: (id: string) => void;
  resetGame: () => void;
}

const initialEncyclopedia = (): EncyclopediaEntry[] =>
  ALL_SLIMES.map(s => ({
    masterId: s.id,
    discovered: false,
    discoveredAt: null,
    mergeCount: 0,
  }));

const initialStatistics = (): StatisticsData => ({
  totalTaps: 0,
  totalMerges: 0,
  totalCoinsEarned: 0,
  totalGemsEarned: 0,
  totalAdsWatched: 0,
  totalPlayTimeSeconds: 0,
  longestLoginStreak: 1,
  currentLoginStreak: 1,
  lastLoginDate: getTodayString(),
  highestTierReached: 1,
  rarestSlimeDiscovered: 'green_1',
});

const initialSettings = (): SettingsData => ({
  bgmEnabled: true,
  sfxEnabled: true,
  hapticsEnabled: true,
  bgmVolume: 0.4,
  sfxVolume: 0.7,
  notificationsEnabled: false,
  language: 'ja',
});

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      coins: 0,
      gems: 0,
      slimes: [],
      ranch: {
        slots: [...INITIAL_RANCH_SLOTS],
        maxSlimes: INITIAL_MAX_SLIMES,
        backgroundTheme: 'meadow' as const,
      },
      activeBoosters: [],
      tutorialDone: false,
      encyclopedia: initialEncyclopedia(),
      dailyMissions: [],
      dailyMissionDate: '',
      allMissionBonusClaimed: false,
      achievements: [...ALL_ACHIEVEMENTS],
      statistics: initialStatistics(),
      settings: initialSettings(),
      lastActiveAt: new Date().toISOString(),
      pendingOfflineReward: null,
      floatingCoins: [],
      mergeAnimation: null,
      ranchRank: 0,
      pendingMilestoneRank: null,
      lastAutoSpawnTime: Date.now(),
      comboCounter: 0,
      flashActive: false,

      initGame: () => {
        const state = get();
        if (state.slimes.length === 0) {
          // Create initial slimes
          const s1 = createSlimeInstance('green_1', 120, 300);
          const s2 = createSlimeInstance('green_1', 200, 300);
          s1.isNew = false;
          s2.isNew = false;

          // Discover green_1
          const enc = [...state.encyclopedia];
          const idx = enc.findIndex(e => e.masterId === 'green_1');
          if (idx >= 0) {
            enc[idx] = { ...enc[idx], discovered: true, discoveredAt: Date.now() };
          }

          set({ slimes: [s1, s2], encyclopedia: enc, coins: 100 });
        }

        // Check daily missions
        get().refreshDailyMissions();
        get().checkOfflineReward();
      },

      tapSlime: (instanceId: string) => {
        const state = get();
        const slime = state.slimes.find(s => s.instanceId === instanceId);
        if (!slime || slime.isMerging) return;

        const master = SLIME_MASTER[slime.masterId];
        if (!master) return;

        // Check capacity
        const splitCount = master.ability === 'split_bonus' ? 3 : 2;
        const additionalSlimes = splitCount - 1;
        if (state.slimes.length + additionalSlimes > state.ranch.maxSlimes) return;

        // Remove original, add split copies
        const newSlimes = state.slimes.filter(s => s.instanceId !== instanceId);
        for (let i = 0; i < splitCount; i++) {
          const offsetX = (i - (splitCount - 1) / 2) * master.baseRadius * 1.5;
          const ns = createSlimeInstance(slime.masterId, slime.x + offsetX, slime.y);
          ns.scale = 0.3;
          newSlimes.push(ns);
        }

        const stats = { ...state.statistics, totalTaps: state.statistics.totalTaps + 1 };
        set({ slimes: newSlimes, statistics: stats });
        get().updateMissionProgress('tap_slimes', 1);
      },

      tryMerge: (aId: string, bId: string) => {
        const state = get();
        const a = state.slimes.find(s => s.instanceId === aId);
        const b = state.slimes.find(s => s.instanceId === bId);
        if (!a || !b || !canMerge(a, b)) return false;

        const result = getMergeResult(a, b);
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;

        // Mark as merging
        const newSlimes = state.slimes.map(s => {
          if (s.instanceId === aId || s.instanceId === bId) {
            return { ...s, isMerging: true };
          }
          return s;
        });

        if (result.type === 'evolve') {
          const master = SLIME_MASTER[result.newMasterId];
          const isRare = master ? master.tier >= 3 : false;

          set({
            slimes: newSlimes,
            mergeAnimation: {
              active: true,
              slimeAId: aId,
              slimeBId: bId,
              resultMasterId: result.newMasterId,
              midX,
              midY,
              isRare,
            },
          });
        } else {
          // Recycle: remove both, add 3 random tier 1
          const filtered = newSlimes.filter(
            s => s.instanceId !== aId && s.instanceId !== bId
          );
          for (let i = 0; i < result.count; i++) {
            const masterId = getRandomTier1MasterId();
            const ns = createSlimeInstance(
              masterId,
              midX + (i - 1) * 40,
              midY - 20,
            );
            filtered.push(ns);
            // Discover
            const enc2 = [...get().encyclopedia];
            const idx2 = enc2.findIndex(e => e.masterId === masterId);
            if (idx2 >= 0 && !enc2[idx2].discovered) {
              enc2[idx2] = { ...enc2[idx2], discovered: true, discoveredAt: Date.now(), mergeCount: enc2[idx2].mergeCount + 1 };
              set({ encyclopedia: enc2 });
            }
          }
          const stats = { ...get().statistics, totalMerges: get().statistics.totalMerges + 1 };
          set({ slimes: filtered, statistics: stats });
          get().updateMissionProgress('merge_slimes', 1);
        }

        return true;
      },

      completeMergeAnimation: () => {
        const state = get();
        const anim = state.mergeAnimation;
        if (!anim) return;

        // Remove the two merging slimes, add new one
        const filtered = state.slimes.filter(
          s => s.instanceId !== anim.slimeAId && s.instanceId !== anim.slimeBId
        );

        const ns = createSlimeInstance(anim.resultMasterId, anim.midX, anim.midY);
        ns.wobbleAmplitude = 0.15;
        filtered.push(ns);

        // Discover
        const enc = [...state.encyclopedia];
        const idx = enc.findIndex(e => e.masterId === anim.resultMasterId);
        if (idx >= 0 && !enc[idx].discovered) {
          enc[idx] = {
            ...enc[idx],
            discovered: true,
            discoveredAt: Date.now(),
            mergeCount: enc[idx].mergeCount + 1,
          };
          get().updateMissionProgress('discover_new', 1);
        } else if (idx >= 0) {
          enc[idx] = { ...enc[idx], mergeCount: enc[idx].mergeCount + 1 };
        }

        const master = SLIME_MASTER[anim.resultMasterId];
        const stats = {
          ...state.statistics,
          totalMerges: state.statistics.totalMerges + 1,
          highestTierReached: Math.max(state.statistics.highestTierReached, master?.tier ?? 0),
        };

        if (master && master.tier >= 3) {
          get().updateMissionProgress('collect_rare', 1);
        }
        if (master && master.tier === 6) {
          get().updateMissionProgress('reach_mythic', 1);
        }

        set({
          slimes: filtered,
          mergeAnimation: null,
          encyclopedia: enc,
          statistics: stats,
        });
        get().updateMissionProgress('merge_slimes', 1);
        get().checkMilestone();
      },

      tryMultiMerge: (group: MergeGroupResult, midX: number, midY: number) => {
        const state = get();

        // Remove all consumed slimes
        const filtered = state.slimes.filter(
          s => !group.consumedIds.includes(s.instanceId)
        );

        // Create result slime
        const ns = createSlimeInstance(group.resultMasterId, midX, midY);
        ns.wobbleAmplitude = 0.15;
        filtered.push(ns);

        // Discover
        const enc = [...state.encyclopedia];
        const idx = enc.findIndex(e => e.masterId === group.resultMasterId);
        if (idx >= 0 && !enc[idx].discovered) {
          enc[idx] = {
            ...enc[idx],
            discovered: true,
            discoveredAt: Date.now(),
            mergeCount: enc[idx].mergeCount + 1,
          };
        } else if (idx >= 0) {
          enc[idx] = { ...enc[idx], mergeCount: enc[idx].mergeCount + 1 };
        }

        const master = SLIME_MASTER[group.resultMasterId];
        const stats = {
          ...state.statistics,
          totalMerges: state.statistics.totalMerges + 1,
          highestTierReached: Math.max(state.statistics.highestTierReached, master?.tier ?? 0),
        };

        // Bonus coins
        const bonusCoins = (master?.coinsPerMinute ?? 1) * group.coinMultiplier;

        if (master && master.tier >= 3) {
          get().updateMissionProgress('collect_rare', 1);
        }
        if (master && master.tier === 6) {
          get().updateMissionProgress('reach_mythic', 1);
        }

        set({
          slimes: filtered,
          encyclopedia: enc,
          statistics: stats,
          coins: state.coins + bonusCoins,
          flashActive: group.is5Match,
        });

        get().updateMissionProgress('merge_slimes', 1);
        get().updateMissionProgress('earn_coins', bonusCoins);
        get().updateMissionProgress('discover_new', 1);
        get().checkMilestone();

        return true;
      },

      checkMilestone: () => {
        const state = get();
        const currentRank = state.ranchRank;
        const enc = state.encyclopedia;
        const discoveredCount = enc.filter(e => e.discovered).length;
        const slimes = state.slimes;

        let newRank = currentRank;

        // Rank 1: first merge
        if (newRank < 1 && state.statistics.totalMerges >= 1) {
          newRank = 1;
        }
        // Rank 2: 5 species discovered
        if (newRank < 2 && discoveredCount >= 5) {
          newRank = 2;
        }
        // Rank 3: Tier 3 slime owned
        if (newRank < 3 && slimes.some(s => {
          const m = SLIME_MASTER[s.masterId];
          return m && m.tier >= 3;
        })) {
          newRank = 3;
        }
        // Rank 4: 15 species discovered
        if (newRank < 4 && discoveredCount >= 15) {
          newRank = 4;
        }
        // Rank 5: Tier 5 slime owned
        if (newRank < 5 && slimes.some(s => {
          const m = SLIME_MASTER[s.masterId];
          return m && m.tier >= 5;
        })) {
          newRank = 5;
        }
        // Rank 6: all 36 species discovered (excluding special)
        if (newRank < 6 && discoveredCount >= 36) {
          newRank = 6;
        }

        if (newRank > currentRank) {
          // Apply reward
          const milestone = MILESTONES.find(m => m.rank === newRank);
          if (milestone) {
            if (milestone.rewardType === 'coins') {
              set(s => ({ coins: s.coins + (milestone.rewardValue as number) }));
            } else if (milestone.rewardType === 'slot') {
              // Unlock next locked slot for free
              const slots = [...state.ranch.slots];
              const lockedIdx = slots.findIndex(s => s.state === 'locked');
              if (lockedIdx >= 0) {
                slots[lockedIdx] = { ...slots[lockedIdx], state: 'unlocked' };
                const unlockedCount = slots.filter(s => s.state !== 'locked').length;
                set({
                  ranch: {
                    ...state.ranch,
                    slots,
                    maxSlimes: unlockedCount * 5,
                  },
                });
              }
            } else if (milestone.rewardType === 'background') {
              set({ ranch: { ...state.ranch, backgroundTheme: milestone.rewardValue as any } });
            } else if (milestone.rewardType === 'booster') {
              const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
              set(s => ({
                activeBoosters: [...s.activeBoosters, {
                  type: 'auto_merge' as const,
                  multiplier: 1,
                  expiresAt,
                }],
              }));
            } else if (milestone.rewardType === 'king_slime') {
              // Add king slime (use green_6 as king placeholder)
              const kingSlime = createSlimeInstance('green_6', 180, 300);
              set(s => ({ slimes: [...s.slimes, kingSlime] }));
            }
          }

          set({
            ranchRank: newRank,
            pendingMilestoneRank: newRank,
          });
        }
      },

      dismissMilestone: () => {
        set({ pendingMilestoneRank: null });
      },

      autoSpawnSlime: () => {
        const state = get();
        if (state.slimes.length >= state.ranch.maxSlimes) return false;

        const masterId = getRandomTier1MasterId();
        // Spawn from top of field with random X
        const x = SPAWN_WALL_LEFT + 30 + Math.random() * (SPAWN_WALL_RIGHT - SPAWN_WALL_LEFT - 60);
        const y = 100;
        const ns = createSlimeInstance(masterId, x, y);
        // Use isNew for entrance animation
        ns.isNew = true;
        ns.scale = 0.3;

        // Discover if new
        const enc = [...state.encyclopedia];
        const idx = enc.findIndex(e => e.masterId === masterId);
        if (idx >= 0 && !enc[idx].discovered) {
          enc[idx] = { ...enc[idx], discovered: true, discoveredAt: Date.now() };
        }

        set({
          slimes: [...state.slimes, ns],
          encyclopedia: enc,
          lastAutoSpawnTime: Date.now(),
        });

        return true;
      },

      addCoins: (amount: number) => {
        set(state => ({
          coins: state.coins + amount,
          statistics: {
            ...state.statistics,
            totalCoinsEarned: state.statistics.totalCoinsEarned + amount,
          },
        }));
        get().updateMissionProgress('earn_coins', amount);
      },

      spendCoins: (amount: number) => {
        if (get().coins < amount) return false;
        set(state => ({ coins: state.coins - amount }));
        return true;
      },

      spendGems: (amount: number) => {
        if (get().gems < amount) return false;
        set(state => ({ gems: state.gems - amount }));
        return true;
      },

      unlockSlot: (slotId: number) => {
        const state = get();
        const slot = state.ranch.slots.find(s => s.slotId === slotId);
        if (!slot || slot.state !== 'locked') return false;
        if (state.coins < slot.unlockCost) return false;

        const newSlots = state.ranch.slots.map(s =>
          s.slotId === slotId ? { ...s, state: 'unlocked' as const } : s
        );
        const unlockedCount = newSlots.filter(s => s.state !== 'locked').length;
        const newMaxSlimes = unlockedCount * SLIMES_PER_SLOT;

        set({
          coins: state.coins - slot.unlockCost,
          ranch: { ...state.ranch, slots: newSlots, maxSlimes: newMaxSlimes },
        });
        return true;
      },

      setDecoration: (slotId: number, decorationId: string) => {
        const state = get();
        const bonus = DECORATION_BONUSES[decorationId];
        const newSlots = state.ranch.slots.map(s =>
          s.slotId === slotId
            ? {
                ...s,
                state: 'decorated' as const,
                decoration: decorationId as any,
                bonus: bonus ? { type: bonus.type, multiplier: bonus.multiplier } : null,
              }
            : s
        );
        set({ ranch: { ...state.ranch, slots: newSlots } });
        get().updateMissionProgress('buy_decoration', 1);
      },

      setBackground: (theme) => {
        set(state => ({ ranch: { ...state.ranch, backgroundTheme: theme } }));
      },

      addBooster: (booster) => {
        set(state => ({
          activeBoosters: [...state.activeBoosters, booster],
        }));
      },

      claimMissionReward: (missionId: string) => {
        const state = get();
        const missions = state.dailyMissions.map(m => {
          if (m.missionId === missionId && m.completed && !m.claimed) {
            return { ...m, claimed: true };
          }
          return m;
        });
        const mission = state.dailyMissions.find(m => m.missionId === missionId);
        if (mission && mission.completed && !mission.claimed) {
          set({
            coins: state.coins + mission.rewardCoins,
            gems: state.gems + mission.rewardGems,
            dailyMissions: missions,
            statistics: {
              ...state.statistics,
              totalCoinsEarned: state.statistics.totalCoinsEarned + mission.rewardCoins,
              totalGemsEarned: state.statistics.totalGemsEarned + mission.rewardGems,
            },
          });
        }
      },

      claimAllMissionBonus: () => {
        const state = get();
        if (state.allMissionBonusClaimed) return;
        const allClaimed = state.dailyMissions.every(m => m.claimed);
        if (!allClaimed) return;
        set({
          gems: state.gems + ALL_COMPLETE_BONUS_GEMS,
          allMissionBonusClaimed: true,
          statistics: {
            ...state.statistics,
            totalGemsEarned: state.statistics.totalGemsEarned + ALL_COMPLETE_BONUS_GEMS,
          },
        });
      },

      updateMissionProgress: (type, amount) => {
        set(state => {
          const missions = state.dailyMissions.map(m => {
            if (m.type === type && !m.completed) {
              const newVal = Math.min(m.currentValue + amount, m.targetValue);
              return {
                ...m,
                currentValue: newVal,
                completed: newVal >= m.targetValue,
              };
            }
            return m;
          });

          const achievements = state.achievements.map(a => {
            if (a.type === type && !a.unlocked) {
              const newVal = Math.min(a.currentValue + amount, a.targetValue);
              return {
                ...a,
                currentValue: newVal,
                unlocked: newVal >= a.targetValue,
                unlockedAt: newVal >= a.targetValue ? Date.now() : null,
              };
            }
            return a;
          });

          return { dailyMissions: missions, achievements };
        });
      },

      checkAchievements: () => {
        const state = get();
        const newlyUnlocked: Achievement[] = [];
        const achievements = state.achievements.map(a => {
          if (a.unlocked && a.unlockedAt && !a.currentValue) {
            // Already collected
          }
          return a;
        });
        return newlyUnlocked;
      },

      dismissOfflineReward: (doubleIt: boolean) => {
        const state = get();
        const reward = state.pendingOfflineReward;
        if (!reward) return;
        const amount = doubleIt ? reward.coins * 2 : reward.coins;

        // Spawn offline slimes
        const newSlimes = [...state.slimes];
        const enc = [...state.encyclopedia];
        if (reward.spawnedSlimes) {
          for (const spawned of reward.spawnedSlimes) {
            if (newSlimes.length >= state.ranch.maxSlimes) break;
            const x = SPAWN_WALL_LEFT + 30 + Math.random() * (SPAWN_WALL_RIGHT - SPAWN_WALL_LEFT - 60);
            const y = 100 + Math.random() * 200;
            const ns = createSlimeInstance(spawned.masterId, x, y);
            ns.isNew = true;
            ns.scale = 0.3;
            newSlimes.push(ns);

            const idx = enc.findIndex(e => e.masterId === spawned.masterId);
            if (idx >= 0 && !enc[idx].discovered) {
              enc[idx] = { ...enc[idx], discovered: true, discoveredAt: Date.now() };
            }
          }
        }

        set({
          coins: state.coins + amount,
          slimes: newSlimes,
          encyclopedia: enc,
          pendingOfflineReward: null,
          statistics: {
            ...state.statistics,
            totalCoinsEarned: state.statistics.totalCoinsEarned + amount,
          },
        });
      },

      checkOfflineReward: () => {
        const state = get();
        const lastActive = new Date(state.lastActiveAt);
        const now = new Date();
        const slimeSaves = state.slimes.map(s => ({
          instanceId: s.instanceId,
          masterId: s.masterId,
          x: s.x,
          y: s.y,
        }));

        const reward = calculateOfflineReward(
          slimeSaves,
          state.ranch,
          state.activeBoosters,
          lastActive,
          now,
        );

        if (reward.coins > 0) {
          set({ pendingOfflineReward: reward });
        }

        // Update last active
        set({ lastActiveAt: now.toISOString() });
      },

      refreshDailyMissions: () => {
        const today = getTodayString();
        const state = get();
        if (state.dailyMissionDate !== today) {
          set({
            dailyMissions: selectDailyMissions(today),
            dailyMissionDate: today,
            allMissionBonusClaimed: false,
          });
        }
      },

      updateSlimePositions: (updates) => {
        set(state => {
          const slimes = [...state.slimes];
          for (const u of updates) {
            const idx = slimes.findIndex(s => s.instanceId === u.id);
            if (idx >= 0) {
              slimes[idx] = { ...slimes[idx], x: u.x, y: u.y };
            }
          }
          return { slimes };
        });
      },

      tickCoins: () => {
        const state = get();
        const now = Date.now();
        let totalCoins = 0;
        const newFloating: Array<{ x: number; y: number; value: number; id: string }> = [];

        // Calculate slot bonus
        let slotBonus = 1.0;
        for (const slot of state.ranch.slots) {
          if (slot.bonus?.type === 'coin_rate') {
            slotBonus += slot.bonus.multiplier - 1.0;
          }
        }

        const slimes = state.slimes.map(slime => {
          if (slime.isMerging || slime.isNew) return slime;
          const master = SLIME_MASTER[slime.masterId];
          if (!master) return slime;

          const intervalMs = 60000 / master.coinsPerMinute;
          const elapsedMs = now - slime.lastCoinTime;

          if (elapsedMs >= intervalMs) {
            let coinValue = 1;
            if (master.ability === 'coin_boost') coinValue = Math.ceil(coinValue * 1.5);
            if (master.ability === 'golden') coinValue = coinValue * 3;
            if (master.ability === 'giant') coinValue = coinValue * 2;
            coinValue = Math.ceil(coinValue * slotBonus);

            totalCoins += coinValue;
            newFloating.push({
              x: slime.x,
              y: slime.y - master.baseRadius - 10,
              value: coinValue,
              id: `coin_${slime.instanceId}_${now}`,
            });

            return { ...slime, lastCoinTime: now };
          }
          return slime;
        });

        if (totalCoins > 0) {
          set(prev => ({
            slimes,
            coins: prev.coins + totalCoins,
            floatingCoins: [...prev.floatingCoins, ...newFloating].slice(-20),
            statistics: {
              ...prev.statistics,
              totalCoinsEarned: prev.statistics.totalCoinsEarned + totalCoins,
            },
          }));
          get().updateMissionProgress('earn_coins', totalCoins);
        }

        return totalCoins;
      },

      setTutorialDone: () => set({ tutorialDone: true }),

      updateSettings: (partial) => {
        set(state => ({ settings: { ...state.settings, ...partial } }));
      },

      clearFloatingCoin: (id: string) => {
        set(state => ({
          floatingCoins: state.floatingCoins.filter(c => c.id !== id),
        }));
      },

      resetGame: () => {
        set({
          coins: 0,
          gems: 0,
          slimes: [],
          ranch: {
            slots: [...INITIAL_RANCH_SLOTS],
            maxSlimes: INITIAL_MAX_SLIMES,
            backgroundTheme: 'meadow',
          },
          activeBoosters: [],
          tutorialDone: false,
          encyclopedia: initialEncyclopedia(),
          dailyMissions: [],
          dailyMissionDate: '',
          allMissionBonusClaimed: false,
          achievements: [...ALL_ACHIEVEMENTS],
          statistics: initialStatistics(),
          lastActiveAt: new Date().toISOString(),
          pendingOfflineReward: null,
          floatingCoins: [],
          mergeAnimation: null,
          ranchRank: 0,
          pendingMilestoneRank: null,
          lastAutoSpawnTime: Date.now(),
          comboCounter: 0,
          flashActive: false,
        });
      },
    }),
    {
      name: '@slime_ranch/game_state',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        coins: state.coins,
        gems: state.gems,
        slimes: state.slimes.map(s => ({
          instanceId: s.instanceId,
          masterId: s.masterId,
          x: s.x,
          y: s.y,
          vx: s.vx,
          vy: s.vy,
          scale: s.scale,
          wobblePhase: s.wobblePhase,
          wobbleAmplitude: s.wobbleAmplitude,
          lastCoinTime: s.lastCoinTime,
          isNew: false,
          isMerging: false,
        })),
        ranch: state.ranch,
        activeBoosters: state.activeBoosters,
        tutorialDone: state.tutorialDone,
        encyclopedia: state.encyclopedia,
        dailyMissions: state.dailyMissions,
        dailyMissionDate: state.dailyMissionDate,
        allMissionBonusClaimed: state.allMissionBonusClaimed,
        achievements: state.achievements,
        statistics: state.statistics,
        settings: state.settings,
        lastActiveAt: state.lastActiveAt,
        ranchRank: state.ranchRank,
        lastAutoSpawnTime: state.lastAutoSpawnTime,
      }),
    }
  )
);
