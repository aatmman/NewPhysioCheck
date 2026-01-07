import { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import type { Protocol, ProtocolStep, Exercise } from '@/types/api';

import StraightLegRaiseImg from '@/assets/images/StraightLegRaise.png';
import SquatImg from '@/assets/images/Squat.png';
import ElbowFlexionImg from '@/assets/images/ElbowFlexion.png';

// Re-export Exercise from api.ts effectively by using it
export { type Exercise };

interface ProtocolContextType {
    exercises: Exercise[];
    protocols: Protocol[];
    createProtocol: (input: { title: string; steps: Omit<ProtocolStep, 'id' | 'created_at' | 'protocol_id'>[] }) => Protocol;
}

const ProtocolContext = createContext<ProtocolContextType | undefined>(undefined);

// Dummy Exercises Data matching Exercise interface from api.ts
const DUMMY_EXERCISES: Exercise[] = [
    {
        id: 'ex-1',
        name: 'Straight Leg Raise',
        description: 'Lift your leg while keeping it straight.',
        joint: 'Knee',
        difficulty: 'Beginner',
        position: 'Supine',
        image_url: StraightLegRaiseImg,
        created_at: new Date().toISOString(),
        normal_range_min: null,
        normal_range_max: null,
        equipment: null
    },
    {
        id: 'ex-2',
        name: 'Squat',
        description: 'Basic squat movement.',
        joint: 'Hip/Knee',
        difficulty: 'Intermediate',
        position: 'Standing',
        image_url: SquatImg,
        created_at: new Date().toISOString(),
        normal_range_min: null,
        normal_range_max: null,
        equipment: null
    },
    {
        id: 'ex-3',
        name: 'Elbow Flexion',
        description: 'Bending the elbow.',
        joint: 'Elbow',
        difficulty: 'Beginner',
        position: 'Sitting',
        image_url: ElbowFlexionImg,
        created_at: new Date().toISOString(),
        normal_range_min: null,
        normal_range_max: null,
        equipment: null
    }
];

export function ProtocolProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [protocols, setProtocols] = useState<Protocol[]>(() => {
        const stored = localStorage.getItem('dummy_protocols');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                // Migration: Handle legacy data where 'name' was used instead of 'title'
                // and 'exercises' were used instead of 'steps'
                return parsed.map((p: any) => ({
                    ...p,
                    title: p.title || p.name || 'Untitled Protocol', // Fallback for legacy 'name'
                    steps: p.steps || p.exercises?.map((ex: any, idx: number) => ({ // Fallback for legacy 'exercises'
                        id: ex.id || crypto.randomUUID(),
                        protocol_id: p.id,
                        exercise_id: ex.exerciseId || ex.exercise_id,
                        sets: ex.sets,
                        reps: ex.reps,
                        duration_seconds: ex.duration_seconds,
                        side: ex.side,
                        order_index: idx,
                        created_at: new Date().toISOString()
                    })) || []
                }));
            } catch (e) {
                console.error('Failed to parse protocols', e);
                return [];
            }
        }
        return [];
    });

    const createProtocol = (input: { title: string; steps: Omit<ProtocolStep, 'id' | 'created_at' | 'protocol_id'>[] }) => {
        const protocolId = crypto.randomUUID();
        const newProtocol: Protocol = {
            id: protocolId,
            title: input.title,
            doctor_id: user?.id || 'unknown',
            notes: null,
            created_at: new Date().toISOString(),
            steps: input.steps.map((step, index) => ({
                ...step,
                id: crypto.randomUUID(),
                protocol_id: protocolId,
                created_at: new Date().toISOString(),
                // Ensure required fields are present (handling optional vs null differences if any)
                sets: step.sets ?? null,
                reps: step.reps ?? null,
                duration_seconds: step.duration_seconds ?? null,
                side: step.side ?? null,
                notes: step.notes ?? null,
                order_index: index
            }))
        };

        const updated = [...protocols, newProtocol];
        setProtocols(updated);
        localStorage.setItem('dummy_protocols', JSON.stringify(updated));
        console.log('PROTOCOL_CREATED', newProtocol);
        return newProtocol;
    };

    const value = {
        exercises: DUMMY_EXERCISES,
        protocols,
        createProtocol
    };

    return <ProtocolContext.Provider value={value}>{children}</ProtocolContext.Provider>;
}

export function useProtocol() {
    const context = useContext(ProtocolContext);
    if (context === undefined) {
        throw new Error('useProtocol must be used within a ProtocolProvider');
    }
    return context;
}
