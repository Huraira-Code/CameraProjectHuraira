
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Shield, Building, ArrowRight } from 'lucide-react';
import { WegwerpcameraLogo } from '@/components/snapmoment-logo';

export default function LoginPortalsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted/40 p-4">
       <div className="text-center mb-10">
          <Link href="/" className="inline-block">
            <WegwerpcameraLogo />
          </Link>
        </div>
      <div className="w-full max-w-4xl text-center">
        <h1 className="text-4xl font-bold mb-2">Selecteer uw Portal</h1>
        <p className="text-muted-foreground mb-8">Kies het type account waarmee u wilt inloggen.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="items-center">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                  <User className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Client Portal</CardTitle>
              <CardDescription className="text-center">Voor evenementeigenaren en klanten. Beheer uw evenementen, bekijk foto's en meer.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/login?tab=client">
                  Inloggen als Klant <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="items-center">
              <div className="p-4 bg-destructive/10 rounded-full mb-4">
                <Shield className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle>Admin Portal</CardTitle>
              <CardDescription className="text-center">Alleen voor beheerders. Toegang tot het volledige beheer van het platform.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full" variant="destructive">
                <Link href="/login?tab=admin">
                  Inloggen als Admin <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow opacity-50 cursor-not-allowed">
            <CardHeader className="items-center">
              <div className="p-4 bg-secondary-foreground/10 rounded-full mb-4">
                 <Building className="h-8 w-8 text-secondary-foreground" />
              </div>
              <CardTitle>Partner Portal</CardTitle>
              <CardDescription className="text-center">Voor aangesloten bedrijven en partners. Binnenkort beschikbaar.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full" variant="secondary" disabled>
                <Link href="/login?tab=partner">
                  Partner Login <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
