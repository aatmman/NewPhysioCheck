# NewPhysioCheck: Technical Pitch (3 Minutes)

## 0:00 - 0:45 | The Challenge & Our Vision
"Physical therapy often fails between the clinic and the home. Patients struggle with form, and doctors lack objective data on progress. **PhysioCheck** bridges this gap using professional-grade pose estimation directly in the browser. Our vision is to provide real-time, AI-powered guidance that transforms a laptop camera into a digital physical therapist."

## 0:45 - 1:45 | The Technical Core: Edge-AI Vision
"Unlike traditional apps that just play videos, we’ve built a sophisticated **Vision Layer**. 
1. **Pose Landmarking**: We leverage **MediaPipe's Pose Landmarker** to extract 33 3D body landmarks in real-time. This happens entirely on the user's device, ensuring maximum privacy and zero-latency feedback.
2. **Geometric Analysis**: Our custom math engine calculates joint angles (like knee or elbow flexion) using vector-based physics. We use **Exponential Moving Averages (EMA)** to smooth out sensor noise.
3. **State Machine Detection**: We don't just 'see' movement; we understand it. Our detectors use robust state machines (e.g., READY → DOWN → BOTTOM → UP) to accurately count reps and, more importantly, score **Form Quality** based on Range of Motion (ROM) and Tempo."

## 1:45 - 2:30 | The Modern Tech Stack
"To build this at scale, we chose a performance-first stack:
*   **Vite + React + TypeScript**: Provides a lightning-fast developer experience and a type-safe environment for complex vision logic.
*   **Supabase**: Acts as our robust backend-as-a-service, handling everything from Identity and Real-time messaging to our PostgreSQL database where we store granular per-rep metrics.
*   **TanStack Query**: Manages our server state, ensuring the UI between the Doctor Dashboard and Patient App stays perfectly synchronized with minimal overhead.
*   **Shadcn/UI & Tailwind**: Allows us to maintain a premium, accessible interface that feels more like a medical-grade tool than a simple website."

## 2:30 - 3:00 | Why This Stack Wins
"We chose this tech stack for three reasons:
1. **Speed**: Vite and Supabase allowed us to move from prototype to production in weeks.
2. **Privacy**: By processing AI on the edge (client-side), we don't need to send patient video feeds to a server.
3. **Objectivity**: We aren't just tracking if someone worked out; we are capturing degree-accurate data that doctors use to make clinical decisions. 

NewPhysioCheck isn't just an app; it's an intelligent data bridge for the future of rehabilitation."

---

## Technical Workflow Summary
1.  **Frame Capture**: MediaPipe processes 30+ FPS directly from the webcam.
2.  **Analysis**: Vector-based math calculates joint angles.
3.  **Heuristics**: Rep detectors assess form vs. target protocols.
4.  **Feedback**: Real-time UI updates for the patient.
5.  **Sync**: Session data (reps, ROM, tempo) is persisted to Supabase for clinical review.
