import { SlimeInstance } from '../types/slime';
import { SLIME_MASTER, COLOR_FAMILIES } from '../constants/slimes';

export function canMerge(a: SlimeInstance, b: SlimeInstance): boolean {
  if (a.isMerging || b.isMerging) return false;
  if (a.instanceId === b.instanceId) return false;

  const masterA = SLIME_MASTER[a.masterId];
  const masterB = SLIME_MASTER[b.masterId];
  if (!masterA || !masterB) return false;

  // Rainbow ability: can merge with any color
  if (masterA.ability === 'rainbow' || masterB.ability === 'rainbow') {
    return true;
  }

  return masterA.colorFamily === masterB.colorFamily && masterA.tier === masterB.tier;
}

export type MergeResult =
  | { type: 'evolve'; newMasterId: string }
  | { type: 'recycle'; count: number };

export function getMergeResult(a: SlimeInstance, b: SlimeInstance): MergeResult {
  const masterA = SLIME_MASTER[a.masterId];
  const masterB = SLIME_MASTER[b.masterId];

  // Rainbow merge
  if (masterA.ability === 'rainbow') {
    const nextTier = Math.min(masterB.tier + 1, 6);
    return { type: 'evolve', newMasterId: `${masterB.colorFamily}_${nextTier}` };
  }
  if (masterB.ability === 'rainbow') {
    const nextTier = Math.min(masterA.tier + 1, 6);
    return { type: 'evolve', newMasterId: `${masterA.colorFamily}_${nextTier}` };
  }

  // Tier 6 recycle
  if (masterA.tier === 6) {
    return { type: 'recycle', count: 3 };
  }

  // Lucky check
  const hasLucky = masterA.ability === 'lucky' || masterB.ability === 'lucky';
  const skipTier = hasLucky && Math.random() < 0.10;
  const nextTier = skipTier
    ? Math.min(masterA.tier + 2, 6)
    : masterA.tier + 1;

  return { type: 'evolve', newMasterId: `${masterA.colorFamily}_${nextTier}` };
}

export function getRandomTier1MasterId(): string {
  const family = COLOR_FAMILIES[Math.floor(Math.random() * COLOR_FAMILIES.length)];
  return `${family}_1`;
}
