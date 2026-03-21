/**
 * Web Audio API based programmatic sound effects.
 * No audio files needed — all sounds are synthesized via OscillatorNode.
 * Only works on Platform.OS === 'web'; on native, haptics handle feedback.
 */
import { Platform } from 'react-native';

let audioCtx: AudioContext | null = null;
let masterVolume = 0.7; // 0.0–1.0, synced with settings.sfxVolume

/** Set the master SE volume (0.0–1.0). Called from settings. */
export function setSfxVolume(v: number): void {
  masterVolume = Math.max(0, Math.min(1, v));
}

function getAudioContext(): AudioContext | null {
  if (Platform.OS !== 'web') return null;
  if (typeof window === 'undefined') return null;

  if (!audioCtx) {
    try {
      const AudioCtxClass =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass() as AudioContext;
      }
    } catch {
      return null;
    }
  }

  // Resume if suspended (browser autoplay policy)
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }

  return audioCtx;
}

// ─── Helpers ────────────────────────────────────────────

function playTone(
  frequency: number,
  durationMs: number,
  type: OscillatorType = 'sine',
  volume: number = 0.15,
  startDelayMs: number = 0,
): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.value = volume;

  osc.connect(gain);
  gain.connect(ctx.destination);

  const startTime = ctx.currentTime + startDelayMs / 1000;
  const endTime = startTime + durationMs / 1000;

  // Fade out to avoid click
  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, endTime);

  osc.start(startTime);
  osc.stop(endTime + 0.01);
}

function playSweep(
  freqStart: number,
  freqEnd: number,
  durationMs: number,
  type: OscillatorType = 'sine',
  volume: number = 0.15,
  startDelayMs: number = 0,
): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;

  const startTime = ctx.currentTime + startDelayMs / 1000;
  const endTime = startTime + durationMs / 1000;

  osc.frequency.setValueAtTime(freqStart, startTime);
  osc.frequency.exponentialRampToValueAtTime(freqEnd, endTime);

  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, endTime);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(endTime + 0.01);
}

function playNoiseBurst(durationMs: number, volume: number = 0.08): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const bufferSize = Math.ceil(ctx.sampleRate * (durationMs / 1000));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize); // fade-out noise
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const gain = ctx.createGain();
  gain.gain.value = volume;

  source.connect(gain);
  gain.connect(ctx.destination);

  source.start(ctx.currentTime);
}

// ─── Public SE API ──────────────────────────────────────

/**
 * Merge SE with tier-dependent pitch.
 * - Tier 1-2: "pon" (sine, 440Hz, 80ms)
 * - Tier 3-4: "pin!" (sine, 660Hz + 880Hz two-note)
 * - Tier 5:   "kiraan!" (sweep 880→1320Hz, 200ms)
 * - Tier 6:   "fanfare" (C-E-G-C arpeggiated)
 */
export function playMergeSound(resultTier: number): void {
  if (resultTier <= 2) {
    // Tier 1-2: simple "pon"
    playTone(440, 80, 'sine', 0.15);
  } else if (resultTier <= 4) {
    // Tier 3-4: "pin!" two-note
    playTone(660, 100, 'sine', 0.15);
    playTone(880, 50, 'sine', 0.15, 100);
  } else if (resultTier === 5) {
    // Tier 5: "kiraan!" upward sweep
    playSweep(880, 1320, 200, 'sine', 0.18);
  } else {
    // Tier 6 (Legend): C-E-G-C fanfare
    playTone(523, 80, 'sine', 0.15, 0);   // C5
    playTone(659, 80, 'sine', 0.15, 90);  // E5
    playTone(784, 80, 'sine', 0.15, 180); // G5
    playTone(1047, 120, 'sine', 0.18, 280); // C6
  }
}

/**
 * Coin acquire: "charin" sound.
 */
export function playCoinSound(): void {
  playTone(1200, 50, 'sine', 0.08);
  playTone(1800, 50, 'sine', 0.08, 50);
}

/**
 * Split / tap: "puchi" noise burst.
 */
export function playSplitSound(): void {
  playNoiseBurst(30, 0.08);
  playTone(600, 40, 'square', 0.04);
}

/**
 * Offline reward claim: "jarajara" coin shower.
 */
export function playOfflineRewardSound(): void {
  for (let i = 0; i < 5; i++) {
    playTone(1200 + Math.random() * 200, 30, 'sine', 0.07, i * 60);
    playTone(1600 + Math.random() * 200, 30, 'sine', 0.07, i * 60 + 20);
  }
}
