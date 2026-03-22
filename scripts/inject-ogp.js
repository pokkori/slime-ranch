#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const distIndexPath = path.join(__dirname, '..', 'dist', 'index.html');

if (!fs.existsSync(distIndexPath)) {
  console.log('dist/index.html not found. Skipping OGP injection.');
  process.exit(0);
}

let html = fs.readFileSync(distIndexPath, 'utf-8');

// 既に注入済みかチェック
if (html.includes('og:image')) {
  console.log('OGP tags already present. Skipping injection.');
  process.exit(0);
}

// og-image.pngをdistにコピー
const srcOgImage = path.join(__dirname, '..', 'public', 'og-image.png');
const destOgImage = path.join(__dirname, '..', 'dist', 'og-image.png');
if (fs.existsSync(srcOgImage) && !fs.existsSync(destOgImage)) {
  fs.copyFileSync(srcOgImage, destOgImage);
  console.log('Copied og-image.png to dist/');
}

const ogpTags = `
  <title>スライム牧場 - 放置マージゲーム 全36種スライムを育てよう</title>
  <meta name="description" content="スライムを合体させて進化！自動でコインを稼ぐ放置型マージゲーム。全36種のスライムを集めて図鑑を完成させよう。">
  <meta property="og:title" content="スライム牧場 🐌 放置マージゲーム">
  <meta property="og:description" content="スライムを合体させて進化！全36種スライムを集めよう。放置型マージゲーム。">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://slime-ranch.vercel.app">
  <meta property="og:image" content="https://slime-ranch.vercel.app/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="スライム牧場 🐌 放置マージゲーム">
  <meta name="twitter:description" content="スライムを合体させて進化！全36種スライムを集めよう">
  <meta name="twitter:image" content="https://slime-ranch.vercel.app/og-image.png">
  <link rel="canonical" href="https://slime-ranch.vercel.app">`;

html = html.replace('</head>', ogpTags + '\n</head>');
fs.writeFileSync(distIndexPath, html, 'utf-8');
console.log('OGP tags injected into dist/index.html successfully.');
