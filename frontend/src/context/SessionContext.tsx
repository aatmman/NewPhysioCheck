import { createContext, useContext, useState, ReactNode } from 'react';
import type { Session, SessionStatus, SessionRep } from '@/types/api';

interface SessionContextType {
    sessions: Session[];
    createSession: (input: {
        protocol_id: string;
        patient_id: string;
        date: string;
        notes?: string;
    }) => Session;
    updateSession: (id: string, updates: Partial<Session>) => Session;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
    const [sessions, setSessions] = useState<Session[]>(() => {
        const stored = localStorage.getItem('dummy_sessions');
        return stored ? JSON.parse(stored) : [];
    });

    const createSession = (input: {
        protocol_id: string;
        patient_id: string;
        date: string;
        notes?: string;
    }) => {
        const newSession: Session = {
            id: crypto.randomUUID(),
            protocol_id: input.protocol_id,
            patient_id: input.patient_id,
            assignment_id: crypto.randomUUID(), // Dummy assignment ID since we're skipping assignment creation for now
            scheduled_date: input.date,
            status: 'scheduled',
            notes: input.notes || null,
            created_at: new Date().toISOString(),
            // Initialize other required fields as null
            started_at: null,
            ended_at: null,
            pain_score_pre: null,
            pain_score_post: null,
            accuracy_avg: null,
            rom_delta: null,
            adherence_score: null,
            reps: [] // Start with empty reps
        };

        const updated = [...sessions, newSession];
        setSessions(updated);
        localStorage.setItem('dummy_sessions', JSON.stringify(updated));
        console.log('SESSION_CREATED', newSession);
        return newSession;
    };

    const updateSession = (id: string, updates: Partial<Session>) => {
        const updatedSessions = sessions.map(s =>
            s.id === id ? { ...s, ...updates } : s
        );
        setSessions(updatedSessions);
        localStorage.setItem('dummy_sessions', JSON.stringify(updatedSessions));
        return updatedSessions.find(s => s.id === id)!;
    };

    const value = {
        sessions,
        createSession,
        updateSession
    };

    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
    const context = useContext(SessionContext);
    if (context === undefined) {
        throw new Error('useSession must be used within a SessionProvider');
    }
    return context;
}
