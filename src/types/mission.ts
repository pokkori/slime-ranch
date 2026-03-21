/** Mission type */
export type MissionType =
  | 'tap_slimes'
  | 'merge_slimes'
  | 'earn_coins'
  | 'discover_new'
  | 'collect_rare'
  | 'login_streak'
  | 'watch_ad'
  | 'buy_decoration'
  | 'fill_encyclopedia'
  | 'reach_mythic';

/** Daily mission */
export interface DailyMission {
  missionId: string;
  type: MissionType;
  targetValue: number;
  currentValue: number;
  rewardCoins: number;
  rewardGems: number;
  completed: boolean;
  claimed: boolean;
}

/** Achievement */
export interface Achievement {
  achievementId: string;
  title: string;
  description: string;
  type: MissionType;
  targetValue: number;
  currentValue: number;
  rewardCoins: number;
  rewardGems: number;
  unlocked: boolean;
  unlockedAt: number | null;
  icon: string;
}
