import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { useGameStore } from '../store/gameStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TUTORIAL_STEPS = [
  {
    emoji: '\u{1F449}',
    title: 'ドラッグで合体！',
    description: 'スライムを指でドラッグして\n同じ色のスライムにぶつけよう！',
  },
  {
    emoji: '\u2728',
    title: '合体で進化！',
    description: '同じ色・同じレベルのスライムが\n合体すると新しいスライムが生まれるよ！',
  },
  {
    emoji: '\u{1F4B0}',
    title: '放置でも稼げる！',
    description: 'スライムたちが自動でコインを\n稼いでくれるよ！放置してもOK！',
  },
];

export const TutorialOverlay: React.FC = () => {
  const tutorialDone = useGameStore(s => s.tutorialDone);
  const setTutorialDone = useGameStore(s => s.setTutorialDone);
  const [step, setStep] = useState(0);

  if (tutorialDone) return null;

  const currentStep = TUTORIAL_STEPS[step];
  const isLast = step === TUTORIAL_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      setTutorialDone();
    } else {
      setStep(step + 1);
    }
  };

  return (
    <View style={styles.overlay}>
      <Animated.View
        key={step}
        entering={FadeIn.duration(300)}
        style={styles.card}
      >
        <Text style={styles.emoji}>{currentStep.emoji}</Text>
        <Text style={styles.title}>{currentStep.title}</Text>
        <Text style={styles.description}>{currentStep.description}</Text>

        <View style={styles.dotsRow}>
          {TUTORIAL_STEPS.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === step && styles.dotActive]}
            />
          ))}
        </View>

        <Pressable style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>
            {isLast ? 'はじめる！' : '次へ'}
          </Text>
        </Pressable>

        {!isLast && (
          <Pressable style={styles.skipButton} onPress={setTutorialDone}>
            <Text style={styles.skipText}>スキップ</Text>
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 32,
    width: 300,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DDD',
  },
  dotActive: {
    backgroundColor: '#4CAF50',
    width: 24,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
    minWidth: 160,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipButton: {
    marginTop: 12,
    paddingVertical: 8,
  },
  skipText: {
    color: '#999',
    fontSize: 13,
  },
});
