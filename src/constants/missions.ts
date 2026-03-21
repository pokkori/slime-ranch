import { DailyMission } from '../types/mission';

export interface DailyMissionTemplate {
  missionId: string;
  type: DailyMission['type'];
  targetValue: number;
  rewardCoins: number;
  rewardGems: number;
  text: string;
}

export const ALL_DAILY_MISSIONS: DailyMissionTemplate[] = [
  { missionId: 'daily_tap_10', type: 'tap_slimes', targetValue: 10, rewardCoins: 100, rewardGems: 0, text: 'スライムを10回タップしよう' },
  { missionId: 'daily_tap_50', type: 'tap_slimes', targetValue: 50, rewardCoins: 300, rewardGems: 1, text: 'スライムを50回タップしよう' },
  { missionId: 'daily_merge_5', type: 'merge_slimes', targetValue: 5, rewardCoins: 200, rewardGems: 0, text: '5回合体させよう' },
  { missionId: 'daily_merge_15', type: 'merge_slimes', targetValue: 15, rewardCoins: 500, rewardGems: 2, text: '15回合体させよう' },
  { missionId: 'daily_coins_500', type: 'earn_coins', targetValue: 500, rewardCoins: 200, rewardGems: 0, text: 'コインを500枚稼ごう' },
  { missionId: 'daily_coins_2000', type: 'earn_coins', targetValue: 2000, rewardCoins: 500, rewardGems: 1, text: 'コインを2000枚稼ごう' },
  { missionId: 'daily_discover_1', type: 'discover_new', targetValue: 1, rewardCoins: 300, rewardGems: 1, text: '新種を1種発見しよう' },
  { missionId: 'daily_rare_1', type: 'collect_rare', targetValue: 1, rewardCoins: 250, rewardGems: 0, text: 'レア以上を1体保有しよう' },
  { missionId: 'daily_ad_1', type: 'watch_ad', targetValue: 1, rewardCoins: 150, rewardGems: 1, text: 'リワード広告を1回見よう' },
  { missionId: 'daily_ad_3', type: 'watch_ad', targetValue: 3, rewardCoins: 300, rewardGems: 2, text: 'リワード広告を3回見よう' },
];

export const DAILY_MISSION_COUNT = 7;
export const ALL_COMPLETE_BONUS_GEMS = 5;

// Seeded random for daily mission selection
function hashDateString(date: string): number {
  let hash = 0;
  for (let i = 0; i < date.length; i++) {
    const chr = date.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

export function selectDailyMissions(date: string): DailyMission[] {
  const seed = hashDateString(date);
  const rng = seededRandom(seed);
  const allMissions = [...ALL_DAILY_MISSIONS];

  // Fisher-Yates shuffle
  for (let i = allMissions.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [allMissions[i], allMissions[j]] = [allMissions[j], allMissions[i]];
  }

  return allMissions.slice(0, DAILY_MISSION_COUNT).map(m => ({
    missionId: m.missionId,
    type: m.type,
    targetValue: m.targetValue,
    currentValue: 0,
    rewardCoins: m.rewardCoins,
    rewardGems: m.rewardGems,
    completed: false,
    claimed: false,
  }));
}
