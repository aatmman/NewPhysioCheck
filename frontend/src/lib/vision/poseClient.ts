import { FilesetResolver, PoseLandmarker, type PoseLandmarkerResult } from '@mediapipe/tasks-vision';
import { PoseResult, PoseLandmark } from './types';

const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task';
const WASM_URL =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';

export interface PoseClient {
  isReady: boolean;
  init(): Promise<void>;
  process(video: HTMLVideoElement): Promise<PoseResult | null>;
  destroy(): void;
}

export type PoseCallback = (landmarks: PoseLandmark[]) => void;

/**
 * MediaPipe Pose Landmarker wrapper.
 * Handles loading the WASM binary and model asynchronously.
 */
export function createPoseClient(): PoseClient {
  let ready = false;
  let landmarker: PoseLandmarker | null = null;
  let initPromise: Promise<void> | null = null;

  return {
    get isReady() {
      return ready;
    },

    async init() {
      // If already ready, do nothing
      if (ready) return;
      // If initialization is in progress, wait for it
      if (initPromise) return initPromise;

      initPromise = (async () => {
        try {
          const vision = await FilesetResolver.forVisionTasks(WASM_URL);
          landmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: MODEL_URL,
              delegate: 'GPU', // Use GPU if available
            },
            runningMode: 'VIDEO',
            numPoses: 1,
            minPoseDetectionConfidence: 0.5,
            minPosePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
          ready = true;
          console.log('[PoseClient] Initialized successfully');
        } catch (error) {
          console.error('[PoseClient] Initialization failed', error);
          initPromise = null; // Allow retrying
          throw error;
        }
      })();

      return initPromise;
    },

    async process(video: HTMLVideoElement): Promise<PoseResult | null> {
      if (!ready || !landmarker) return null;

      try {
        // Ensure video has dimensions
        if (video.videoWidth === 0 || video.videoHeight === 0) return null;

        const now = performance.now();
        const result: PoseLandmarkerResult = landmarker.detectForVideo(video, now);

        const landmarks = result.landmarks?.[0];
        if (!landmarks) return null;

        // Map MediaPipe format to our internal simplified format
        const mappedLandmarks: PoseLandmark[] = landmarks.map((l) => ({
          x: l.x,
          y: l.y,
          z: l.z,
          visibility: l.visibility,
        }));

        return {
          landmarks: mappedLandmarks,
        };
      } catch (error) {
        // Log error but don't crash the loop; maybe throttle logs in future if noisy
        console.error('[PoseClient] process error', error);
        return null;
      }
    },

    destroy() {
      if (landmarker) {
        try {
          landmarker.close();
        } catch (e) {
          console.warn('[PoseClient] Error closing landmarker', e);
        }
        landmarker = null;
      }
      ready = false;
      initPromise = null;
      console.log('[PoseClient] Destroyed');
    },
  };
}

