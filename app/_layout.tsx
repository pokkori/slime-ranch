import { Stack } from 'expo-router';
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
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
