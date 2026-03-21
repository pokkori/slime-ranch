/** Slime rarity */
export type SlimeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

/** Slime color family */
export type SlimeColorFamily =
  | 'green'   // Meadow
  | 'blue'    // Water
  | 'red'     // Fire
  | 'yellow'  // Thunder
  | 'purple'  // Poison
  | 'pink';   // Flower

/** Slime ability */
export type SlimeAbility =
  | 'none'
  | 'coin_boost'      // +50% coin generation
  | 'merge_magnet'     // Attracts nearby same-color
  | 'split_bonus'      // Split into 3 instead of 2
  | 'offline_boost'    // +100% offline coins
  | 'lucky'            // 10% chance to skip a tier on merge
  | 'aura'             // +25% coin generation for adjacent slimes
  | 'rainbow'          // Can merge with any color
  | 'giant'            // 1.5x size, 2x coins
  | 'speedy'           // 2x movement speed
  | 'golden';          // 3x coin generation

/** Slime master data */
export interface SlimeMaster {
  id: string;
  name: string;
  colorFamily: SlimeColorFamily;
  rarity: SlimeRarity;
  tier: number;                 // 1-6
  baseColor: string;            // HEX
  highlightColor: string;       // HEX
  shadowColor: string;          // HEX
  baseRadius: number;           // pixels (20-60)
  coinsPerMinute: number;
  ability: SlimeAbility;
  description: string;
  mergeFromIds: [string, string] | null;
}

/** In-game slime instance */
export interface SlimeInstance {
  instanceId: string;
  masterId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  wobblePhase: number;
  wobbleAmplitude: number;
  lastCoinTime: number;
  isNew: boolean;
  isMerging: boolean;
}

/** Encyclopedia entry */
export interface EncyclopediaEntry {
  masterId: string;
  discovered: boolean;
  discoveredAt: number | null;
  mergeCount: number;
}
