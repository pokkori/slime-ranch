import React, { useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, PanResponder, GestureResponderEvent, PanResponderGestureState, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { SlimeInstance } from '../types/slime';
import { SLIME_MASTER } from '../constants/slimes';
import { RARITY_COLORS } from '../constants/colors';

interface SlimeBlobProps {
  slime: SlimeInstance;
  onTap: (instanceId: string) => void;
  onLongPress?: (instanceId: string) => void;
  onDragStart?: (instanceId: string) => void;
  onDragMove?: (instanceId: string, x: number, y: number) => void;
  onDragEnd?: (instanceId: string, x: number, y: number) => void;
}

export const SlimeBlob: React.FC<SlimeBlobProps> = React.memo(({
  slime,
  onTap,
  onLongPress,
  onDragStart,
  onDragMove,
  onDragEnd,
}) => {
  const master = SLIME_MASTER[slime.masterId];
  if (!master) return null;

  const scale = useSharedValue(slime.isNew ? 0.3 : 1);
  const wobble = useSharedValue(0);
  const auraRotation = useSharedValue(0);
  const radius = master.baseRadius;
  const tier = master.tier;

  const isDraggingRef = useRef(false);
  const dragOffsetXRef = useRef(0);
  const dragOffsetYRef = useRef(0);

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

  // Rainbow aura rotation for Tier 6 (Legend)
  useEffect(() => {
    if (tier >= 6) {
      auraRotation.value = withRepeat(
        withTiming(360, { duration: 3000, easing: Easing.linear }),
        -1,
        false,
      );
    }
  }, [tier]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => {
        return Math.abs(gs.dx) > 5 || Math.abs(gs.dy) > 5;
      },
      onPanResponderGrant: () => {
        isDraggingRef.current = false;
        dragOffsetXRef.current = 0;
        dragOffsetYRef.current = 0;
      },
      onPanResponderMove: (_, gs) => {
        const totalMove = Math.abs(gs.dx) + Math.abs(gs.dy);
        if (!isDraggingRef.current && totalMove > 8) {
          isDraggingRef.current = true;
          scale.value = withSpring(1.3, { damping: 12, stiffness: 200 });
          if (onDragStart) onDragStart(slime.instanceId);
        }
        if (isDraggingRef.current) {
          dragOffsetXRef.current = gs.dx;
          dragOffsetYRef.current = gs.dy;
          if (onDragMove) {
            onDragMove(slime.instanceId, slime.x + gs.dx, slime.y + gs.dy);
          }
        }
      },
      onPanResponderRelease: (_, gs) => {
        if (isDraggingRef.current) {
          if (onDragEnd) {
            onDragEnd(slime.instanceId, slime.x + gs.dx, slime.y + gs.dy);
          }
          scale.value = withSpring(1, { damping: 12, stiffness: 200 });
        } else {
          // It was a tap
          scale.value = withSequence(
            withTiming(1.2, { duration: 80 }),
            withSpring(1, { damping: 10, stiffness: 300, mass: 0.8 }),
          );
          onTap(slime.instanceId);
        }
        isDraggingRef.current = false;
        dragOffsetXRef.current = 0;
        dragOffsetYRef.current = 0;
      },
      onPanResponderTerminate: () => {
        isDraggingRef.current = false;
        scale.value = withSpring(1);
      },
    })
  ).current;

  const animatedStyle = useAnimatedStyle(() => {
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

  const auraStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${auraRotation.value}deg` }],
  }));

  // Glow for rarity
  const glowColor = tier >= 5 ? '#FFD700' : tier >= 3 ? '#64B5F6' : 'transparent';
  const showGlow = tier >= 3;

  // Eye size scales with tier
  const eyeWidth = tier >= 2 ? radius * 0.28 : radius * 0.24;
  const eyeHeight = tier >= 2 ? radius * 0.34 : radius * 0.30;

  const rarityColor = RARITY_COLORS[master.rarity] || '#9E9E9E';

  return (
    <Animated.View
      {...panResponder.panHandlers}
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

      {/* Tier 6 Legend: Rainbow aura ring */}
      {tier >= 6 && (
        <Animated.View style={[styles.auraRing, {
          width: radius * 2.6,
          height: radius * 2.6,
          borderRadius: radius * 1.3,
          top: -radius * 0.3,
          left: -radius * 0.3,
        }, auraStyle]}>
          <View style={[styles.auraSegment, {
            width: radius * 2.6,
            height: radius * 2.6,
            borderRadius: radius * 1.3,
            borderTopColor: '#FF6B6B',
            borderRightColor: '#FFD93D',
            borderBottomColor: '#6BCB77',
            borderLeftColor: '#4D96FF',
          }]} />
        </Animated.View>
      )}

      {/* Tier 5 Elder: Crown (3 yellow triangles) */}
      {tier >= 5 && (
        <View style={[styles.crownContainer, { top: -radius * 0.35 }]}>
          <View style={[styles.crownTriangle, {
            borderLeftWidth: radius * 0.1,
            borderRightWidth: radius * 0.1,
            borderBottomWidth: radius * 0.2,
            left: -radius * 0.15,
          }]} />
          <View style={[styles.crownTriangle, {
            borderLeftWidth: radius * 0.12,
            borderRightWidth: radius * 0.12,
            borderBottomWidth: radius * 0.25,
          }]} />
          <View style={[styles.crownTriangle, {
            borderLeftWidth: radius * 0.1,
            borderRightWidth: radius * 0.1,
            borderBottomWidth: radius * 0.2,
            right: -radius * 0.15,
          }]} />
        </View>
      )}

      {/* Tier 4 Adult: Wings (left and right triangles) */}
      {tier >= 4 && tier < 5 && (
        <>
          <View style={[styles.wingLeft, {
            borderRightWidth: radius * 0.4,
            borderTopWidth: radius * 0.25,
            borderBottomWidth: radius * 0.25,
            left: -radius * 0.35,
            top: radius * 0.5,
          }]} />
          <View style={[styles.wingRight, {
            borderLeftWidth: radius * 0.4,
            borderTopWidth: radius * 0.25,
            borderBottomWidth: radius * 0.25,
            right: -radius * 0.35,
            top: radius * 0.5,
          }]} />
        </>
      )}

      {/* Tier 3 Teen: Horns (two small triangles on top) */}
      {tier >= 3 && tier < 5 && (
        <>
          <View style={[styles.hornLeft, {
            borderLeftWidth: radius * 0.08,
            borderRightWidth: radius * 0.08,
            borderBottomWidth: radius * 0.22,
            left: radius * 0.3,
            top: -radius * 0.15,
          }]} />
          <View style={[styles.hornRight, {
            borderLeftWidth: radius * 0.08,
            borderRightWidth: radius * 0.08,
            borderBottomWidth: radius * 0.22,
            right: radius * 0.3,
            top: -radius * 0.15,
          }]} />
        </>
      )}

      {/* Body */}
      <View style={[styles.body, {
        width: radius * 2,
        height: radius * 2,
        borderRadius: radius,
        backgroundColor: master.baseColor,
      }]}>
        {/* Highlight */}
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
            width: eyeWidth,
            height: eyeHeight,
            borderRadius: eyeWidth / 2,
            marginHorizontal: radius * 0.1,
          }]}>
            <View style={[styles.pupil, {
              width: radius * 0.14,
              height: radius * 0.14,
              borderRadius: radius * 0.07,
            }]} />
          </View>
          <View style={[styles.eye, {
            width: eyeWidth,
            height: eyeHeight,
            borderRadius: eyeWidth / 2,
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

        {/* Cheeks - enhanced for Tier 2+ */}
        <View style={[styles.cheek, {
          width: tier >= 2 ? radius * 0.24 : radius * 0.2,
          height: tier >= 2 ? radius * 0.16 : radius * 0.12,
          borderRadius: tier >= 2 ? radius * 0.08 : radius * 0.06,
          backgroundColor: tier >= 2 ? 'rgba(255,120,120,0.5)' : 'rgba(255,150,150,0.3)',
          left: radius * 0.12,
          top: radius * 1.05,
        }]} />
        <View style={[styles.cheek, {
          width: tier >= 2 ? radius * 0.24 : radius * 0.2,
          height: tier >= 2 ? radius * 0.16 : radius * 0.12,
          borderRadius: tier >= 2 ? radius * 0.08 : radius * 0.06,
          backgroundColor: tier >= 2 ? 'rgba(255,120,120,0.5)' : 'rgba(255,150,150,0.3)',
          right: radius * 0.12,
          top: radius * 1.05,
        }]} />
      </View>

      {/* Tier badge (bottom-right) */}
      <View style={[styles.tierBadge, {
        right: -2,
        bottom: radius * 0.1,
        width: radius * 0.5,
        height: radius * 0.5,
        borderRadius: radius * 0.25,
        backgroundColor: rarityColor,
      }]}>
        <Text style={[styles.tierBadgeText, {
          fontSize: Math.max(radius * 0.28, 8),
        }]}>{tier}</Text>
      </View>
    </Animated.View>
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
  },
  // Tier 6: Rainbow aura ring
  auraRing: {
    position: 'absolute',
    zIndex: -1,
  },
  auraSegment: {
    borderWidth: 3,
    borderStyle: 'solid',
  },
  // Tier 5: Crown
  crownContainer: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    zIndex: 10,
  },
  crownTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFD700',
  },
  // Tier 4: Wings
  wingLeft: {
    position: 'absolute',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderRightColor: 'rgba(255,255,255,0.6)',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    zIndex: -1,
  },
  wingRight: {
    position: 'absolute',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftColor: 'rgba(255,255,255,0.6)',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    zIndex: -1,
  },
  // Tier 3: Horns
  hornLeft: {
    position: 'absolute',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFD54F',
    zIndex: 10,
    transform: [{ rotate: '-15deg' }],
  },
  hornRight: {
    position: 'absolute',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFD54F',
    zIndex: 10,
    transform: [{ rotate: '15deg' }],
  },
  // Tier badge
  tierBadge: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  tierBadgeText: {
    color: '#FFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
