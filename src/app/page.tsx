
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { WegwerpcameraLogo } from "@/components/snapmoment-logo";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="container mx-auto p-4 flex justify-between items-center">
        <WegwerpcameraLogo />
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <a href="https://www.wegwerpcamera.nl" target="_blank" rel="noopener noreferrer">
              Website
            </a>
          </Button>
          <Button asChild>
            <Link href="/login">Client Login</Link>
          </Button>
        </div>
      </header>
      <main className="flex-grow flex flex-col items-center justify-center text-center p-4">
        <section className="max-w-3xl">
          <h1 className="text-5xl md:text-7xl font-bold">
            Leg Elk Moment Direct Vast
          </h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            wegwerpcamera.nl maakt van elke gast een fotograaf. Creëer moeiteloos een live, gezamenlijke fotogalerij voor uw evenement.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/login-portals">Begin Nu</Link>
            </Button>
             <Button size="lg" variant="outline" asChild>
               <Link href="/test-login">Demo Evenement</Link>
            </Button>
          </div>
        </section>
      </main>
      <footer className="container mx-auto p-4 text-center text-muted-foreground text-sm">
        <p>© {new Date().getFullYear()} Wegwerpcamera.nl. Alle rechten voorbehouden.</p>
        <Link href="/login-portals" className="underline hover:text-foreground">
          Login Portals
        </Link>
      </footer>
    </div>
  );
}
