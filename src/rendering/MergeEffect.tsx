import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { SLIME_MASTER } from '../constants/slimes';
import { RARITY_COLORS } from '../constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MergeEffectProps {
  resultMasterId: string;
  midX: number;
  midY: number;
  isRare: boolean;
  onComplete: () => void;
}

export const MergeEffect: React.FC<MergeEffectProps> = ({
  resultMasterId,
  midX,
  midY,
  isRare,
  onComplete,
}) => {
  const master = SLIME_MASTER[resultMasterId];
  if (!master) {
    onComplete();
    return null;
  }

  const flashOpacity = useSharedValue(0);
  const slimeScale = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const bgOpacity = useSharedValue(0);

  useEffect(() => {
    if (isRare) {
      // Full-screen rare merge animation
      bgOpacity.value = withTiming(0.7, { duration: 300 });
      flashOpacity.value = withSequence(
        withTiming(0.5, { duration: 200 }),
        withTiming(0, { duration: 200 }),
      );
      slimeScale.value = withDelay(200, withSequence(
        withTiming(1.4, { duration: 200, easing: Easing.out(Easing.quad) }),
        withTiming(0.85, { duration: 150 }),
        withTiming(1.1, { duration: 100 }),
        withSpring(1, { damping: 12, stiffness: 180 }),
      ));
      textOpacity.value = withDelay(600, withTiming(1, { duration: 300 }));
    } else {
      // Quick inline animation
      slimeScale.value = withSequence(
        withTiming(1.4, { duration: 200 }),
        withTiming(0.85, { duration: 150 }),
        withSpring(1, { damping: 12, stiffness: 180 }),
      );
      // Auto-complete after animation
      setTimeout(onComplete, 600);
    }
  }, []);

  const bgStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
    backgroundColor: master.baseColor,
  }));

  const slimeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: slimeScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  if (!isRare) {
    // Inline merge effect at midpoint
    return (
      <Animated.View style={[styles.inlineContainer, { left: midX - 30, top: midY - 30 }, slimeStyle]}>
        <View style={[styles.inlineSlime, {
          width: master.baseRadius * 2,
          height: master.baseRadius * 2,
          borderRadius: master.baseRadius,
          backgroundColor: master.baseColor,
        }]} />
      </Animated.View>
    );
  }

  // Full-screen rare merge
  const rarityColor = RARITY_COLORS[master.rarity] || '#FFF';
  const stars = '\u2605'.repeat(master.tier);

  return (
    <Pressable style={styles.fullScreen} onPress={onComplete}>
      <Animated.View style={[styles.backdrop, bgStyle]} />
      <Animated.View style={[styles.flash, flashStyle]} />

      <Animated.View style={[styles.centerContent, slimeStyle]}>
        <View style={[styles.rareSlime, {
          width: master.baseRadius * 3,
          height: master.baseRadius * 3,
          borderRadius: master.baseRadius * 1.5,
          backgroundColor: master.baseColor,
          borderColor: rarityColor,
          borderWidth: 3,
        }]}>
          {/* Eyes */}
          <View style={styles.rareEyes}>
            <View style={styles.rareEye}>
              <View style={styles.rarePupil} />
            </View>
            <View style={styles.rareEye}>
              <View style={styles.rarePupil} />
            </View>
          </View>
          <View style={styles.rareMouth} />
        </View>
      </Animated.View>

      <Animated.View style={[styles.textContainer, textStyle]}>
        <Text style={styles.slimeName}>{master.name}</Text>
        <Text style={[styles.rarityText, { color: rarityColor }]}>
          {stars} {master.rarity.charAt(0).toUpperCase() + master.rarity.slice(1)}
        </Text>
        <Text style={styles.description}>{master.description}</Text>
        <Text style={styles.tapHint}>タップで戻る</Text>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  rareSlime: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  rareEyes: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  rareEye: {
    width: 20,
    height: 24,
    borderRadius: 10,
    backgroundColor: '#FFF',
    marginHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rarePupil: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#333',
  },
  rareMouth: {
    width: 20,
    height: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  slimeName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  rarityText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  description: {
    fontSize: 14,
    color: '#DDD',
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  tapHint: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 30,
  },
  inlineContainer: {
    position: 'absolute',
    zIndex: 50,
  },
  inlineSlime: {
    overflow: 'hidden',
  },
});
