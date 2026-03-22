import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useGameStore } from '../src/store/gameStore';

export default function RootLayout() {
  const initGame = useGameStore(s => s.initGame);

  useEffect(() => {
    initGame();
  }, []);

  return (
    <>
      <Head>
        <title>スライム牧場 - 放置マージゲーム 全36種スライムを育てよう</title>
        <meta name="description" content="スライムを合体させて進化！自動でコインを稼ぐ放置型マージゲーム。レアスライムを集めて図鑑を完成させよう。" />
        <meta property="og:title" content="スライム牧場 🐌 放置マージゲーム" />
        <meta property="og:description" content="スライムを合体させて進化！自動でコインを稼ぐ放置型マージゲーム。" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://slime-ranch.vercel.app" />
        <meta property="og:image" content="https://slime-ranch.vercel.app/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="スライム牧場 🐌 放置マージゲーム" />
        <meta name="twitter:image" content="https://slime-ranch.vercel.app/og-image.png" />
      </Head>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
