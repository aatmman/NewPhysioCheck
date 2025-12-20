import {
  ExerciseType,
  PoseLandmark,
} from './types';
import {
  ema,
  hipFlexionAngle,
  kneeFlexionAngle,
  elbowFlexionAngle,
} from './angles';

// --- CONFIGURATION CONSTANTS (Adjust these to tune sensitivity) ---

// SQUAT
export const SQUAT_DOWN_ANGLE = 110;  // Degrees. Start phase when knee < this
export const SQUAT_BOTTOM_ANGLE = 95; // Degrees. "Good depth" threshold
export const SQUAT_UP_ANGLE = 160;    // Degrees. Return to standing

// STRAIGHT LEG RAISE (SLR)
export const SLR_UP_ANGLE = 165;      // Start phase when hip < this (lifting)
export const SLR_TOP_ANGLE = 110;     // "Good height" threshold (lower angle = higher leg)
export const SLR_DOWN_ANGLE = 165;    // Return to floor

// ELBOW FLEXION (CURL)
export const ELBOW_FLEX_ANGLE = 150;  // Start phase when elbow < this
export const ELBOW_TOP_ANGLE = 60;    // "Good squeeze" threshold
export const ELBOW_EXT_ANGLE = 160;   // Return to full extension

// GLOBAL SETTINGS
const DEBUG_REPS = false;
const DEFAULT_ALPHA = 0.3; // Smoothing factor (0.1 = very smooth/laggy, 1.0 = raw)
const MIN_REP_DURATION_MS = 300; // Debounce rapid spikes
const TARGET_REP_DURATION_MS = 2500; // For tempo scoring

// --- TYPES ---

export interface RepOutput {
  repCount: number;
  feedback: string;
  // Details about the *last completed* rep
  lastRep?: {
    maxAngle: number; // For ROM calculation
    minAngle: number;
    formScore: number;
  };
  // Live data for UI feedback
  currentAngle?: number;
  // Debug info
  debug?: string;
}

export interface RepDetector {
  exercise: ExerciseType;
  reset(): void;
  update(args: { landmarks: PoseLandmark[]; timestampMs: number }): RepOutput;
}

type Phase = 'ready' | 'down' | 'bottom' | 'up';

// --- HELPERS ---

function calculateScore(
  romVal: number,     // The metric we achieved (e.g. max flexion)
  romTarget: number,  // The target metric
  durationMs: number
): number {
  // Simple scoring heuristic
  // 1. ROM score (0-70pts)
  // If target is 90 deg knee flexion, and we hit 90, we get full points.
  // If we only hit 120 (shallow), we lose points.
  // NOTE: Logic depends on whether "lower is better" or "higher is better".
  // For flexion angles (squat, curl), usually we track the MIN angle or MAX ROM.

  // Here we assume 'romVal' is already normalized to "Degrees of ROM" (0 = start, 90 = deep)

  const romRatio = Math.min(romVal / romTarget, 1.2); // Cap at 120%
  const romScore = Math.min(romRatio * 70, 70);

  // 2. Tempo score (0-30pts)
  // Too fast (< 1s) = bad. Controlled (~2-3s) = good.
  const tempoRatio = Math.min(durationMs / TARGET_REP_DURATION_MS, 1.5);
  let tempoScore = 30;
  if (durationMs < 1000) tempoScore = 15;
  else if (durationMs < 500) tempoScore = 5;

  return Math.round(romScore + tempoScore);
}

function getFeedback(
  phase: Phase,
  currentAngle: number,
  targetAngle: number,
  exercise: ExerciseType
): string {
  if (phase === 'ready') return 'Get ready...';

  if (exercise === 'squat') {
    if (phase === 'down') return currentAngle < SQUAT_BOTTOM_ANGLE + 15 ? 'Good depth, push up!' : 'Go lower...';
    if (phase === 'bottom') return 'Hold...';
    if (phase === 'up') return 'Stand up tall';
  }

  if (exercise === 'slr') {
    if (phase === 'down') return 'Lift higher...'; // "down" here means "angle going down" -> leg going up
    if (phase === 'bottom') return 'Hold...';
    if (phase === 'up') return 'Lower slowly';
  }

  if (exercise === 'elbow_flexion') {
    if (phase === 'down') return 'Squeeze up...';
    if (phase === 'bottom') return 'Squeeze!';
    if (phase === 'up') return 'Extend fully';
  }

  return 'Move steadily';
}

function debugLog(tag: string, ...args: any[]) {
  if (DEBUG_REPS) {
    console.debug(`[${tag}]`, ...args);
  }
}

// --- DETECTORS ---

export function createSquatRepDetector(side: 'left' | 'right' = 'left'): RepDetector {
  let phase: Phase = 'ready';
  let repCount = 0;
  let minAngleObserved = 180; // Track deepest point (lowest angle)
  let smoothedAngle: number | null = null;
  let startTs = 0;
  let lastRepData: RepOutput['lastRep'] | undefined;

  // MediaPipe Body Indices
  // Left: Hip 23, Knee 25, Ankle 27
  // Right: Hip 24, Knee 26, Ankle 28
  const idxHip = side === 'left' ? 23 : 24;
  const idxKnee = side === 'left' ? 25 : 26;
  const idxAnkle = side === 'left' ? 27 : 28;

  return {
    exercise: 'squat',
    reset() {
      phase = 'ready';
      minAngleObserved = 180;
      smoothedAngle = null;
      lastRepData = undefined;
    },
    update({ landmarks, timestampMs }) {
      if (!landmarks[idxHip] || !landmarks[idxKnee] || !landmarks[idxAnkle]) {
        return { repCount, feedback: 'Position yourself in frame' };
      }

      const rawAngle = kneeFlexionAngle(landmarks[idxHip], landmarks[idxKnee], landmarks[idxAnkle]);
      smoothedAngle = ema(smoothedAngle, rawAngle, DEFAULT_ALPHA);
      const angle = smoothedAngle!;

      // State Machine
      // Squat: Starts standing (~180). Goes down (angle decreases).

      if (phase === 'ready') {
        if (angle < SQUAT_DOWN_ANGLE) {
          phase = 'down';
          startTs = timestampMs;
          minAngleObserved = angle;
          debugLog('SQUAT', 'Started rep', timestampMs);
        }
      } else {
        // Track depth
        minAngleObserved = Math.min(minAngleObserved, angle);

        if (phase === 'down') {
          if (angle < SQUAT_BOTTOM_ANGLE) {
            phase = 'bottom';
            debugLog('SQUAT', 'Hit bottom', angle);
          } else if (angle > SQUAT_UP_ANGLE) {
            // Aborted rep or shallow rep return
            phase = 'ready';
            // Don't count it if it wasn't deep enough? 
            // For now we only count if we hit bottom phase or implicitly handle strictness.
            // Let's rely on the phases. If we go back quite high without hitting bottom, it is a failed rep.
          }
        } else if (phase === 'bottom') {
          if (angle > SQUAT_BOTTOM_ANGLE + 10) { // Hysteresis
            phase = 'up';
            debugLog('SQUAT', 'Going up');
          }
        } else if (phase === 'up') {
          if (angle > SQUAT_UP_ANGLE) {
            // Rep Complete
            const duration = timestampMs - startTs;
            if (duration > MIN_REP_DURATION_MS) {
              repCount++;
              // Score: Target is 90 degrees or less.
              // We convert to "ROM degrees processed": 180 - minAngle
              const romAchieved = 180 - minAngleObserved;
              const romTarget = 180 - 90; // 90 deg change
              const score = calculateScore(romAchieved, romTarget, duration);

              lastRepData = {
                minAngle: minAngleObserved,
                maxAngle: 180, // Assumed start
                formScore: score
              };
              debugLog('SQUAT', 'Rep completed', lastRepData);
            }
            phase = 'ready';
            minAngleObserved = 180;
          }
        }
      }

      return {
        repCount,
        feedback: getFeedback(phase, angle, SQUAT_BOTTOM_ANGLE, 'squat'),
        lastRep: lastRepData,
        currentAngle: Math.round(angle)
      };
    }
  };
}

export function createSlrRepDetector(side: 'left' | 'right' = 'left'): RepDetector {
  let phase: Phase = 'ready';
  let repCount = 0;
  let minAngleObserved = 180;
  let smoothedAngle: number | null = null;
  let startTs = 0;
  let lastRepData: RepOutput['lastRep'] | undefined;

  const idxShoulder = side === 'left' ? 11 : 12;
  const idxHip = side === 'left' ? 23 : 24;
  const idxKnee = side === 'left' ? 25 : 26;

  return {
    exercise: 'slr',
    reset() {
      phase = 'ready';
      minAngleObserved = 180;
      smoothedAngle = null;
    },
    update({ landmarks, timestampMs }) {
      if (!landmarks[idxShoulder] || !landmarks[idxHip] || !landmarks[idxKnee]) {
        return { repCount, feedback: 'Position yourself in frame' };
      }

      const rawAngle = hipFlexionAngle(landmarks[idxShoulder], landmarks[idxHip], landmarks[idxKnee]);
      smoothedAngle = ema(smoothedAngle, rawAngle, DEFAULT_ALPHA);
      const angle = smoothedAngle!;

      // SLR: Lie flat (hip ~180). Lift leg (angle decreases).
      if (phase === 'ready') {
        if (angle < SLR_UP_ANGLE) {
          phase = 'down'; // "Down" in generic nomenclature, technically "Up" for the leg
          startTs = timestampMs;
          minAngleObserved = angle;
        }
      } else {
        minAngleObserved = Math.min(minAngleObserved, angle);

        if (phase === 'down') {
          if (angle < SLR_TOP_ANGLE) {
            phase = 'bottom'; // Peak of movement
          } else if (angle > SLR_DOWN_ANGLE) {
            phase = 'ready'; // Abort
          }
        } else if (phase === 'bottom') {
          if (angle > SLR_TOP_ANGLE + 10) {
            phase = 'up'; // Returning leg to floor
          }
        } else if (phase === 'up') {
          if (angle > SLR_DOWN_ANGLE) {
            const duration = timestampMs - startTs;
            if (duration > MIN_REP_DURATION_MS) {
              repCount++;
              const romAchieved = 180 - minAngleObserved;
              const romTarget = 180 - 90; // Aiming for 90 leg raise
              const score = calculateScore(romAchieved, romTarget, duration);

              lastRepData = {
                minAngle: minAngleObserved,
                maxAngle: 180,
                formScore: score
              };
            }
            phase = 'ready';
            minAngleObserved = 180;
          }
        }
      }

      return {
        repCount,
        feedback: getFeedback(phase, angle, SLR_TOP_ANGLE, 'slr'),
        lastRep: lastRepData,
        currentAngle: Math.round(angle)
      };
    }
  };
}

export function createElbowFlexionRepDetector(side: 'left' | 'right' = 'left'): RepDetector {
  let phase: Phase = 'ready';
  let repCount = 0;
  let minAngleObserved = 180;
  let smoothedAngle: number | null = null;
  let startTs = 0;
  let lastRepData: RepOutput['lastRep'] | undefined;

  const idxShoulder = side === 'left' ? 11 : 12;
  const idxElbow = side === 'left' ? 13 : 14;
  const idxWrist = side === 'left' ? 15 : 16;

  return {
    exercise: 'elbow_flexion',
    reset() {
      phase = 'ready';
      minAngleObserved = 180;
      smoothedAngle = null;
    },
    update({ landmarks, timestampMs }) {
      if (!landmarks[idxShoulder] || !landmarks[idxElbow] || !landmarks[idxWrist]) {
        return { repCount, feedback: 'Show your arm' };
      }

      const rawAngle = elbowFlexionAngle(landmarks[idxShoulder], landmarks[idxElbow], landmarks[idxWrist]);
      smoothedAngle = ema(smoothedAngle, rawAngle, DEFAULT_ALPHA);
      const angle = smoothedAngle!;

      // Curl: arm straight (~180). Flex (angle decreases).
      if (phase === 'ready') {
        if (angle < ELBOW_FLEX_ANGLE) {
          phase = 'down'; // Lifting weight up
          startTs = timestampMs;
          minAngleObserved = angle;
        }
      } else {
        minAngleObserved = Math.min(minAngleObserved, angle);

        if (phase === 'down') {
          if (angle < ELBOW_TOP_ANGLE) {
            phase = 'bottom'; // Squeezed at top
          } else if (angle > ELBOW_EXT_ANGLE) {
            phase = 'ready'; // Abort
          }
        } else if (phase === 'bottom') {
          if (angle > ELBOW_TOP_ANGLE + 15) {
            phase = 'up'; // Lowering weight
          }
        } else if (phase === 'up') {
          if (angle > ELBOW_EXT_ANGLE) {
            const duration = timestampMs - startTs;
            if (duration > MIN_REP_DURATION_MS) {
              repCount++;
              const romAchieved = 180 - minAngleObserved;
              const romTarget = 180 - 45; // ~135 deg flexion
              const score = calculateScore(romAchieved, romTarget, duration);

              lastRepData = {
                minAngle: minAngleObserved,
                maxAngle: 180,
                formScore: score
              };
            }
            phase = 'ready';
            minAngleObserved = 180;
          }
        }
      }

      return {
        repCount,
        feedback: getFeedback(phase, angle, ELBOW_TOP_ANGLE, 'elbow_flexion'),
        lastRep: lastRepData,
        currentAngle: Math.round(angle)
      };
    }
  };
}

