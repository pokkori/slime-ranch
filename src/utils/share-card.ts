/**
 * Canvas OGP share card generator.
 * Generates a 1200x630 image with ranch info for social sharing.
 */
import { Platform } from 'react-native';
import { SLIME_MASTER } from '../constants/slimes';
import { BACKGROUND_COLORS } from '../constants/colors';
import { MILESTONES } from '../constants/milestones';
import { SlimeInstance } from '../types/slime';
import { BackgroundTheme } from '../types/ranch';

interface ShareCardParams {
  slimes: SlimeInstance[];
  backgroundTheme: BackgroundTheme;
  ranchRank: number;
  discoveredCount: number;
  totalCount: number;
  highestTierReached: number;
  todayMergeCount?: number;
  todayCoins?: number;
}

/**
 * Generate a 1200x630 OGP card as a data URL using HTML Canvas.
 * Returns null on non-web platforms or if Canvas is unavailable.
 */
export async function generateShareCard(params: ShareCardParams): Promise<string | null> {
  if (Platform.OS !== 'web') return null;
  if (typeof document === 'undefined') return null;

  const { slimes, backgroundTheme, ranchRank, discoveredCount, totalCount, highestTierReached, todayMergeCount, todayCoins } = params;

  const W = 1200;
  const H = 630;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Background gradient using theme colors
  const bgColors = BACKGROUND_COLORS[backgroundTheme] || BACKGROUND_COLORS.meadow;
  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, bgColors.top);
  gradient.addColorStop(0.6, bgColors.bottom);
  gradient.addColorStop(1, bgColors.ground);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  // Draw slimes (up to 12 for visual balance)
  const displaySlimes = slimes.slice(0, 12);
  for (let i = 0; i < displaySlimes.length; i++) {
    const s = displaySlimes[i];
    const master = SLIME_MASTER[s.masterId];
    if (!master) continue;

    // Map slime positions to card coordinates
    const cx = 100 + (i % 6) * 160 + 40;
    const cy = 180 + Math.floor(i / 6) * 140 + 40;
    const r = master.baseRadius * 1.8;

    // Body
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = master.baseColor;
    ctx.fill();

    // Highlight
    ctx.beginPath();
    ctx.arc(cx - r * 0.2, cy - r * 0.2, r * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = master.highlightColor + '40';
    ctx.fill();

    // Eyes
    const eyeOffX = r * 0.25;
    const eyeY = cy - r * 0.1;
    // White
    ctx.beginPath();
    ctx.ellipse(cx - eyeOffX, eyeY, r * 0.18, r * 0.22, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + eyeOffX, eyeY, r * 0.18, r * 0.22, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    // Pupils
    ctx.beginPath();
    ctx.arc(cx - eyeOffX, eyeY + r * 0.02, r * 0.1, 0, Math.PI * 2);
    ctx.fillStyle = '#333333';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + eyeOffX, eyeY + r * 0.02, r * 0.1, 0, Math.PI * 2);
    ctx.fillStyle = '#333333';
    ctx.fill();

    // Mouth
    ctx.beginPath();
    ctx.arc(cx, cy + r * 0.2, r * 0.15, 0, Math.PI);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fill();
  }

  // Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 8;
  ctx.fillText('\u{1F40C} \u30B9\u30E9\u30A4\u30E0\u7267\u5834', W / 2, 60);

  // Rank info
  const milestone = MILESTONES.find(m => m.rank === ranchRank);
  const rankName = milestone ? milestone.name : '\u306F\u3058\u3081\u305F\u3070\u304B\u308A';
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText(`\u30E9\u30F3\u30AF${ranchRank}: ${rankName}`, W / 2, 110);

  // Top5 slimes bubble visualization (R8)
  const top5 = slimes
    .slice()
    .sort((a, b) => (SLIME_MASTER[b.masterId]?.tier ?? 0) - (SLIME_MASTER[a.masterId]?.tier ?? 0))
    .slice(0, 5);

  top5.forEach((slime, i) => {
    const master = SLIME_MASTER[slime.masterId];
    if (!master) return;
    const cx = 880 + (i % 3) * 120;
    const cy = 200 + Math.floor(i / 3) * 120;
    const r = 40 + master.tier * 4;
    const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
    grad.addColorStop(0, master.highlightColor);
    grad.addColorStop(1, master.baseColor);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    // Tier label
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${14 + master.tier}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`Tier${master.tier}`, cx, cy + 5);
  });

  // Stats bar at bottom
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, H - 120, W, 120);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    `\u56F3\u9451 ${discoveredCount}/${totalCount}\u7A2E | \u6700\u9AD8Tier: ${highestTierReached} | \u30B9\u30E9\u30A4\u30E0: ${slimes.length}\u4F53`,
    W / 2,
    H - 75,
  );

  // Today's merge count badge (R8)
  if (todayMergeCount !== undefined && todayMergeCount > 0) {
    ctx.fillStyle = 'rgba(255,215,0,0.2)';
    ctx.beginPath();
    (ctx as CanvasRenderingContext2D & { roundRect: (x: number, y: number, w: number, h: number, r: number) => void }).roundRect(40, H - 120, 320, 65, 10);
    ctx.fill();
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`\u2728 \u4ECA\u65E5\u306E\u5408\u4F53: ${todayMergeCount}\u56DE`, 60, H - 77);
  }

  // Hashtag強化 (R8)
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('#\u30B9\u30E9\u30A4\u30E0\u7267\u5834 #\u653E\u7F6E\u30B2\u30FC\u30E0 #\u30B9\u30E9\u30A4\u30E0 #\u5408\u4F53', W / 2, H - 30);

  return canvas.toDataURL('image/png');
}

/**
 * Share the generated card via navigator.share or clipboard fallback.
 */
export async function shareCard(dataUrl: string, text: string): Promise<void> {
  if (Platform.OS !== 'web') return;

  try {
    // Try to convert data URL to blob for sharing
    if (navigator.share) {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'slime-ranch.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          text,
          files: [file],
        });
        return;
      }

      // Fallback: share text only
      await navigator.share({ text });
      return;
    }

    // Clipboard fallback
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }
  } catch {
    // User cancelled or not supported
  }
}
