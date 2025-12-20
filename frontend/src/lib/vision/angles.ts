import { PoseLandmark } from './types';

const toDegrees = (radians: number) => (radians * 180) / Math.PI;

/**
 * Compute the angle (in degrees) at point B formed by points A-B-C.
 * Returns a value in [0, 180].
 * 
 * @param a First point
 * @param b Vertex point (where the angle is measured)
 * @param c Third point
 */
export function computeAngle(a: PoseLandmark, b: PoseLandmark, c: PoseLandmark): number {
  // Vectors BA and BC
  const ba = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  const bc = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z };

  const dot = ba.x * bc.x + ba.y * bc.y + ba.z * bc.z;
  const baMag = Math.sqrt(ba.x * ba.x + ba.y * ba.y + ba.z * ba.z);
  const bcMag = Math.sqrt(bc.x * bc.x + bc.y * bc.y + bc.z * bc.z);

  // Avoid division by zero
  if (baMag < 1e-6 || bcMag < 1e-6) return 0;

  // Clamp cosine to [-1, 1] to avoid NaN from floating point errors
  const cosAngle = Math.min(Math.max(dot / (baMag * bcMag), -1), 1);
  return toDegrees(Math.acos(cosAngle));
}

// Named helpers for common joint angles
// These assume specific landmarks are passed in the correct order

/**
 * Calculates knee flexion.
 * 180 degrees = fully extended leg
 * ~30-40 degrees = fully flexed (heel to butt)
 */
export function kneeFlexionAngle(hip: PoseLandmark, knee: PoseLandmark, ankle: PoseLandmark): number {
  return computeAngle(hip, knee, ankle);
}

/**
 * Calculates hip flexion.
 * 180 degrees = standing straight (neutral hip)
 * ~90 degrees = thigh parallel to ground
 */
export function hipFlexionAngle(shoulder: PoseLandmark, hip: PoseLandmark, knee: PoseLandmark): number {
  return computeAngle(shoulder, hip, knee);
}

/**
 * Calculates shoulder flexion/abduction approximation.
 * 180 degrees = arm by side (neutral)
 * 0-10 degrees = arm straight up
 * PROVISIONAL: Depends on camera angle
 */
export function shoulderFlexionAngle(hip: PoseLandmark, shoulder: PoseLandmark, elbow: PoseLandmark): number {
  return computeAngle(hip, shoulder, elbow);
}

/**
 * Calculates elbow flexion.
 * 180 degrees = fully extended arm
 * ~30-40 degrees = fully flexed
 */
export function elbowFlexionAngle(shoulder: PoseLandmark, elbow: PoseLandmark, wrist: PoseLandmark): number {
  return computeAngle(shoulder, elbow, wrist);
}

/**
 * Approximate trunk lean angle relative to vertical using hip-shoulder line.
 * Returns degrees from vertical (0 = upright).
 */
export function torsoLeanAngle(hip: PoseLandmark, shoulder: PoseLandmark): number {
  const dy = shoulder.y - hip.y;
  const dx = shoulder.x - hip.x;
  // atan2(dx, dy) gives angle from Y-axis
  const angleFromVertical = Math.abs(toDegrees(Math.atan2(dx, dy)));
  return angleFromVertical;
}

/**
 * Exponential moving average for smoothing scalar signals.
 * @param previous The previous smoothed value (or null if first frame)
 * @param current The current raw value
 * @param alpha Smoothing factor (0 < alpha <= 1). Lower = smoother but more lag.
 */
export function ema(previous: number | null, current: number, alpha: number): number {
  if (previous === null) return current;
  return alpha * current + (1 - alpha) * previous;
}

