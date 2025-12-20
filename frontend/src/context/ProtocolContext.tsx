import { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export type ExerciseKey = 'SLR' | 'SQUAT' | 'ELBOW_FLEXION';

export interface Exercise {
    id: string;
    key: ExerciseKey;
    name: string;
    description?: string;
    image_url?: string;
    joint?: string;
    difficulty?: string;
    position?: string;
}

export interface ProtocolExercise {
    id: string; // unique id for this step
    exerciseId: string;
    exerciseKey: ExerciseKey;
    // UI fields used in builder
    sets?: number;
    reps?: number;
    duration_seconds?: number | null;
    side?: 'left' | 'right' | 'both' | null;
    order_index?: number;
    name?: string; // Helper for UI display
}

export interface Protocol {
    id: string;
    name: string;
    exercises: ProtocolExercise[];
    createdBy: string;
    createdAt: string;
}

interface ProtocolContextType {
    exercises: Exercise[];
    protocols: Protocol[];
    createProtocol: (input: { name: string; exercises: Omit<ProtocolExercise, 'id'>[] }) => Protocol;
}

const ProtocolContext = createContext<ProtocolContextType | undefined>(undefined);

// Dummy Exercises Data
const DUMMY_EXERCISES: Exercise[] = [
    {
        id: 'ex-1',
        key: 'SLR',
        name: 'Straight Leg Raise',
        description: 'Lift your leg while keeping it straight.',
        joint: 'Knee',
        difficulty: 'Beginner',
        position: 'Supine',
        image_url: 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=800&auto=format&fit=crop&q=60' // Placeholder
    },
    {
        id: 'ex-2',
        key: 'SQUAT',
        name: 'Squat',
        description: 'Basic squat movement.',
        joint: 'Hip/Knee',
        difficulty: 'Intermediate',
        position: 'Standing',
        image_url: 'https://images.unsplash.com/photo-1574680096141-1cddd32e01f9?w=800&auto=format&fit=crop&q=60'
    },
    {
        id: 'ex-3',
        key: 'ELBOW_FLEXION',
        name: 'Elbow Flexion',
        description: 'Bending the elbow.',
        joint: 'Elbow',
        difficulty: 'Beginner',
        position: 'Sitting',
        image_url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&auto=format&fit=crop&q=60'
    }
];

export function ProtocolProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [protocols, setProtocols] = useState<Protocol[]>(() => {
        const stored = localStorage.getItem('dummy_protocols');
        return stored ? JSON.parse(stored) : [];
    });

    const createProtocol = (input: { name: string; exercises: Omit<ProtocolExercise, 'id'>[] }) => {
        const newProtocol: Protocol = {
            id: crypto.randomUUID(),
            name: input.name,
            exercises: input.exercises.map(ex => ({
                ...ex,
                id: crypto.randomUUID()
            })),
            createdBy: user?.id || 'unknown',
            createdAt: new Date().toISOString()
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
