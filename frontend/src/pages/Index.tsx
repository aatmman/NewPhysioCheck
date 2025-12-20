import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { AdherenceChart } from '@/components/dashboard/AdherenceChart';
import { RomPainChart } from '@/components/dashboard/RomPainChart';
import { PatientsAttention } from '@/components/dashboard/PatientsAttention';
import { RecentMessages } from '@/components/dashboard/RecentMessages';
import { useSession } from '@/context/SessionContext';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useMemo } from 'react';

const Index = () => {
  const { sessions: allSessions } = useSession();

  // DUMMY PATIENTS (Shared dummy data)
  const DUMMY_PATIENTS = [
    { id: 'patient-1', full_name: 'Demo Patient', status: 'active', condition: 'ACL Recovery' },
    { id: 'patient-2', full_name: 'John Doe', status: 'active', condition: 'Shoulder Rehab' }
  ];

  // Calculate dashboard stats from real data
  const dashboardStats = useMemo(() => {
    const patients = DUMMY_PATIENTS;
    const sessions = allSessions;

    const today = new Date();
    const getLocalDateString = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    const todayStr = getLocalDateString(today);

    const todaySessions = sessions.filter((s) => {
      const sessionDateStr = s.scheduled_date || (s.date) || (s.started_at ? s.started_at.split('T')[0] : null);
      return sessionDateStr === todayStr;
    });

    // Calculate patients needing attention (low adherence or high pain)
    // Simplified for dummy mode
    const patientsWithIssues = patients.filter((patient) => {
      // Mock logic: patient-1 has issues
      return patient.id === 'patient-1';
    });

    return {
      activePatients: patients.filter((p) => p.status === 'active').length,
      activePatientsTrend: 5, // Mock
      todaySessions: todaySessions.length,
      todaySessionsTrend: 2, // Mock
      urgentAlerts: patientsWithIssues.length,
      alertTags: ['Low Adherence', 'Pain Spike'] // Mock
    };
  }, [allSessions]);

  const isLoading = false;

  if (isLoading) {
    return (
      <MainLayout title="Home Dashboard">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading dashboard...</span>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Home Dashboard">
      <div className="space-y-6 animate-fade-in">
        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Active Patients"
            value={dashboardStats.activePatients}
            trend={dashboardStats.activePatientsTrend}
          />
          <StatCard
            title="Today's Sessions"
            value={dashboardStats.todaySessions}
            trend={dashboardStats.todaySessionsTrend}
          />
          <StatCard
            title="Urgent Alerts"
            value={dashboardStats.urgentAlerts}
            tags={dashboardStats.alertTags}
            highlight
            icon={<AlertTriangle className="w-5 h-5 text-warning" />}
          />
        </div>

        {/* Middle Row - Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AdherenceChart />
          <RomPainChart />
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PatientsAttention />
          <RecentMessages />
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
