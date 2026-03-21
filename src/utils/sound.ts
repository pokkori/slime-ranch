/**
 * Web Audio API based programmatic sound effects.
 * No audio files needed — all sounds are synthesized via OscillatorNode.
 * Only works on Platform.OS === 'web'; on native, haptics handle feedback.
 */
import { Platform } from 'react-native';

let audioCtx: AudioContext | null = null;
let masterVolume = 0.7; // 0.0–1.0, synced with settings.sfxVolume
let bgmVolume = 0.4; // 0.0–1.0, synced with settings.bgmVolume
let bgmPlaying = false;
let bgmGainNode: GainNode | null = null;
let bgmOscillators: OscillatorNode[] = [];
let bgmIntervalId: ReturnType<typeof setInterval> | null = null;

/** Set the master SE volume (0.0–1.0). Called from settings. */
export function setSfxVolume(v: number): void {
  masterVolume = Math.max(0, Math.min(1, v));
}

/** Set the BGM volume (0.0–1.0). Called from settings. */
export function setBgmVolume(v: number): void {
  bgmVolume = Math.max(0, Math.min(1, v));
  if (bgmGainNode) {
    bgmGainNode.gain.setValueAtTime(bgmVolume * 0.08, bgmGainNode.context.currentTime);
  }
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
  const vol = volume * masterVolume;
  gain.gain.value = vol;

  osc.connect(gain);
  gain.connect(ctx.destination);

  const startTime = ctx.currentTime + startDelayMs / 1000;
  const endTime = startTime + durationMs / 1000;

  // Fade out to avoid click
  gain.gain.setValueAtTime(vol, startTime);
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

  const vol = volume * masterVolume;

  osc.frequency.setValueAtTime(freqStart, startTime);
  osc.frequency.exponentialRampToValueAtTime(freqEnd, endTime);

  gain.gain.setValueAtTime(vol, startTime);
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
  gain.gain.value = volume * masterVolume;

  source.connect(gain);
  gain.connect(ctx.destination);

  source.start(ctx.currentTime);
}

/**
 * Shop purchase: "ka-ching" sound.
 */
export function playPurchaseSound(): void {
  playTone(800, 60, 'sine', 0.12);
  playTone(1200, 60, 'sine', 0.12, 70);
  playTone(1600, 80, 'sine', 0.15, 140);
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

// ─── BGM System ────────────────────────────────────────

/** Pentatonic scales by background theme key */
const BGM_SCALES: Record<string, number[]> = {
  meadow: [261.6, 293.7, 329.6, 392.0, 440.0],  // C major pentatonic: C-D-E-G-A
  forest: [220.0, 261.6, 293.7, 329.6, 392.0],   // A minor pentatonic: A-C-D-E-G
  beach:  [349.2, 392.0, 440.0, 523.3, 587.3],    // F major pentatonic: F-G-A-C-D
  volcano: [293.7, 349.2, 392.0, 440.0, 523.3],   // D minor pentatonic: D-F-G-A-C
  sky_garden: [261.6, 293.7, 329.6, 392.0, 440.0], // C major
  crystal_cave: [220.0, 261.6, 293.7, 329.6, 392.0], // A minor
};

/** Base drone frequencies by theme */
const BGM_DRONE: Record<string, number> = {
  meadow: 65.4,     // C2
  forest: 55.0,     // A1
  beach: 87.3,      // F2
  volcano: 73.4,    // D2
  sky_garden: 65.4,  // C2
  crystal_cave: 55.0, // A1
};

/**
 * Start procedural BGM loop.
 * Pentatonic random melody (4 bar loop) + low drone.
 */
export function startBGM(theme: string = 'meadow'): void {
  if (bgmPlaying) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  bgmPlaying = true;

  const scale = BGM_SCALES[theme] || BGM_SCALES.meadow;
  const droneFreq = BGM_DRONE[theme] || BGM_DRONE.meadow;

  // Create master gain for BGM
  bgmGainNode = ctx.createGain();
  bgmGainNode.gain.value = bgmVolume * 0.08;
  bgmGainNode.connect(ctx.destination);

  // Bass drone oscillator
  const drone = ctx.createOscillator();
  drone.type = 'sine';
  drone.frequency.value = droneFreq;
  const droneGain = ctx.createGain();
  droneGain.gain.value = 0.6;
  drone.connect(droneGain);
  droneGain.connect(bgmGainNode);
  drone.start();
  bgmOscillators.push(drone);

  // Melody loop: play random pentatonic notes at intervals
  // 4 bars x 4 beats = 16 notes, BPM ~80 => beat = 750ms
  const beatMs = 750;
  let noteIndex = 0;

  bgmIntervalId = setInterval(() => {
    if (!bgmPlaying || !bgmGainNode) return;

    const note = scale[Math.floor(Math.random() * scale.length)];
    // Occasionally play one octave up
    const octaveUp = Math.random() < 0.3 ? 2 : 1;
    const freq = note * octaveUp;

    const osc = ctx.createOscillator();
    osc.type = noteIndex % 4 === 0 ? 'triangle' : 'sine';
    osc.frequency.value = freq;

    const noteGain = ctx.createGain();
    const vol = 0.4 + Math.random() * 0.3;
    noteGain.gain.setValueAtTime(vol, ctx.currentTime);
    noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

    osc.connect(noteGain);
    noteGain.connect(bgmGainNode);
    osc.start();
    osc.stop(ctx.currentTime + 0.7);

    noteIndex = (noteIndex + 1) % 16;
  }, beatMs);
}

/**
 * Stop BGM.
 */
export function stopBGM(): void {
  bgmPlaying = false;

  for (const osc of bgmOscillators) {
    try { osc.stop(); } catch { /* already stopped */ }
  }
  bgmOscillators = [];

  if (bgmIntervalId !== null) {
    clearInterval(bgmIntervalId);
    bgmIntervalId = null;
  }

  if (bgmGainNode) {
    bgmGainNode.disconnect();
    bgmGainNode = null;
  }
}

/** Check if BGM is currently playing */
export function isBGMPlaying(): boolean {
  return bgmPlaying;
}

/**
 * Combo sound effect for 3-match / chain merges.
 */
export function playComboSound(comboLevel: number): void {
  const baseFreq = 600 + comboLevel * 200;
  playTone(baseFreq, 60, 'sine', 0.15);
  playTone(baseFreq * 1.5, 80, 'sine', 0.12, 70);
  playTone(baseFreq * 2, 100, 'sine', 0.10, 150);
}
