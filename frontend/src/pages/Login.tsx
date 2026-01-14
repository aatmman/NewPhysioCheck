import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import {
  fetchDemoUsers,
  checkDemoUsersExist,
  seedDemoData,
  DemoUser
} from '@/lib/demoAuth';
import { Loader2, Stethoscope, Database, AlertCircle, User, Lock, ArrowRight } from 'lucide-react';

// Demo credentials mapping
const DEMO_CREDENTIALS = [
  {
    username: 'doctor@demo.physiocheck.com',
    password: 'demo123',
    role: 'doctor' as const,
    name: 'Dr. Sarah Chen',
    description: 'View patient progress, create protocols, manage sessions'
  },
  {
    username: 'patient1@demo.physiocheck.com',
    password: 'demo123',
    role: 'patient' as const,
    name: 'John Smith',
    description: 'Primary patient account'
  },
  {
    username: 'patient2@demo.physiocheck.com',
    password: 'demo123',
    role: 'patient' as const,
    name: 'Emily Johnson',
    description: 'Secondary patient account'
  },
  {
    username: 'patient3@demo.physiocheck.com',
    password: 'demo123',
    role: 'patient' as const,
    name: 'Michael Brown',
    description: 'Tertiary patient account'
  }
];

export default function Login() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const { toast } = useToast();

  const [demoUsers, setDemoUsers] = useState<DemoUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [needsSeed, setNeedsSeed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate(user.role === 'doctor' ? '/dashboard' : '/patient/home');
    }
  }, [user, navigate]);

  // Fetch demo users on mount
  useEffect(() => {
    loadDemoUsers();
  }, []);

  const loadDemoUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      // First check if demo users exist
      const exists = await checkDemoUsersExist();

      if (!exists) {
        setNeedsSeed(true);
        setLoading(false);
        return;
      }

      // Fetch the demo users
      const users = await fetchDemoUsers();
      setDemoUsers(users);
      setNeedsSeed(false);
    } catch (e: any) {
      console.error('[Login] Error loading demo users:', e);
      setError(e.message || 'Failed to load demo users. Check Supabase connection.');
      setNeedsSeed(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedData = async () => {
    setSeeding(true);
    setError(null);

    try {
      const result = await seedDemoData();

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
        });
        // Reload demo users
        await loadDemoUsers();
      } else {
        setError(result.message);
        toast({
          title: 'Seed Failed',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (e: any) {
      setError(e.message || 'Failed to seed demo data');
      toast({
        title: 'Error',
        description: 'Failed to seed demo data',
        variant: 'destructive',
      });
    } finally {
      setSeeding(false);
    }
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!username || !password) {
      toast({
        title: 'Missing Credentials',
        description: 'Please enter both username and password',
        variant: 'destructive',
      });
      return;
    }

    setLoggingIn(true);

    try {
      // Find matching demo user by email
      const matchedUser = demoUsers.find(u => u.email.toLowerCase() === username.toLowerCase());

      if (!matchedUser) {
        toast({
          title: 'Invalid Credentials',
          description: 'User not found. Please check your username.',
          variant: 'destructive',
        });
        setLoggingIn(false);
        return;
      }

      // Check password (demo password is always 'demo123')
      if (password !== 'demo123') {
        toast({
          title: 'Invalid Credentials',
          description: 'Incorrect password. Try "demo123"',
          variant: 'destructive',
        });
        setLoggingIn(false);
        return;
      }

      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 300));

      login(matchedUser);

      toast({
        title: `Welcome, ${matchedUser.name}!`,
        description: `Logged in as ${matchedUser.role}`,
      });

      // Navigate based on role
      navigate(matchedUser.role === 'doctor' ? '/dashboard' : '/patient/home');
    } catch (e) {
      console.error('[Login] Error:', e);
      toast({
        title: 'Login Failed',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setLoggingIn(false);
    }
  };

  const fillCredentials = (cred: typeof DEMO_CREDENTIALS[0]) => {
    setUsername(cred.username);
    setPassword(cred.password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo/Title */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">PhysioCheck</h1>
          <p className="text-muted-foreground">
            AI-Powered Physical Therapy Platform
          </p>
        </div>

        {/* Main Login Card */}
        <Card className="border-2">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access the platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            ) : error && needsSeed ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-destructive/10 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                  <div>
                    <p className="font-medium text-destructive">Database Setup Required</p>
                    <p className="text-sm text-muted-foreground mt-1">{error}</p>
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={handleSeedData}
                  disabled={seeding}
                >
                  {seeding ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Seeding Database...
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4 mr-2" />
                      Seed Demo Data
                    </>
                  )}
                </Button>
              </div>
            ) : needsSeed ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-amber-500/10 rounded-lg">
                  <Database className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="font-medium">No Demo Data Found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Click below to set up demo users and sample data.
                    </p>
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={handleSeedData}
                  disabled={seeding}
                >
                  {seeding ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Seeding Database...
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4 mr-2" />
                      Seed Demo Data
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Username Field */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">
                    Email / Username
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="username"
                      type="email"
                      placeholder="Enter your email"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10"
                      disabled={loggingIn}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      disabled={loggingIn}
                    />
                  </div>
                </div>

                {/* Login Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loggingIn || !username || !password}
                >
                  {loggingIn ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Demo Credentials Card */}
        {!loading && !needsSeed && (
          <Card className="border border-border/50 bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Demo Credentials
              </CardTitle>
              <CardDescription className="text-xs">
                Click "Fill" to auto-fill login credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {DEMO_CREDENTIALS.map((cred, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{cred.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        cred.role === 'doctor'
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {cred.role === 'doctor' ? 'Doctor' : 'Patient'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {cred.username}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 text-xs h-7 px-3 text-primary hover:text-primary hover:bg-primary/10"
                    onClick={() => fillCredentials(cred)}
                    disabled={loggingIn}
                  >
                    Fill
                  </Button>
                </div>
              ))}
              <p className="text-xs text-muted-foreground text-center pt-2">
                Password for all accounts: <code className="bg-secondary px-1.5 py-0.5 rounded">demo123</code>
              </p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground space-y-1">
          <p>Demo Mode • No real authentication</p>
          <p>All session data persists to Supabase</p>
        </div>
      </div>
    </div>
  );
}
