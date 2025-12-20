import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCircle, Stethoscope } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { loginAsDoctor, loginAsPatient } = useAuth();

  const handleDoctorLogin = () => {
    loginAsDoctor();
    toast({
      title: "Welcome back, Doctor",
      description: "You have successfully logged in as a demo doctor.",
    });
    navigate('/dashboard');
  };

  const handlePatientLogin = () => {
    loginAsPatient();
    toast({
      title: "Welcome back",
      description: "You have successfully logged in as a demo patient.",
    });
    navigate('/patient/home');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl border-border bg-card">
        <CardHeader className="space-y-3 text-center pb-8">
          <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-2">
            <Stethoscope className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold text-foreground">
            PhysioCheck
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Select your role to continue 
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleDoctorLogin}
            className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-3"
          >
            <Stethoscope className="w-5 h-5" />
            Login as Doctor
          </Button>

          <Button
            onClick={handlePatientLogin}
            variant="outline"
            className="w-full h-14 text-lg font-semibold border-2 border-primary/20 hover:bg-secondary text-foreground flex items-center gap-3"
          >
            <UserCircle className="w-5 h-5" />
            Login as Patient
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}


