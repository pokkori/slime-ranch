import { SlimeInstance, EncyclopediaEntry } from './slime';
import { RanchState } from './ranch';
import { DailyMission } from './mission';
import { Achievement } from './mission';

/** Active booster */
export interface ActiveBooster {
  type: 'coin_boost' | 'offline_boost' | 'auto_merge';
  multiplier: number;
  expiresAt: string; // ISO timestamp
}

/** Game save data */
export interface GameSaveData {
  version: number;
  coins: number;
  gems: number;
  slimes: SlimeInstanceSave[];
  ranch: RanchState;
  activeBoosters: ActiveBooster[];
  totalPlayTimeSeconds: number;
  createdAt: string;
}

/** Slime instance save (minimal) */
export interface SlimeInstanceSave {
  instanceId: string;
  masterId: string;
  x: number;
  y: number;
}

/** Settings data */
export interface SettingsData {
  bgmEnabled: boolean;
  sfxEnabled: boolean;
  hapticsEnabled: boolean;
  bgmVolume: number;
  sfxVolume: number;
  notificationsEnabled: boolean;
  language: 'ja' | 'en';
}

/** Daily mission save */
export interface DailyMissionSave {
  date: string;
  missions: DailyMission[];
  allClaimedBonusClaimed: boolean;
}

/** Achievement save */
export interface AchievementSave {
  achievements: Achievement[];
}

/** Encyclopedia save */
export interface EncyclopediaSave {
  entries: EncyclopediaEntry[];
}

/** Statistics data */
export interface StatisticsData {
  totalTaps: number;
  totalMerges: number;
  totalCoinsEarned: number;
  totalGemsEarned: number;
  totalAdsWatched: number;
  totalPlayTimeSeconds: number;
  longestLoginStreak: number;
  currentLoginStreak: number;
  lastLoginDate: string;
  highestTierReached: number;
  rarestSlimeDiscovered: string;
}

/** Ad state data */
export interface AdStateData {
  lastInterstitialAt: string;
  interstitialCount: number;
  rewardedCount: number;
  date: string;
}

/** IAP state data */
export interface IAPStateData {
  removeAds: boolean;
  premiumPass: boolean;
  purchasedGemPacks: string[];
}

/** AsyncStorage schema */
export interface StorageSchema {
  '@slime_ranch/game_state': GameSaveData;
  '@slime_ranch/settings': SettingsData;
  '@slime_ranch/last_active': string;
  '@slime_ranch/daily_missions': DailyMissionSave;
  '@slime_ranch/achievements': AchievementSave;
  '@slime_ranch/encyclopedia': EncyclopediaSave;
  '@slime_ranch/statistics': StatisticsData;
  '@slime_ranch/ad_state': AdStateData;
  '@slime_ranch/iap_state': IAPStateData;
  '@slime_ranch/tutorial_done': boolean;
}
