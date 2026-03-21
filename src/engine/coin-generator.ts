import { SlimeInstance } from '../types/slime';
import { RanchState } from '../types/ranch';
import { SLIME_MASTER } from '../constants/slimes';

export interface CoinFloat {
  x: number;
  y: number;
  value: number;
  id: string;
}

export function tickCoinGeneration(
  slimes: SlimeInstance[],
  ranch: RanchState,
  now: number,
): { totalCoins: number; floatingCoins: CoinFloat[] } {
  let totalCoins = 0;
  const floatingCoins: CoinFloat[] = [];

  // Calculate slot bonus
  let slotBonus = 1.0;
  for (const slot of ranch.slots) {
    if (slot.bonus?.type === 'coin_rate') {
      slotBonus += slot.bonus.multiplier - 1.0;
    }
  }

  for (const slime of slimes) {
    if (slime.isMerging || slime.isNew) continue;

    const master = SLIME_MASTER[slime.masterId];
    if (!master) continue;

    const intervalMs = 60000 / master.coinsPerMinute;
    const elapsedMs = now - slime.lastCoinTime;

    if (elapsedMs >= intervalMs) {
      let coinValue = 1;

      // Ability bonuses
      if (master.ability === 'coin_boost') coinValue = Math.ceil(coinValue * 1.5);
      if (master.ability === 'golden') coinValue = coinValue * 3;
      if (master.ability === 'giant') coinValue = coinValue * 2;

      coinValue = Math.ceil(coinValue * slotBonus);

      totalCoins += coinValue;
      slime.lastCoinTime = now;

      floatingCoins.push({
        x: slime.x,
        y: slime.y - master.baseRadius - 10,
        value: coinValue,
        id: `coin_${slime.instanceId}_${now}`,
      });
    }
  }

  return { totalCoins, floatingCoins };
}
