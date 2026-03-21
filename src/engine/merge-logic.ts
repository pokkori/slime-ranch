import { SlimeInstance } from '../types/slime';
import { SLIME_MASTER, COLOR_FAMILIES } from '../constants/slimes';

export const MERGE_DISTANCE = 60;

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

/** 3-match merge group result */
export interface MergeGroupResult {
  /** Instance IDs of slimes consumed (3 or 5) */
  consumedIds: string[];
  /** How many matched (3 or 5+) */
  matchCount: number;
  /** Result masterId after merge */
  resultMasterId: string;
  /** Coin multiplier (3x for 3-match, 5x for 5-match) */
  coinMultiplier: number;
  /** Number of tiers to jump (1 for 3-match, 2 for 5-match) */
  tierJump: number;
  /** Whether this is a 5-match (screen flash) */
  is5Match: boolean;
}

/**
 * Find a merge group around the target slime.
 * Looks for same-color same-tier slimes within MERGE_DISTANCE of the drop point.
 * Returns null if fewer than 3 matching slimes found.
 */
export function findMergeGroup(
  slimes: SlimeInstance[],
  targetSlime: SlimeInstance,
  dropX: number,
  dropY: number,
): MergeGroupResult | null {
  const targetMaster = SLIME_MASTER[targetSlime.masterId];
  if (!targetMaster) return null;

  // Rainbow slimes don't participate in 3-match
  if (targetMaster.ability === 'rainbow') return null;

  // Tier 6 can't merge up
  if (targetMaster.tier === 6) return null;

  // Find all same-color same-tier slimes near the drop point (including the dragged one)
  const candidates: SlimeInstance[] = [];

  for (const s of slimes) {
    if (s.isMerging) continue;
    const master = SLIME_MASTER[s.masterId];
    if (!master) continue;
    if (master.ability === 'rainbow') continue;
    if (master.colorFamily !== targetMaster.colorFamily || master.tier !== targetMaster.tier) continue;

    // Check distance from drop point
    const refX = s.instanceId === targetSlime.instanceId ? dropX : s.x;
    const refY = s.instanceId === targetSlime.instanceId ? dropY : s.y;
    const dx = refX - dropX;
    const dy = refY - dropY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // The dragged slime itself is at dist=0, others need to be within MERGE_DISTANCE
    if (s.instanceId === targetSlime.instanceId || dist < MERGE_DISTANCE) {
      candidates.push(s);
    }
  }

  if (candidates.length < 3) return null;

  const is5Match = candidates.length >= 5;
  const matchCount = is5Match ? candidates.length : 3;
  const consumedIds = candidates.slice(0, matchCount).map(s => s.instanceId);
  const tierJump = is5Match ? 2 : 1;
  const coinMultiplier = is5Match ? 5 : 3;
  const newTier = Math.min(targetMaster.tier + tierJump, 6);
  const resultMasterId = `${targetMaster.colorFamily}_${newTier}`;

  return {
    consumedIds,
    matchCount,
    resultMasterId,
    coinMultiplier,
    tierJump,
    is5Match,
  };
}
