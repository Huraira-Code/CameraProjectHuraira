
'use client';

import Link from 'next/link';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WegwerpcameraLogo } from '@/components/snapmoment-logo';
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/lib/auth';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { sendPasswordResetEmail } from '@/lib/auth-actions';

function ForgotPasswordDialog() {
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const result = await sendPasswordResetEmail(email);

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || 'Failed to send reset email.');
    }
    setLoading(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
        // Reset state on close
        setEmail('');
        setError(null);
        setSuccess(false);
        setLoading(false);
    }
    setOpen(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="link" size="sm" className="ml-auto inline-block p-0 h-auto text-sm underline">
          Wachtwoord vergeten?
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
         <form onSubmit={handleSubmit}>
            <DialogHeader>
            <DialogTitle>Wachtwoord Resetten</DialogTitle>
            <DialogDescription>
                Voer uw e-mailadres in om een link voor het opnieuw instellen van uw wachtwoord te ontvangen.
            </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                {success ? (
                    <div className="flex flex-col items-center text-center gap-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                        <MailCheck className="h-12 w-12 text-green-600"/>
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                           Als er een account bestaat voor {email}, is er een e-mail verzonden met instructies.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="reset-email" className="text-right">
                        Email
                        </Label>
                        <Input
                        id="reset-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="col-span-3"
                        required
                        />
                    </div>
                )}
                {error && <p className="text-sm text-destructive col-span-4">{error}</p>}
            </div>
            <DialogFooter>
             {success ? (
                 <Button type="button" onClick={() => handleOpenChange(false)}>Sluiten</Button>
             ) : (
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Verstuur Reset Link
                </Button>
             )}
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


export default function LoginPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { user, role, loading: authLoading } = useAuth();
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const initialTab = searchParams.get('tab') || 'client';
  
  const [activeTab, setActiveTab] = React.useState(initialTab);

  React.useEffect(() => {
    if (!authLoading && user) {
        if (role === 'Admin') {
            router.push(redirectUrl || '/admin/dashboard');
        } else if (role === 'Client') {
             router.push(redirectUrl || '/client/dashboard');
        } else if (role === 'Partner') {
            router.push(redirectUrl || '/partner/dashboard');
        }
    }
  }, [user, role, authLoading, router, redirectUrl]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.email) {
          throw new Error("User email is not available.");
      }
      
      const userRole = await (async () => {
          const staffRef = doc(db, 'staff', user.email!);
          const staffDoc = await getDoc(staffRef);
          if (staffDoc.exists()) {
            const staffData = staffDoc.data();
            if (staffData.role === 'Admin') return 'Admin';
            if (staffData.role === 'Client') return 'Client';
          }

          const partnerRef = doc(db, 'partners', user.email!);
          const partnerDoc = await getDoc(partnerRef);
          if (partnerDoc.exists()) {
              return 'Partner';
          }
          return null;
      })();


      if (activeTab === 'admin' && userRole === 'Admin') {
          console.log('Admin Login Succesvol, u wordt doorgestuurd...');
          router.push('/admin/dashboard');
      } else if (activeTab === 'client' && (userRole === 'Client' || userRole === 'Admin')) {
          console.log('Login Succesvol, welkom terug!');
          router.push('/client/dashboard');
      } else if (activeTab === 'partner' && (userRole === 'Partner' || userRole === 'Admin')) {
         console.log('Partner login successful, redirecting...');
         router.push('/partner/dashboard');
      }
      else {
          await auth.signOut();
          throw new Error('Toegang geweigerd voor deze rol.');
      }
    } catch (error: any) {
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
            setError('Onjuiste e-mail of wachtwoord. Controleer uw gegevens en probeer het opnieuw.');
        } else {
            setError(error.message || 'Er is een onbekende fout opgetreden.');
        }
    } finally {
      setLoading(false);
    }
  };
  
  if (authLoading || user) {
      return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
         </div>
      )
  }


  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/20">
      <Button asChild variant="ghost" className="absolute top-4 left-4">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Terug naar Home
        </Link>
      </Button>
      <div className="w-full max-w-md p-4">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <WegwerpcameraLogo />
          </Link>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="client">Klant</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
            <TabsTrigger value="partner">Partner</TabsTrigger>
          </TabsList>

          <form onSubmit={handleLogin}>
            <TabsContent value="client">
              <LoginCard
                title="Client Login"
                description="Toegang tot uw evenementendashboard."
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                loading={loading}
                error={error}
              />
            </TabsContent>
            <TabsContent value="admin">
              <LoginCard
                title="Admin Login"
                description="Toegang tot het admin-paneel."
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                loading={loading}
                error={error}
              />
            </TabsContent>
            <TabsContent value="partner">
               <LoginCard
                title="Partner Login"
                description="Toegang tot uw partnerdashboard."
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                loading={loading}
                error={error}
              />
            </TabsContent>
          </form>
        </Tabs>
      </div>
    </div>
  );
}

interface LoginCardProps {
  title: string;
  description: string;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  loading: boolean;
  error: string | null;
  disabled?: boolean;
}

function LoginCard({ title, description, email, setEmail, password, setPassword, loading, error, disabled = false }: LoginCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || disabled}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center">
            <Label htmlFor="password">Wachtwoord</Label>
            <ForgotPasswordDialog />
          </div>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading || disabled}
          />
        </div>
        {error && (
            <Alert variant="destructive">
                <AlertTitle>Login Mislukt</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        <Button type="submit" className="w-full" disabled={loading || disabled}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Inloggen
        </Button>
      </CardContent>
    </Card>
  );
}
