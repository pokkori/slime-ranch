import { RanchSlot } from '../types/ranch';

export const INITIAL_RANCH_SLOTS: RanchSlot[] = [
  { slotId: 0, state: 'unlocked', unlockCost: 0, decoration: null, bonus: null },
  { slotId: 1, state: 'locked', unlockCost: 500, decoration: null, bonus: null },
  { slotId: 2, state: 'locked', unlockCost: 1000, decoration: null, bonus: null },
  { slotId: 3, state: 'locked', unlockCost: 2000, decoration: null, bonus: null },
  { slotId: 4, state: 'unlocked', unlockCost: 0, decoration: null, bonus: null },
  { slotId: 5, state: 'locked', unlockCost: 500, decoration: null, bonus: null },
  { slotId: 6, state: 'locked', unlockCost: 1500, decoration: null, bonus: null },
  { slotId: 7, state: 'locked', unlockCost: 3000, decoration: null, bonus: null },
  { slotId: 8, state: 'locked', unlockCost: 1000, decoration: null, bonus: null },
  { slotId: 9, state: 'locked', unlockCost: 2000, decoration: null, bonus: null },
  { slotId: 10, state: 'locked', unlockCost: 3000, decoration: null, bonus: null },
  { slotId: 11, state: 'locked', unlockCost: 5000, decoration: null, bonus: null },
  { slotId: 12, state: 'locked', unlockCost: 2000, decoration: null, bonus: null },
  { slotId: 13, state: 'locked', unlockCost: 3000, decoration: null, bonus: null },
  { slotId: 14, state: 'locked', unlockCost: 5000, decoration: null, bonus: null },
  { slotId: 15, state: 'locked', unlockCost: 10000, decoration: null, bonus: null },
];

export const SLIMES_PER_SLOT = 5;
export const INITIAL_UNLOCKED_SLOTS = 2;
export const INITIAL_MAX_SLIMES = INITIAL_UNLOCKED_SLOTS * SLIMES_PER_SLOT;
