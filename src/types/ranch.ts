/** Ranch slot state */
export type SlotState = 'locked' | 'unlocked' | 'decorated';

/** Decoration item ID */
export type DecorationId =
  | 'flower_bed'
  | 'mushroom_ring'
  | 'crystal_pond'
  | 'rainbow_arch'
  | 'golden_tree'
  | 'fairy_lamp'
  | 'hot_spring'
  | 'ancient_stone'
  | 'wind_chime'
  | 'star_fountain';

/** Ranch bonus */
export interface RanchBonus {
  type: 'coin_rate' | 'merge_chance' | 'offline_rate' | 'spawn_rate';
  multiplier: number;
}

/** Ranch slot */
export interface RanchSlot {
  slotId: number;
  state: SlotState;
  unlockCost: number;
  decoration: DecorationId | null;
  bonus: RanchBonus | null;
}

/** Background theme */
export type BackgroundTheme =
  | 'meadow'
  | 'forest'
  | 'beach'
  | 'volcano'
  | 'sky_garden'
  | 'crystal_cave';

/** Ranch state */
export interface RanchState {
  slots: RanchSlot[];
  maxSlimes: number;
  backgroundTheme: BackgroundTheme;
}
