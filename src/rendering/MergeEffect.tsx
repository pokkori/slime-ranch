import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { SLIME_MASTER } from '../constants/slimes';
import { RARITY_COLORS } from '../constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const RAINBOW_COLORS = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#9B59B6', '#FF6B9D'];

interface Particle {
  angle: number;
  distance: number;
  size: number;
  color: string;
  delay: number;
}

function getParticleCount(tier: number): number {
  if (tier <= 2) return 6;
  if (tier <= 4) return 10;
  return 16;
}

function generateParticles(baseColor: string, tier: number): Particle[] {
  const count = getParticleCount(tier);
  const isHighTier = tier >= 3;
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    particles.push({
      angle,
      distance: 40 + Math.random() * (isHighTier ? 80 : 40),
      size: 6 + Math.random() * (isHighTier ? 10 : 6),
      color: tier >= 5 ? RAINBOW_COLORS[i % RAINBOW_COLORS.length] : baseColor,
      delay: Math.random() * 100,
    });
  }
  return particles;
}

interface ParticleDotProps {
  particle: Particle;
  centerX: number;
  centerY: number;
}

const ParticleDot: React.FC<ParticleDotProps> = ({ particle, centerX, centerY }) => {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    progress.value = withDelay(
      particle.delay,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) }),
    );
    opacity.value = withDelay(
      particle.delay + 300,
      withTiming(0, { duration: 200 }),
    );
  }, []);

  const style = useAnimatedStyle(() => {
    const x = centerX + Math.cos(particle.angle) * particle.distance * progress.value - particle.size / 2;
    const y = centerY + Math.sin(particle.angle) * particle.distance * progress.value - particle.size / 2;
    return {
      position: 'absolute' as const,
      left: x,
      top: y,
      width: particle.size,
      height: particle.size,
      borderRadius: particle.size / 2,
      backgroundColor: particle.color,
      opacity: opacity.value,
      transform: [{ scale: 1 - progress.value * 0.5 }],
    };
  });

  return <Animated.View style={style} />;
};

/** Inline "EVOLUTION!" text for Tier 5-6 merges */
const EvolutionText: React.FC<{ centerX: number; centerY: number }> = ({ centerX, centerY }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);
  const textScale = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withDelay(100, withSequence(
      withTiming(1, { duration: 200 }),
      withDelay(600, withTiming(0, { duration: 300 })),
    ));
    translateY.value = withDelay(100,
      withTiming(-40, { duration: 800, easing: Easing.out(Easing.quad) }),
    );
    textScale.value = withDelay(100, withSequence(
      withTiming(1.3, { duration: 200 }),
      withSpring(1, { damping: 10, stiffness: 200 }),
    ));
  }, []);

  const style = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    left: centerX - 60,
    top: centerY - 60 + translateY.value,
    opacity: opacity.value,
    transform: [{ scale: textScale.value }],
  }));

  return (
    <Animated.View style={style}>
      <Text style={evoStyles.text}>EVOLUTION!</Text>
    </Animated.View>
  );
};

/** Screen flash overlay for Tier 5-6 inline merges */
const InlineFlash: React.FC<{ color: string }> = ({ color }) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(0.35, { duration: 100 }),
      withTiming(0, { duration: 300 }),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    ...StyleSheet.absoluteFillObject,
    backgroundColor: color,
    opacity: opacity.value,
    zIndex: 49,
  }));

  return <Animated.View style={style} pointerEvents="none" />;
};

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

  const tier = master.tier;
  const particles = useMemo(() => generateParticles(master.baseColor, tier), [master.baseColor, tier]);

  const flashOpacity = useSharedValue(0);
  const slimeScale = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const bgOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0);
  const ringOpacity = useSharedValue(0);
  const ringRotation = useSharedValue(0);

  useEffect(() => {
    if (isRare) {
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

      // Rainbow ring
      ringScale.value = withDelay(100, withSequence(
        withTiming(1.2, { duration: 400, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 200 }),
      ));
      ringOpacity.value = withDelay(100, withSequence(
        withTiming(0.8, { duration: 200 }),
        withDelay(600, withTiming(0, { duration: 300 })),
      ));
      ringRotation.value = withRepeat(
        withTiming(360, { duration: 2000, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      // Tier-based inline animation
      if (tier >= 3) {
        // Scale bounce for Tier 3-4
        slimeScale.value = withSequence(
          withTiming(1.6, { duration: 200, easing: Easing.out(Easing.quad) }),
          withTiming(0.8, { duration: 150 }),
          withTiming(1.15, { duration: 100 }),
          withSpring(1, { damping: 10, stiffness: 200 }),
        );
      } else {
        slimeScale.value = withSequence(
          withTiming(1.4, { duration: 200 }),
          withTiming(0.85, { duration: 150 }),
          withSpring(1, { damping: 12, stiffness: 180 }),
        );
      }
      setTimeout(onComplete, tier >= 5 ? 1000 : 600);
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

  const ringStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: ringScale.value },
      { rotate: `${ringRotation.value}deg` },
    ],
    opacity: ringOpacity.value,
  }));

  if (!isRare) {
    // Inline merge with particles + tier-based enhancements
    const showFlash = tier >= 5;
    const showEvolution = tier >= 5;

    return (
      <>
        {/* Screen flash for Tier 5-6 */}
        {showFlash && <InlineFlash color={master.baseColor} />}

        <View style={styles.particleLayer} pointerEvents="none">
          {particles.map((p, i) => (
            <ParticleDot key={i} particle={p} centerX={midX} centerY={midY} />
          ))}

          {/* EVOLUTION! text for Tier 5-6 */}
          {showEvolution && <EvolutionText centerX={midX} centerY={midY} />}

          <Animated.View style={[styles.inlineContainer, { left: midX - 30, top: midY - 30 }, slimeStyle]}>
            <View style={[styles.inlineSlime, {
              width: master.baseRadius * 2,
              height: master.baseRadius * 2,
              borderRadius: master.baseRadius,
              backgroundColor: master.baseColor,
            }]} />
          </Animated.View>
        </View>
      </>
    );
  }

  // Full-screen rare merge with rainbow ring + particles
  const rarityColor = RARITY_COLORS[master.rarity] || '#FFF';
  const stars = '\u2605'.repeat(tier);

  return (
    <Pressable style={styles.fullScreen} onPress={onComplete}>
      <Animated.View style={[styles.backdrop, bgStyle]} />
      <Animated.View style={[styles.flash, flashStyle]} />

      {/* Particles */}
      {particles.map((p, i) => (
        <ParticleDot
          key={i}
          particle={p}
          centerX={SCREEN_WIDTH / 2}
          centerY={SCREEN_HEIGHT / 2 - 40}
        />
      ))}

      {/* Rainbow ring */}
      <Animated.View style={[styles.ringContainer, ringStyle]}>
        {RAINBOW_COLORS.map((color, i) => (
          <View
            key={i}
            style={[styles.ringSegment, {
              borderColor: color,
              transform: [{ rotate: `${i * 60}deg` }],
            }]}
          />
        ))}
      </Animated.View>

      <Animated.View style={[styles.centerContent, slimeStyle]}>
        <View style={[styles.rareSlime, {
          width: master.baseRadius * 3,
          height: master.baseRadius * 3,
          borderRadius: master.baseRadius * 1.5,
          backgroundColor: master.baseColor,
          borderColor: rarityColor,
          borderWidth: 3,
        }]}>
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

const evoStyles = StyleSheet.create({
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
    width: 120,
  },
});

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
  particleLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
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
  ringContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringSegment: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderStyle: 'dashed',
  },
});
