
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/locale";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Camera, Upload, Loader2, AlertCircle, Eye, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getEventById, Event } from "@/lib/events";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function WelcomePageContent() {
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId');

  const [event, setEvent] = React.useState<Event | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  const [guestName, setGuestName] = React.useState<string | null>(null);
  const [showNameModal, setShowNameModal] = React.useState(false);
  const [nameInput, setNameInput] = React.useState("");
  
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
        const storedName = localStorage.getItem('guestName');
        if (storedName) {
            setGuestName(storedName);
        } else {
            // If no name, immediately show the modal.
            setShowNameModal(true);
        }
    }
  }, []);

  React.useEffect(() => {
    if (!eventId) {
      setError("No event ID provided. Please scan the QR code again.");
      setLoading(false);
      return;
    }

    async function fetchEvent() {
      try {
        const fetchedEvent = await getEventById(eventId as string);
        if (fetchedEvent) {
          setEvent(fetchedEvent);
        } else {
          setError(`Event not found. Please check the QR code or link.`);
        }
      } catch (e) {
        console.error("Failed to fetch event:", e);
        setError("Could not load event details. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchEvent();
  }, [eventId]);

  const handleNameSubmit = () => {
      if (nameInput.trim()) {
          localStorage.setItem('guestName', nameInput.trim());
          setGuestName(nameInput.trim());
          setShowNameModal(false);
      }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center text-center text-white">
        <Loader2 className="h-12 w-12 animate-spin mb-4" />
        <p className="text-xl">Loading Event...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <Card className="w-full max-w-md shadow-2xl bg-white/90 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Error</h2>
            <p className="text-destructive-foreground">{error || "The event could not be loaded."}</p>
             <Button asChild variant="link" className="mt-4">
                 <Link href="/">Go back to the main website</Link>
             </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <Image
        src={event.coverImageUrl || event.coverImage}
        alt={event.name}
        data-ai-hint="party people"
        layout="fill"
        objectFit="cover"
        className="absolute inset-0 z-0 scale-110 filter blur-md brightness-50"
    />
    <Dialog open={showNameModal} onOpenChange={setShowNameModal}>
        <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()} hideCloseButton>
             <DialogHeader>
                <DialogTitle>Welcome, guest!</DialogTitle>
                <DialogDescription>
                    Please enter your name to be displayed with your photos in the slideshow.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                        Name
                    </Label>
                    <Input id="name" value={nameInput} onChange={(e) => setNameInput(e.target.value)} className="col-span-3" />
                </div>
            </div>
             <DialogFooter>
                <Button onClick={handleNameSubmit} disabled={!nameInput.trim()}>
                    Save & Continue
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>


    <div className="relative z-10 text-center text-white p-4">
        <h1 className="text-4xl md:text-6xl font-headline font-bold drop-shadow-lg">
            {t('event_welcome_title')} {event.name}
        </h1>
         <p className="mt-4 text-lg md:text-xl max-w-2xl mx-auto drop-shadow-md">
            {guestName ? `Welcome, ${guestName}!` : t('event_welcome_pwa_prompt')}
        </p>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <Button asChild size="lg" className="h-20 text-xl py-6 px-8 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300" disabled={!guestName}>
                <Link href={`/event/${eventId}/camera`}>
                    <Camera className="mr-4 h-8 w-8" />
                    {t('start_taking_photos')}
                </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="h-20 text-xl py-6 px-8 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300" disabled={!guestName}>
                <Link href={`/event/${eventId}/upload`}>
                    <Upload className="mr-4 h-8 w-8" />
                    {t('upload_from_device')}
                </Link>
            </Button>
        </div>

        <div className="mt-16">
            <LanguageSwitcher />
        </div>
    </div>
    </>
  );
}

export default function EventLandingPage() {
    return (
        <div className="flex flex-col min-h-screen bg-black">
          <div className="container mx-auto p-4 flex-grow flex items-center justify-center">
            <React.Suspense fallback={<div className="text-white">Loading...</div>}>
              <WelcomePageContent />
            </React.Suspense>
          </div>
        </div>
      );
}
