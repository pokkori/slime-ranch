import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { SlimeInstance } from '../types/slime';
import { SLIME_MASTER } from '../constants/slimes';

interface SlimeBlobProps {
  slime: SlimeInstance;
  onTap: (instanceId: string) => void;
  onLongPress?: (instanceId: string) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const SlimeBlob: React.FC<SlimeBlobProps> = React.memo(({ slime, onTap, onLongPress }) => {
  const master = SLIME_MASTER[slime.masterId];
  if (!master) return null;

  const scale = useSharedValue(slime.isNew ? 0.3 : 1);
  const wobble = useSharedValue(0);
  const radius = master.baseRadius;

  useEffect(() => {
    if (slime.isNew) {
      scale.value = withSpring(1, { damping: 12, stiffness: 180, mass: 1 });
    }
  }, [slime.isNew]);

  useEffect(() => {
    wobble.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, []);

  const handleTap = () => {
    scale.value = withSequence(
      withTiming(1.2, { duration: 80 }),
      withSpring(1, { damping: 10, stiffness: 300, mass: 0.8 }),
    );
    onTap(slime.instanceId);
  };

  const handleLongPress = () => {
    if (onLongPress) onLongPress(slime.instanceId);
  };

  const animatedStyle = useAnimatedStyle(() => {
    const wobbleScale = interpolate(wobble.value, [0, 1], [0.96, 1.04]);
    const wobbleX = interpolate(wobble.value, [0, 1], [1.02, 0.98]);
    const wobbleY = interpolate(wobble.value, [0, 1], [0.98, 1.02]);

    return {
      transform: [
        { translateX: slime.x - radius },
        { translateY: slime.y - radius },
        { scaleX: scale.value * wobbleX },
        { scaleY: scale.value * wobbleY },
      ],
    };
  });

  // Rarity glow
  const glowColor = master.tier >= 5 ? '#FFD700' : master.tier >= 3 ? '#64B5F6' : 'transparent';
  const showGlow = master.tier >= 3;

  return (
    <AnimatedPressable
      onPress={handleTap}
      onLongPress={handleLongPress}
      style={[styles.container, { width: radius * 2, height: radius * 2 }, animatedStyle]}
    >
      {/* Shadow */}
      <View style={[styles.shadow, {
        width: radius * 1.6,
        height: radius * 0.4,
        borderRadius: radius * 0.8,
        bottom: -radius * 0.1,
        left: radius * 0.2,
      }]} />

      {/* Glow for rare+ */}
      {showGlow && (
        <View style={[styles.glow, {
          width: radius * 2.4,
          height: radius * 2.4,
          borderRadius: radius * 1.2,
          backgroundColor: glowColor,
          top: -radius * 0.2,
          left: -radius * 0.2,
        }]} />
      )}

      {/* Body */}
      <View style={[styles.body, {
        width: radius * 2,
        height: radius * 2,
        borderRadius: radius,
        backgroundColor: master.baseColor,
      }]}>
        {/* Gradient overlay */}
        <View style={[styles.highlight, {
          width: radius * 1.2,
          height: radius * 1.2,
          borderRadius: radius * 0.6,
          backgroundColor: master.highlightColor,
          top: radius * 0.1,
          left: radius * 0.1,
        }]} />

        {/* Eyes */}
        <View style={styles.eyesContainer}>
          <View style={[styles.eye, {
            width: radius * 0.24,
            height: radius * 0.30,
            borderRadius: radius * 0.12,
            marginHorizontal: radius * 0.1,
          }]}>
            <View style={[styles.pupil, {
              width: radius * 0.14,
              height: radius * 0.14,
              borderRadius: radius * 0.07,
            }]} />
          </View>
          <View style={[styles.eye, {
            width: radius * 0.24,
            height: radius * 0.30,
            borderRadius: radius * 0.12,
            marginHorizontal: radius * 0.1,
          }]}>
            <View style={[styles.pupil, {
              width: radius * 0.14,
              height: radius * 0.14,
              borderRadius: radius * 0.07,
            }]} />
          </View>
        </View>

        {/* Mouth */}
        <View style={[styles.mouth, {
          width: radius * 0.3,
          height: radius * 0.15,
          borderBottomLeftRadius: radius * 0.15,
          borderBottomRightRadius: radius * 0.15,
        }]} />

        {/* Cheeks for cute slimes */}
        <View style={[styles.cheek, {
          width: radius * 0.2,
          height: radius * 0.12,
          borderRadius: radius * 0.06,
          left: radius * 0.15,
          top: radius * 1.1,
        }]} />
        <View style={[styles.cheek, {
          width: radius * 0.2,
          height: radius * 0.12,
          borderRadius: radius * 0.06,
          right: radius * 0.15,
          top: radius * 1.1,
        }]} />
      </View>
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
  shadow: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  glow: {
    position: 'absolute',
    opacity: 0.2,
  },
  body: {
    position: 'absolute',
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    opacity: 0.4,
  },
  eyesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    width: '100%',
    top: '30%',
  },
  eye: {
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pupil: {
    backgroundColor: '#333333',
  },
  mouth: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignSelf: 'center',
    top: '60%',
  },
  cheek: {
    position: 'absolute',
    backgroundColor: 'rgba(255,150,150,0.3)',
  },
});
