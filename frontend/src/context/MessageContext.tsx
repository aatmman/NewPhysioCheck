import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Message } from '@/types/api';

interface MessageContextType {
    messages: Message[];
    sendMessage: (toUserId: string, text: string) => void;
    markAsRead: (fromUserId: string) => void;
    getConversation: (withUserId: string) => Message[];
    getUnreadCount: (userId: string) => number;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

const STORAGE_KEY = 'physiocheck_messages';


export function MessageProvider({ children }: { children: ReactNode }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const { user } = useAuth();
    const { toast } = useToast();

    // Load from localStorage
    const loadMessages = useCallback(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                let parsed = JSON.parse(stored);
                // Clear old hackathon mock messages if they still exist in storage
                if (Array.isArray(parsed) && parsed.some(m => m.id === 'msg-1' || m.id === 'msg-2')) {
                    parsed = [];
                    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
                }
                setMessages(parsed);
            } catch (e) {
                console.error('Failed to parse messages', e);
                setMessages([]);
            }
        } else {
            setMessages([]);
            localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
        }
    }, []);

    useEffect(() => {
        loadMessages();

        // Listen for storage events from other tabs
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY) {
                const newMessages = e.newValue ? JSON.parse(e.newValue) : [];

                // Find if there's a new message for the current user
                const oldMessages = e.oldValue ? JSON.parse(e.oldValue) : [];
                if (newMessages.length > oldMessages.length) {
                    const lastMsg = newMessages[newMessages.length - 1];
                    if (lastMsg.to_user === user?.id) {
                        toast({
                            title: "New Message",
                            description: lastMsg.text.substring(0, 50) + (lastMsg.text.length > 50 ? '...' : ''),
                        });
                    }
                }

                setMessages(newMessages);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [loadMessages, user?.id, toast]);

    const sendMessage = (toUserId: string, text: string) => {
        if (!user) return;

        const newMessage: Message = {
            id: `msg-${Date.now()}`,
            from_user: user.id,
            to_user: toUserId,
            text: text.trim(),
            created_at: new Date().toISOString(),
            read_at: null,
        };

        const updatedMessages = [...messages, newMessage];
        setMessages(updatedMessages);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMessages));

        // Manually trigger storage event for own tab if needed (though state update handles it)
        // Actually window.dispatchEvent(new Event('storage')) doesn't work for StorageEvent with key/value
    };

    const markAsRead = (fromUserId: string) => {
        if (!user) return;

        const updatedMessages = messages.map(msg => {
            if (msg.from_user === fromUserId && msg.to_user === user.id && !msg.read_at) {
                return { ...msg, read_at: new Date().toISOString() };
            }
            return msg;
        });

        setMessages(updatedMessages);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMessages));
    };

    const getConversation = (withUserId: string) => {
        if (!user) return [];
        return messages.filter(
            msg =>
                (msg.from_user === user.id && msg.to_user === withUserId) ||
                (msg.from_user === withUserId && msg.to_user === user.id)
        ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    };

    const getUnreadCount = (userId: string) => {
        if (!user) return 0;
        return messages.filter(msg => msg.from_user === userId && msg.to_user === user.id && !msg.read_at).length;
    };

    return (
        <MessageContext.Provider value={{ messages, sendMessage, markAsRead, getConversation, getUnreadCount }}>
            {children}
        </MessageContext.Provider>
    );
}

export function useMessages() {
    const context = useContext(MessageContext);
    if (context === undefined) {
        throw new Error('useMessages must be used within a MessageProvider');
    }
    return context;
}
