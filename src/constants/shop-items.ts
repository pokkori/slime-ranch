import { ShopItem } from '../types/shop';

export const SHOP_ITEMS: ShopItem[] = [
  // Decorations
  {
    itemId: 'deco_flower_bed', category: 'decoration', name: '花壇', description: 'コイン生成+10%の区画ボーナス',
    costType: 'coin', cost: 500, icon: 'flower', effect: { type: 'decoration', decorationId: 'flower_bed' },
    purchased: false, maxPurchase: 1, currentPurchaseCount: 0,
  },
  {
    itemId: 'deco_mushroom_ring', category: 'decoration', name: 'キノコの輪', description: '合体確率+15%の区画ボーナス',
    costType: 'coin', cost: 1200, icon: 'nutrition', effect: { type: 'decoration', decorationId: 'mushroom_ring' },
    purchased: false, maxPurchase: 1, currentPurchaseCount: 0,
  },
  {
    itemId: 'deco_crystal_pond', category: 'decoration', name: 'クリスタル池', description: 'コイン生成+20%の区画ボーナス',
    costType: 'coin', cost: 2000, icon: 'water', effect: { type: 'decoration', decorationId: 'crystal_pond' },
    purchased: false, maxPurchase: 1, currentPurchaseCount: 0,
  },
  {
    itemId: 'deco_rainbow_arch', category: 'decoration', name: '虹のアーチ', description: 'スポーン速度+25%',
    costType: 'coin', cost: 3000, icon: 'rainbow', effect: { type: 'decoration', decorationId: 'rainbow_arch' },
    purchased: false, maxPurchase: 1, currentPurchaseCount: 0,
  },
  {
    itemId: 'deco_golden_tree', category: 'decoration', name: '黄金の木', description: 'コイン生成+30%の区画ボーナス',
    costType: 'coin', cost: 5000, icon: 'leaf', effect: { type: 'decoration', decorationId: 'golden_tree' },
    purchased: false, maxPurchase: 1, currentPurchaseCount: 0,
  },
  {
    itemId: 'deco_fairy_lamp', category: 'decoration', name: '妖精のランプ', description: 'オフラインコイン+20%',
    costType: 'coin', cost: 2500, icon: 'bulb', effect: { type: 'decoration', decorationId: 'fairy_lamp' },
    purchased: false, maxPurchase: 1, currentPurchaseCount: 0,
  },
  {
    itemId: 'deco_hot_spring', category: 'decoration', name: '温泉', description: 'オフラインコイン+35%',
    costType: 'coin', cost: 4000, icon: 'thermometer', effect: { type: 'decoration', decorationId: 'hot_spring' },
    purchased: false, maxPurchase: 1, currentPurchaseCount: 0,
  },
  {
    itemId: 'deco_ancient_stone', category: 'decoration', name: '古代石', description: '合体確率+25%',
    costType: 'coin', cost: 3500, icon: 'cube', effect: { type: 'decoration', decorationId: 'ancient_stone' },
    purchased: false, maxPurchase: 1, currentPurchaseCount: 0,
  },
  {
    itemId: 'deco_wind_chime', category: 'decoration', name: '風鈴', description: 'スポーン速度+15%',
    costType: 'coin', cost: 1500, icon: 'musical-notes', effect: { type: 'decoration', decorationId: 'wind_chime' },
    purchased: false, maxPurchase: 1, currentPurchaseCount: 0,
  },
  {
    itemId: 'deco_star_fountain', category: 'decoration', name: '星の噴水', description: 'コイン生成+50%',
    costType: 'coin', cost: 8000, icon: 'star', effect: { type: 'decoration', decorationId: 'star_fountain' },
    purchased: false, maxPurchase: 1, currentPurchaseCount: 0,
  },
  // Backgrounds
  {
    itemId: 'bg_forest', category: 'background', name: '深い森', description: 'green系スライムのコイン+20%',
    costType: 'coin', cost: 3000, icon: 'leaf', effect: { type: 'background', theme: 'forest' },
    purchased: false, maxPurchase: 1, currentPurchaseCount: 0,
  },
  {
    itemId: 'bg_beach', category: 'background', name: 'トロピカルビーチ', description: 'blue系スライムのコイン+20%',
    costType: 'coin', cost: 5000, icon: 'sunny', effect: { type: 'background', theme: 'beach' },
    purchased: false, maxPurchase: 1, currentPurchaseCount: 0,
  },
  {
    itemId: 'bg_volcano', category: 'background', name: '灼熱の火山', description: 'red系スライムのコイン+20%',
    costType: 'coin', cost: 8000, icon: 'flame', effect: { type: 'background', theme: 'volcano' },
    purchased: false, maxPurchase: 1, currentPurchaseCount: 0,
  },
  {
    itemId: 'bg_sky_garden', category: 'background', name: '天空庭園', description: '全スライムのコイン+10%',
    costType: 'coin', cost: 15000, icon: 'cloud', effect: { type: 'background', theme: 'sky_garden' },
    purchased: false, maxPurchase: 1, currentPurchaseCount: 0,
  },
  {
    itemId: 'bg_crystal_cave', category: 'background', name: '水晶洞窟', description: '全スライムのコイン+15%、オフライン+10%',
    costType: 'coin', cost: 25000, icon: 'diamond', effect: { type: 'background', theme: 'crystal_cave' },
    purchased: false, maxPurchase: 1, currentPurchaseCount: 0,
  },
  // Boosters
  {
    itemId: 'boost_coin_2x', category: 'booster', name: 'コインブースト2倍', description: '30分間コイン生成量2倍',
    costType: 'gem', cost: 5, icon: 'flash', effect: { type: 'coin_boost', multiplier: 2.0, durationMinutes: 30 },
    purchased: false, maxPurchase: -1, currentPurchaseCount: 0,
  },
  {
    itemId: 'boost_offline_2x', category: 'booster', name: 'オフラインブースト2倍', description: '2時間オフラインコイン2倍',
    costType: 'gem', cost: 8, icon: 'moon', effect: { type: 'offline_boost', multiplier: 2.0, durationMinutes: 120 },
    purchased: false, maxPurchase: -1, currentPurchaseCount: 0,
  },
  {
    itemId: 'boost_auto_merge', category: 'booster', name: 'オートマージ', description: '30分間自動で合体',
    costType: 'gem', cost: 10, icon: 'sync', effect: { type: 'auto_merge', durationMinutes: 30 },
    purchased: false, maxPurchase: -1, currentPurchaseCount: 0,
  },
  // Expansion
  {
    itemId: 'expand_slime_5', category: 'expansion', name: 'スライム上限+5', description: 'スライム上限を5体増やす',
    costType: 'coin', cost: 2000, icon: 'add-circle', effect: { type: 'max_slime_up', amount: 5 },
    purchased: false, maxPurchase: -1, currentPurchaseCount: 0,
  },
];

export const DECORATION_BONUSES: Record<string, { type: 'coin_rate' | 'merge_chance' | 'offline_rate' | 'spawn_rate'; multiplier: number }> = {
  flower_bed: { type: 'coin_rate', multiplier: 1.10 },
  mushroom_ring: { type: 'merge_chance', multiplier: 1.15 },
  crystal_pond: { type: 'coin_rate', multiplier: 1.20 },
  rainbow_arch: { type: 'spawn_rate', multiplier: 1.25 },
  golden_tree: { type: 'coin_rate', multiplier: 1.30 },
  fairy_lamp: { type: 'offline_rate', multiplier: 1.20 },
  hot_spring: { type: 'offline_rate', multiplier: 1.35 },
  ancient_stone: { type: 'merge_chance', multiplier: 1.25 },
  wind_chime: { type: 'spawn_rate', multiplier: 1.15 },
  star_fountain: { type: 'coin_rate', multiplier: 1.50 },
};
