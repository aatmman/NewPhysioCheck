# PhysioCheck Care Portal Architecture

This document describes the high-level architecture of the PhysioCheck Care Portal.

## Overview

The PhysioCheck Care Portal is a digital rehabilitation platform designed to facilitate remote physiotherapy. It consists of a modern web frontend that integrates motion tracking technology and interacts with backend services for data management.

## Tech Stack

### Frontend
- **Framework**: [React](https://reactjs.org/) with [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **AI/CV**: [MediaPipe Vision](https://developers.google.com/mediapipe/solutions/vision/pose_landmarker) for real-time motion tracking.

## Key Components

### Motion Tracking (MediaPipe)
The system uses MediaPipe Pose Landmarker to detect body joints in real-time.

#### Vision Layer Logic
- **`poseClient.ts`**: Wraps MediaPipe tasks for landmark detection.
- **`angles.ts`**: Calculates joint angles with Exponential Moving Average (EMA) smoothing.
- **`repDetectors.ts`**: Implements state machines for exercise tracking.
- **`audioFeedback.ts`**: Provides voice cues and rep counts.

#### Supported Exercises
- **Squat**: Optimized for knee flexion depth.
- **Straight Leg Raise (SLR)**: Tracks hip flexion angle.
- **Elbow Flexion**: Standard bicep curl tracking.

Each exercise supports **Easy/Normal/Hard** difficulties and features **Personalized ROM Learning**.

### Authentication Flow
- Handled via Supabase Auth.
- Role-based access control for Doctors and Patients.
