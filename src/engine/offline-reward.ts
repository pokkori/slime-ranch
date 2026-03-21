import { SlimeInstanceSave, ActiveBooster } from '../types/storage';
import { RanchState } from '../types/ranch';
import { SLIME_MASTER } from '../constants/slimes';

export interface OfflineRewardResult {
  coins: number;
  elapsedSeconds: number;
  breakdown: {
    baseCoins: number;
    abilityBonus: number;
    decorationBonus: number;
    boosterBonus: number;
  };
}

const MAX_OFFLINE_FREE = 14400; // 4 hours
const OFFLINE_EFFICIENCY = 0.70;

export function calculateOfflineReward(
  slimes: SlimeInstanceSave[],
  ranch: RanchState,
  activeBoosters: ActiveBooster[],
  lastActiveAt: Date,
  now: Date,
): OfflineRewardResult {
  const elapsedSeconds = Math.floor((now.getTime() - lastActiveAt.getTime()) / 1000);
  if (elapsedSeconds <= 60) {
    return { coins: 0, elapsedSeconds: 0, breakdown: { baseCoins: 0, abilityBonus: 0, decorationBonus: 0, boosterBonus: 0 } };
  }

  const cappedSeconds = Math.min(elapsedSeconds, MAX_OFFLINE_FREE);
  const elapsedMinutes = cappedSeconds / 60;

  // 1. Base coins
  let baseCoins = 0;
  for (const slime of slimes) {
    const master = SLIME_MASTER[slime.masterId];
    if (master) {
      baseCoins += master.coinsPerMinute * elapsedMinutes;
    }
  }

  // 2. Ability bonus
  let abilityBonus = 0;
  for (const slime of slimes) {
    const master = SLIME_MASTER[slime.masterId];
    if (!master) continue;
    if (master.ability === 'offline_boost') {
      abilityBonus += master.coinsPerMinute * elapsedMinutes;
    }
    if (master.ability === 'aura') {
      abilityBonus += baseCoins * 0.05;
    }
    if (master.ability === 'golden') {
      abilityBonus += master.coinsPerMinute * elapsedMinutes * 2;
    }
  }

  // 3. Decoration bonus
  let decorationMultiplier = 1.0;
  for (const slot of ranch.slots) {
    if (slot.bonus && slot.bonus.type === 'offline_rate') {
      decorationMultiplier += slot.bonus.multiplier - 1.0;
    }
    if (slot.bonus && slot.bonus.type === 'coin_rate') {
      decorationMultiplier += (slot.bonus.multiplier - 1.0) * 0.5;
    }
  }
  const decorationBonus = (baseCoins + abilityBonus) * (decorationMultiplier - 1.0);

  // 4. Booster bonus
  let boosterMultiplier = 1.0;
  for (const booster of activeBoosters) {
    if (new Date(booster.expiresAt) > lastActiveAt) {
      const boosterEnd = new Date(booster.expiresAt);
      const overlapSeconds = Math.max(0,
        Math.min(boosterEnd.getTime(), now.getTime()) - lastActiveAt.getTime()
      ) / 1000;
      const overlapRatio = overlapSeconds / cappedSeconds;
      if (booster.type === 'offline_boost' || booster.type === 'coin_boost') {
        boosterMultiplier += (booster.multiplier - 1.0) * overlapRatio;
      }
    }
  }
  const subtotal = baseCoins + abilityBonus + decorationBonus;
  const boosterBonus = subtotal * (boosterMultiplier - 1.0);

  const totalCoins = Math.floor((subtotal + boosterBonus) * OFFLINE_EFFICIENCY);

  return {
    coins: totalCoins,
    elapsedSeconds: cappedSeconds,
    breakdown: {
      baseCoins: Math.floor(baseCoins * OFFLINE_EFFICIENCY),
      abilityBonus: Math.floor(abilityBonus * OFFLINE_EFFICIENCY),
      decorationBonus: Math.floor(decorationBonus * OFFLINE_EFFICIENCY),
      boosterBonus: Math.floor(boosterBonus * OFFLINE_EFFICIENCY),
    },
  };
}
