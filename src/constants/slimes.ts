import { SlimeMaster, SlimeColorFamily, SlimeRarity, SlimeAbility } from '../types/slime';

function makeSlime(
  colorFamily: SlimeColorFamily,
  tier: number,
  name: string,
  rarity: SlimeRarity,
  baseRadius: number,
  coinsPerMinute: number,
  ability: SlimeAbility,
  baseColor: string,
  highlightColor: string,
  shadowColor: string,
  description: string,
): SlimeMaster {
  const id = `${colorFamily}_${tier}`;
  return {
    id,
    name,
    colorFamily,
    rarity,
    tier,
    baseColor,
    highlightColor,
    shadowColor,
    baseRadius,
    coinsPerMinute,
    ability,
    description,
    mergeFromIds: tier > 1 ? [`${colorFamily}_${tier - 1}`, `${colorFamily}_${tier - 1}`] : null,
  };
}

const GREEN_SLIMES: SlimeMaster[] = [
  makeSlime('green', 1, 'みどりん', 'common', 20, 1.0, 'none', '#4CAF50', '#81C784', '#2E7D32', '牧場で最初に出会う元気なスライム'),
  makeSlime('green', 2, 'もりりん', 'uncommon', 26, 3.0, 'none', '#388E3C', '#66BB6A', '#1B5E20', '森の恵みを受けた進化スライム'),
  makeSlime('green', 3, 'はっぱん', 'rare', 32, 8.0, 'coin_boost', '#2E7D32', '#4CAF50', '#1B5E20', '葉っぱの冠を持つスライム。コイン生成+50%'),
  makeSlime('green', 4, 'フォレスト', 'epic', 40, 20.0, 'aura', '#1B5E20', '#2E7D32', '#004D40', '森の守護者。周囲のスライムを強化する'),
  makeSlime('green', 5, 'ガイアスライム', 'legendary', 50, 50.0, 'giant', '#004D40', '#00695C', '#002620', '大地の力を宿す巨大スライム'),
  makeSlime('green', 6, '世界樹スライム', 'mythic', 60, 150.0, 'golden', '#00695C', '#009688', '#004D40', '世界樹の魂が宿りし究極のスライム'),
];

const BLUE_SLIMES: SlimeMaster[] = [
  makeSlime('blue', 1, 'みずりん', 'common', 20, 1.0, 'none', '#2196F3', '#64B5F6', '#1565C0', '透き通った水のスライム'),
  makeSlime('blue', 2, 'うみりん', 'uncommon', 26, 3.0, 'none', '#1976D2', '#42A5F5', '#0D47A1', '海の香りがするスライム'),
  makeSlime('blue', 3, 'しずくん', 'rare', 32, 8.0, 'offline_boost', '#1565C0', '#1E88E5', '#0D47A1', '雫の精霊。オフラインでもしっかり稼ぐ'),
  makeSlime('blue', 4, 'タイダル', 'epic', 40, 20.0, 'merge_magnet', '#0D47A1', '#1565C0', '#01579B', '潮流のように周囲を引き寄せる'),
  makeSlime('blue', 5, 'ポセイドン', 'legendary', 50, 50.0, 'speedy', '#01579B', '#0277BD', '#002F5B', '海神の加護で高速移動する'),
  makeSlime('blue', 6, '深淵スライム', 'mythic', 60, 150.0, 'golden', '#006064', '#00838F', '#004D40', '深海の底から現れた神秘のスライム'),
];

const RED_SLIMES: SlimeMaster[] = [
  makeSlime('red', 1, 'あかりん', 'common', 20, 1.0, 'none', '#F44336', '#EF5350', '#C62828', '情熱的な赤いスライム'),
  makeSlime('red', 2, 'ほのおん', 'uncommon', 26, 3.0, 'none', '#D32F2F', '#E53935', '#B71C1C', '炎を纏うスライム'),
  makeSlime('red', 3, 'マグマン', 'rare', 32, 8.0, 'split_bonus', '#C62828', '#D32F2F', '#B71C1C', 'マグマの力で3体に分裂できる'),
  makeSlime('red', 4, 'インフェルノ', 'epic', 40, 20.0, 'coin_boost', '#B71C1C', '#C62828', '#BF360C', '地獄の炎でコインを錬成する'),
  makeSlime('red', 5, 'フェニックス', 'legendary', 50, 50.0, 'lucky', '#BF360C', '#E65100', '#8B1400', '不死鳥の幸運で奇跡の進化を起こす'),
  makeSlime('red', 6, '灼熱龍スライム', 'mythic', 60, 150.0, 'golden', '#E65100', '#FF6D00', '#BF360C', '灼熱の龍が宿りし最強の炎スライム'),
];

const YELLOW_SLIMES: SlimeMaster[] = [
  makeSlime('yellow', 1, 'きいろん', 'common', 20, 1.0, 'none', '#FFEB3B', '#FFF176', '#F9A825', 'ぴかぴか光る元気なスライム'),
  makeSlime('yellow', 2, 'でんきん', 'uncommon', 26, 3.0, 'none', '#FBC02D', '#FFD54F', '#F57F17', '電気をビリビリ放つスライム'),
  makeSlime('yellow', 3, 'サンダー', 'rare', 32, 8.0, 'speedy', '#F9A825', '#FBC02D', '#F57F17', '雷速で駆け回るスライム'),
  makeSlime('yellow', 4, 'ボルテック', 'epic', 40, 20.0, 'split_bonus', '#F57F17', '#F9A825', '#FF6F00', '電圧の力で3体に分裂できる'),
  makeSlime('yellow', 5, 'トールスライム', 'legendary', 50, 50.0, 'merge_magnet', '#FF6F00', '#FF8F00', '#E65100', '雷神の力で周囲を引き寄せる'),
  makeSlime('yellow', 6, '万雷帝スライム', 'mythic', 60, 150.0, 'golden', '#E65100', '#FF6D00', '#BF360C', '万の雷を従える究極の雷スライム'),
];

const PURPLE_SLIMES: SlimeMaster[] = [
  makeSlime('purple', 1, 'むらさきん', 'common', 20, 1.0, 'none', '#9C27B0', '#BA68C8', '#7B1FA2', '妖しい紫色のスライム'),
  makeSlime('purple', 2, 'どくりん', 'uncommon', 26, 3.0, 'none', '#7B1FA2', '#9C27B0', '#6A1B9A', '毒霧を纏うスライム'),
  makeSlime('purple', 3, 'ポイズナー', 'rare', 32, 8.0, 'aura', '#6A1B9A', '#7B1FA2', '#4A148C', '毒のオーラで周囲を強化する'),
  makeSlime('purple', 4, 'ヴェノム', 'epic', 40, 20.0, 'offline_boost', '#4A148C', '#6A1B9A', '#311B92', '猛毒の力でオフラインでも稼ぐ'),
  makeSlime('purple', 5, 'ナイトメア', 'legendary', 50, 50.0, 'lucky', '#311B92', '#4527A0', '#1A237E', '悪夢の幸運で奇跡を起こす'),
  makeSlime('purple', 6, '冥界スライム', 'mythic', 60, 150.0, 'golden', '#1A237E', '#283593', '#0D1259', '冥界の王が宿りし究極の闇スライム'),
];

const PINK_SLIMES: SlimeMaster[] = [
  makeSlime('pink', 1, 'ぴんくりん', 'common', 20, 1.0, 'none', '#E91E63', '#F06292', '#C2185B', '可愛いピンク色のスライム'),
  makeSlime('pink', 2, 'はなりん', 'uncommon', 26, 3.0, 'none', '#C2185B', '#E91E63', '#AD1457', '花の香りがするスライム'),
  makeSlime('pink', 3, 'ブルーミー', 'rare', 32, 8.0, 'coin_boost', '#AD1457', '#C2185B', '#880E4F', '満開の力でコイン生成+50%'),
  makeSlime('pink', 4, 'サクラスライム', 'epic', 40, 20.0, 'aura', '#880E4F', '#AD1457', '#6D0A3C', '桜のオーラで周囲を強化する'),
  makeSlime('pink', 5, 'エンプレス', 'legendary', 50, 50.0, 'offline_boost', '#F06292', '#F48FB1', '#E91E63', '女帝の威光でオフラインでも稼ぐ'),
  makeSlime('pink', 6, '桜花天スライム', 'mythic', 60, 150.0, 'golden', '#FF80AB', '#FF4081', '#F50057', '桜花の天界から降臨した究極スライム'),
];

// Special slimes
const SPECIAL_SLIMES: SlimeMaster[] = [
  {
    id: 'special_rainbow',
    name: 'にじりん',
    colorFamily: 'green', // placeholder, rainbow can merge with any
    rarity: 'mythic',
    tier: 7,
    baseColor: '#FF6B6B',
    highlightColor: '#FFE66D',
    shadowColor: '#4ECDC4',
    baseRadius: 55,
    coinsPerMinute: 200.0,
    ability: 'rainbow',
    description: '全ての色と合体できる虹のスライム。全6色のMythicを合成すると現れる',
    mergeFromIds: null,
  },
  {
    id: 'special_king',
    name: 'キングスライム',
    colorFamily: 'green', // placeholder
    rarity: 'mythic',
    tier: 7,
    baseColor: '#FFD700',
    highlightColor: '#FFED4A',
    shadowColor: '#CC9900',
    baseRadius: 65,
    coinsPerMinute: 300.0,
    ability: 'giant',
    description: '図鑑コンプリートで現れるスライムの王。巨大でコイン2倍',
    mergeFromIds: null,
  },
];

export const ALL_SLIMES: SlimeMaster[] = [
  ...GREEN_SLIMES,
  ...BLUE_SLIMES,
  ...RED_SLIMES,
  ...YELLOW_SLIMES,
  ...PURPLE_SLIMES,
  ...PINK_SLIMES,
  ...SPECIAL_SLIMES,
];

export const SLIME_MASTER: Record<string, SlimeMaster> = {};
for (const slime of ALL_SLIMES) {
  SLIME_MASTER[slime.id] = slime;
}

export const COLOR_FAMILIES: SlimeColorFamily[] = ['green', 'blue', 'red', 'yellow', 'purple', 'pink'];

export const NORMAL_SLIME_COUNT = 36;
export const TOTAL_SLIME_COUNT = 38;
