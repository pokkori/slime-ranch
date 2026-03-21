import { DecorationId, BackgroundTheme } from './ranch';

/** Shop category */
export type ShopCategory = 'decoration' | 'background' | 'booster' | 'expansion';

/** Shop effect */
export type ShopEffect =
  | { type: 'decoration'; decorationId: DecorationId }
  | { type: 'background'; theme: BackgroundTheme }
  | { type: 'slot_unlock'; slotCount: number }
  | { type: 'max_slime_up'; amount: number }
  | { type: 'coin_boost'; multiplier: number; durationMinutes: number }
  | { type: 'offline_boost'; multiplier: number; durationMinutes: number }
  | { type: 'auto_merge'; durationMinutes: number };

/** Shop item */
export interface ShopItem {
  itemId: string;
  category: ShopCategory;
  name: string;
  description: string;
  costType: 'coin' | 'gem';
  cost: number;
  icon: string;
  effect: ShopEffect;
  purchased: boolean;
  maxPurchase: number;
  currentPurchaseCount: number;
}
