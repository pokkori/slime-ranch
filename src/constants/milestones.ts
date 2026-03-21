/** Milestone / Ranch Rank definitions */
export interface Milestone {
  rank: number;
  name: string;
  condition: string;
  rewardDescription: string;
  rewardType: 'coins' | 'slot' | 'background' | 'booster' | 'king_slime';
  rewardValue: number | string;
}

export const MILESTONES: Milestone[] = [
  {
    rank: 1,
    name: 'はじまりの牧場',
    condition: 'first_merge',
    rewardDescription: 'コイン500',
    rewardType: 'coins',
    rewardValue: 500,
  },
  {
    rank: 2,
    name: '見習い牧場主',
    condition: 'discover_5',
    rewardDescription: '新スロット解放',
    rewardType: 'slot',
    rewardValue: 1,
  },
  {
    rank: 3,
    name: '一人前の牧場主',
    condition: 'tier3_owned',
    rewardDescription: '背景「深い森」無料解放',
    rewardType: 'background',
    rewardValue: 'forest',
  },
  {
    rank: 4,
    name: '凄腕牧場主',
    condition: 'discover_15',
    rewardDescription: '「オートマージ」30分無料',
    rewardType: 'booster',
    rewardValue: 30,
  },
  {
    rank: 5,
    name: '伝説の牧場主',
    condition: 'tier5_owned',
    rewardDescription: '背景「天空庭園」無料解放',
    rewardType: 'background',
    rewardValue: 'sky_garden',
  },
  {
    rank: 6,
    name: 'スライム王',
    condition: 'complete_all',
    rewardDescription: 'キングスライム出現',
    rewardType: 'king_slime',
    rewardValue: 'king_slime',
  },
];
