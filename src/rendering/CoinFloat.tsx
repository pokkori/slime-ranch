import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

interface CoinFloatProps {
  x: number;
  y: number;
  value: number;
  onComplete: () => void;
}

export const CoinFloat: React.FC<CoinFloatProps> = ({ x, y, value, onComplete }) => {
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withTiming(-40, { duration: 1000, easing: Easing.out(Easing.quad) });
    opacity.value = withDelay(600, withTiming(0, { duration: 400 }, (finished) => {
      if (finished) {
        runOnJS(onComplete)();
      }
    }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: x - 20 },
      { translateY: y + translateY.value },
    ],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text style={styles.text}>+{value}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 100,
  },
  text: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 14,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
