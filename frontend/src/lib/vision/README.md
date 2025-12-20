# Vision Layer Documentation

This directory contains the core logic for the **MediaPipe-based Exercise Analysis** system.
It uses a "geometric" approach: measuring joint angles from 3D landmarks to track reps and assess form.

## Architecture

1.  **`poseClient.ts`**: Wraps `@mediapipe/tasks-vision`.
    *   Initializes the AI model (downloading the WASM/Task files).
    *   Takes a `<video>` element and outputs 33 3D landmarks (x, y, z).
    *   **Note**: We use the *Pose Landmarker* task, not raw OpenCV.

2.  **`angles.ts`**: Pure math layer.
    *   `computeAngle(a, b, c)`: Calculates the angle at 'b'.
    *   Helpers like `kneeFlexionAngle`, `hipFlexionAngle`.
    *   **Smoothing**: Uses Exponential Moving Average (EMA) to reduce jitter.
    *   **Note**: All joint angles are in degrees within the range [0, 180], computed using the vector dot product with safety checks for zero‑length vectors. This avoids NaNs and keeps the math numerically stable.

3.  **`repDetectors.ts`**: Exercise logic ("The Brain").
    *   Each exercise has a **State Machine** (Ready -> Down -> Bottom -> Up).
    *   Tracks reps, range of motion (ROM), and form faults.
    *   Returns a standardized `RepOutput` object.
    *   **Debugging**: A `DEBUG_REPS` flag can be toggled to log state transitions (READY → DOWN → BOTTOM → UP), current angles (throttled), and `lastRep` metrics during testing. Turn this on when tuning thresholds or diagnosing missed reps, and keep it off in normal use.

## Supported Exercises

### 1. Squat
*   **Metric**: Knee Flexion Angle (180° = Standing, <90° = Deep Squat).
*   **Phases**:
    *   `DOWN`: Angle < 110°.
    *   `BOTTOM`: Angle < 95° (Target).
    *   `UP`: Return to > 160°.
*   The phase thresholds (e.g., 110° for DOWN, 95° for BOTTOM, 160°+ for UP) are defined as tweakable constants at the top of `repDetectors.ts`. You can lower the BOTTOM angle for deeper squats (harder) or raise it for shallower squats (easier).

### 2. Straight Leg Raise (SLR)
*   **Metric**: Hip Flexion Angle (180° = Flat, <90° = Vertical Leg).
*   **Phases**:
    *   `DOWN` (Leg going up): Angle < 165°.
    *   `BOTTOM` (Peak height): Angle < 110°.
    *   `UP` (Leg lowering): Return to > 165°.
*   The phase thresholds (e.g., 165° for DOWN, 110° for BOTTOM) are defined as tweakable constants at the top of `repDetectors.ts`. You can lower the BOTTOM angle for a higher leg lift (harder) or raise it for a lower lift (easier).

### 3. Elbow Flexion (Bicep Curl)
*   **Metric**: Elbow Angle (180° = Straight, <45° = Curled).
*   **Phases**:
    *   `DOWN` (Curling up): Angle < 150°.
    *   `BOTTOM` (Squeeze): Angle < 60°.
    *   `UP` (Lowering): Return to > 160°.
*   The phase thresholds (e.g., 150° for DOWN, 60° for BOTTOM) are defined as tweakable constants at the top of `repDetectors.ts`. You can lower the BOTTOM angle for a tighter squeeze (harder) or raise it for a looser curl (easier).

## Configuration & Tuning

All key thresholds are defined as constants at the top of `src/lib/vision/repDetectors.ts`.

```typescript
export const SQUAT_DOWN_ANGLE = 110;
export const SQUAT_BOTTOM_ANGLE = 95;
```

**To adjust difficulty**:
*   **Decrease** `BOTTOM` angles to require deeper movements (harder).
*   **Increase** `BOTTOM` angles to allow shallower reps (easier).

## Side Handling

Detectors accept an optional `side` argument:
```typescript
createSquatRepDetector('left'); // Tracks left hip/knee/ankle
createSquatRepDetector('right'); // Tracks right
```
Default is `'left'`.

## Form Scoring

A `formScore` (0-100) is calculated for every rep based on:
1.  **ROM** (70%): Did you hit the target angle?
2.  **Tempo** (30%): Was the rep too fast (<1s) or controlled?

## Integration

The UI (`PatientSessionActive.tsx`) consumes the `RepOutput` from the active detector.
On session finish, it logs a `SessionResult` object:

```typescript
interface SessionResult {
  sessionId: string;
  startedAt: string;
  completedAt: string;
  exercises: {
    exerciseKey: string;
    totalReps: number;
    avgMaxAngle: number;
    avgFormScore: number;
  }[];
}
```

`startedAt` and `completedAt` are ISO timestamps that allow the backend to compute session duration, adherence, and scheduling analytics later. The frontend constructs this object when the user finishes a session; the backend can persist it as‑is.
