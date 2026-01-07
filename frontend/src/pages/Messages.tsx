import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMessages } from '@/context/MessageContext';
import { Search, Send, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Message, Patient } from '@/types/api';
import { patientService } from '@/lib/services/patientService';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';

const formatMessageTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const formatMessageDate = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString();
};


const Messages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { messages, sendMessage, getConversation, markAsRead } = useMessages();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Still get patients for conversation list (mock service is fine)
  const { data: patientsData, isLoading: patientsLoading } = useQuery({
    queryKey: ['patients', 'for-messages'],
    queryFn: () => patientService.getAll({ limit: 100 }),
  });

  // Get conversation with selected patient from context (Oldest to Newest)
  const selectedConversation = useMemo(() => {
    return selectedPatientId ? getConversation(selectedPatientId).slice().reverse() : [];
  }, [selectedPatientId, messages, getConversation]);

  // Mark as read when messages change or patient selected
  useEffect(() => {
    if (selectedPatientId) {
      markAsRead(selectedPatientId);
    }
  }, [selectedPatientId, messages, markAsRead]);

  // Build conversation list from messages and patients
  const conversations = useMemo(() => {
    let patients = patientsData?.data || [];

    // Always add the demo patient if not present in the fetched data for hackathon
    if (!patients.find(p => p.id === 'patient-1')) {
      patients = [...patients, {
        id: 'patient-1',
        full_name: 'Demo Patient',
        condition: 'Post-op Knee Rehab',
        status: 'active',
        doctor_id: 'doctor-1',
        created_at: new Date().toISOString()
      } as Patient];
    }

    const allMessagesList = messages;

    // Group messages by other user (patient)
    const conversationMap = new Map<string, { lastMessage: Message; unread: boolean }>();

    allMessagesList.forEach((msg) => {
      // For doctor, get messages where doctor is sender or receiver
      const otherUserId = msg.from_user === user?.id ? msg.to_user : msg.from_user;
      const existing = conversationMap.get(otherUserId);

      if (!existing || new Date(msg.created_at) > new Date(existing.lastMessage.created_at)) {
        conversationMap.set(otherUserId, {
          lastMessage: msg,
          unread: msg.from_user !== user?.id && !msg.read_at,
        });
      }
    });

    // Create conversation entries for all patients (with messages if they exist)
    const conversationList = patients.map((patient) => {
      const data = conversationMap.get(patient.id);

      if (data) {
        // Patient has messages
        return {
          patientId: patient.id,
          patient,
          lastMessage: data.lastMessage,
          unread: data.unread,
          lastMessageTime: formatMessageTime(data.lastMessage.created_at),
        };
      } else {
        // Patient has no messages yet
        return {
          patientId: patient.id,
          patient,
          lastMessage: null,
          unread: false,
          lastMessageTime: '',
        };
      }
    });

    // Sort: conversations with messages first (by most recent), then patients without messages
    return conversationList.sort((a, b) => {
      if (a.lastMessage && b.lastMessage) {
        return new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime();
      }
      if (a.lastMessage) return -1;
      if (b.lastMessage) return 1;
      return a.patient.full_name.localeCompare(b.patient.full_name);
    });
  }, [messages, patientsData, patientsLoading, user?.id]);

  // Filter conversations by search
  const filteredConversations = conversations.filter((conv) =>
    conv.patient.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected conversation data
  const selectedPatient = filteredConversations.find((c) => c.patientId === selectedPatientId)?.patient;

  // Auto-select first conversation
  useEffect(() => {
    if (!selectedPatientId && filteredConversations.length > 0) {
      setSelectedPatientId(filteredConversations[0].patientId);
    }
  }, [filteredConversations, selectedPatientId]);

  // Auto-scroll to bottom only when a new message is added
  const prevMessageCount = useRef(selectedConversation.length);
  useEffect(() => {
    if (selectedConversation.length > prevMessageCount.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessageCount.current = selectedConversation.length;
  }, [selectedConversation]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedPatientId) return;
    sendMessage(selectedPatientId, newMessage.trim());
    setNewMessage('');
  };

  return (
    <MainLayout title="Messages">
      <div className="flex gap-0 animate-fade-in h-[calc(100vh-10rem)]">
        {/* Conversations List */}
        <div className="w-96 border-r border-border flex flex-col">
          {/* Search */}
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {filteredConversations.length === 0 && patientsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {searchTerm ? 'No conversations found' : 'No conversations yet'}
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.patientId}
                  onClick={() => setSelectedPatientId(conv.patientId)}
                  className={`flex items-center gap-3 p-4 cursor-pointer transition-colors ${selectedPatientId === conv.patientId ? 'bg-secondary' : 'hover:bg-secondary/50'
                    }`}
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    {conv.unread && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-foreground truncate">{conv.patient.full_name}</p>
                      <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                        {conv.lastMessageTime}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {conv.lastMessage ? (
                        <>
                          {conv.lastMessage.from_user === user?.id ? 'You: ' : ''}
                          {conv.lastMessage.text}
                        </>
                      ) : (
                        'No messages yet'
                      )}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedPatientId && selectedPatient ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{selectedPatient.full_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedPatient.condition || 'Patient'}</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-6 space-y-4 pb-12">
                {selectedConversation.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  <>
                    {selectedConversation
                      .map((msg, index, arr) => {
                        const prevMsg = index > 0 ? arr[index - 1] : null;
                        const showDate =
                          !prevMsg ||
                          formatMessageDate(msg.created_at) !== formatMessageDate(prevMsg.created_at);

                        const isFromCurrentUser = msg.from_user === user?.id;

                        return (
                          <div key={msg.id}>
                            {showDate && (
                              <div className="flex items-center gap-4 my-6">
                                <div className="flex-1 h-px bg-border" />
                                <span className="text-xs text-muted-foreground">
                                  {formatMessageDate(msg.created_at)}
                                </span>
                                <div className="flex-1 h-px bg-border" />
                              </div>
                            )}

                            <div
                              className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`flex gap-2 max-w-[85%] ${isFromCurrentUser ? 'flex-row-reverse' : ''}`}
                              >
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                  <User className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                                </div>
                                <div className={`min-w-0 flex flex-col ${isFromCurrentUser ? 'items-end' : 'items-start'}`}>
                                  <div
                                    className={`message-bubble ${isFromCurrentUser
                                      ? 'message-bubble-outgoing'
                                      : 'message-bubble-incoming'
                                      } w-fit max-w-full`}
                                  >
                                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                                  </div>
                                  <span className={`text-xs text-muted-foreground mt-1 block ${isFromCurrentUser ? 'text-right' : 'text-left'}`}>
                                    {new Date(msg.created_at).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Type your message here..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e as any);
                        }
                      }}
                      className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="w-12 h-12 p-0"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Messages;
