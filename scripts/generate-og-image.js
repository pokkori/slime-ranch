const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const W = 1200, H = 630;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

const grad = ctx.createLinearGradient(0, 0, W, H);
grad.addColorStop(0, '#1B5E20');
grad.addColorStop(1, '#4CAF50');
ctx.fillStyle = grad;
ctx.fillRect(0, 0, W, H);

ctx.fillStyle = '#FFFFFF';
ctx.font = 'bold 90px sans-serif';
ctx.textAlign = 'center';
ctx.fillText('\u30B9\u30E9\u30A4\u30E0\u7267\u5834 \uD83D\uDC0C', W / 2, H / 2 - 60);

ctx.fillStyle = '#E8F5E9';
ctx.font = '48px sans-serif';
ctx.fillText('\u516836\u7A2E\u30B9\u30E9\u30A4\u30E0\u3092\u96C6\u3081\u3066\u56F3\u9451\u3092\u5B8C\u6210\u3055\u305B\u3088\u3046\uFF01', W / 2, H / 2 + 40);

ctx.fillStyle = 'rgba(255,255,255,0.7)';
ctx.font = '30px sans-serif';
ctx.fillText('#\u30B9\u30E9\u30A4\u30E0\u7267\u5834  #\u653E\u7F6E\u30B2\u30FC\u30E0  #\u30DE\u30FC\u30B8\u30B2\u30FC\u30E0', W / 2, H / 2 + 120);

const outDir = path.join(__dirname, '../public');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'og-image.png'), canvas.toBuffer('image/png'));
console.log('og-image.png generated!');
