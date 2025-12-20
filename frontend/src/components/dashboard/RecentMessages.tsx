import { useAuth } from '@/context/AuthContext';
import { Loader2, User } from 'lucide-react';
import { useMemo } from 'react';

// Simplified types for dummy mode
interface DummyMessage {
  id: string;
  text: string;
  from_user: string;
  to_user: string;
  created_at: string;
}

interface DummyPatient {
  id: string;
  full_name: string;
}

export function RecentMessages() {
  const { user } = useAuth();

  // Sort of dummy data for now as we don't have MessageContext yet
  const recentMessagesWithPatient = useMemo(() => {
    if (!user?.id) return [];

    const dummyMessages = [
      { id: 'm1', text: 'How are you feeling today?', from_user: 'doctor-1', to_user: 'patient-1', created_at: new Date().toISOString() },
      { id: 'm2', text: 'Much better, thanks!', from_user: 'patient-1', to_user: 'doctor-1', created_at: new Date().toISOString() }
    ];

    const dummyPatients = [
      { id: 'patient-1', full_name: 'Demo Patient' }
    ];

    return dummyMessages.map(msg => ({
      message: msg,
      patient: dummyPatients.find(p => p.id === (msg.from_user === 'doctor-1' ? msg.to_user : msg.from_user)),
      isFromCurrentUser: msg.from_user === user.id
    })).filter(m => m.patient);
  }, [user?.id]);

  const messagesLoading = false;

  if (messagesLoading) {
    return (
      <div className="stat-card">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Messages</h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (recentMessagesWithPatient.length === 0) {
    return (
      <div className="stat-card">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Messages</h3>
        <p className="text-sm text-muted-foreground">No recent messages</p>
      </div>
    );
  }

  return (
    <div className="stat-card">
      <h3 className="text-lg font-semibold text-foreground mb-4">Recent Messages</h3>

      <div className="space-y-4">
        {recentMessagesWithPatient.map(({ message, patient, isFromCurrentUser }) => (
          <div
            key={message.id}
            className={`flex items-start gap-3 ${isFromCurrentUser ? 'flex-row-reverse' : ''}`}
          >
            {!isFromCurrentUser && patient && (
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-primary" />
              </div>
            )}
            <div className={`flex-1 ${isFromCurrentUser ? 'text-right' : ''}`}>
              {!isFromCurrentUser && patient && (
                <p className="font-medium text-foreground text-sm mb-1">{patient.full_name}</p>
              )}
              {isFromCurrentUser && (
                <p className="font-medium text-foreground text-sm mb-1">You</p>
              )}
              <div
                className={`message-bubble text-sm ${isFromCurrentUser
                    ? 'message-bubble-outgoing'
                    : 'message-bubble-incoming'
                  }`}
              >
                {message.text}
              </div>
            </div>
            {isFromCurrentUser && (
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-primary" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
