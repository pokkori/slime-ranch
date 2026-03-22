export interface WeeklyChallenge {
  weekId: string;
  challengeSlimeName: string;
  challengeSlimeColor: string;
  challengeSlimeId: string;
  targetType: 'merge_count' | 'discover_count' | 'coin_earn';
  targetValue: number;
  rewardCoins: number;
  rewardGems: number;
  description: string;
}

const WEEKLY_SLIMES = [
  { name: 'ゴールドスライム', id: 'weekly_gold', color: '#FFD700' },
  { name: 'シルバースライム', id: 'weekly_silver', color: '#C0C0C0' },
  { name: 'クリスタルスライム', id: 'weekly_crystal', color: '#B0E0FF' },
  { name: 'ルビースライム', id: 'weekly_ruby', color: '#FF1744' },
  { name: 'エメラルドスライム', id: 'weekly_emerald', color: '#00C853' },
  { name: 'サファイアスライム', id: 'weekly_sapphire', color: '#2979FF' },
  { name: 'アメジストスライム', id: 'weekly_amethyst', color: '#AA00FF' },
];

const WEEKLY_TARGETS = [
  { type: 'merge_count' as const, value: 50, desc: '今週50回合体させよう', coins: 2000, gems: 5 },
  { type: 'discover_count' as const, value: 5, desc: '今週5種新たに発見しよう', coins: 1500, gems: 3 },
  { type: 'coin_earn' as const, value: 10000, desc: '今週コイン10000枚稼ごう', coins: 1000, gems: 8 },
];

function getWeekId(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNum}`;
}

function weekHash(weekId: string): number {
  let h = 0;
  for (let i = 0; i < weekId.length; i++) {
    h = ((h << 5) - h) + weekId.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function getCurrentWeeklyChallenge(): WeeklyChallenge {
  const now = new Date();
  const weekId = getWeekId(now);
  const h = weekHash(weekId);
  const slime = WEEKLY_SLIMES[h % WEEKLY_SLIMES.length];
  const target = WEEKLY_TARGETS[(h >> 3) % WEEKLY_TARGETS.length];
  return {
    weekId,
    challengeSlimeName: slime.name,
    challengeSlimeColor: slime.color,
    challengeSlimeId: slime.id,
    targetType: target.type,
    targetValue: target.value,
    description: target.desc,
    rewardCoins: target.coins,
    rewardGems: target.gems,
  };
}
