
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLocale } from "@/lib/locale";

// Mock data, to be replaced with Firestore data
const eventData = {
    name: "Lisa & Mark's Wedding",
    description: "Our beautiful wedding day.",
};


export default function EditEventPage({ params }: { params: { eventId: string } }) {
  const { t } = useLocale();
  const [eventName, setEventName] = React.useState(eventData.name);
  const [eventDescription, setEventDescription] = React.useState(eventData.description);
  const router = useRouter();
  
  const handleSave = () => {
     // Here you would save the updated data to Firestore
    console.log("Saving data for event:", params.eventId);
    console.log({ eventName, eventDescription });
     console.log("Your event details have been saved.");
    router.push("/client/dashboard");
  };

  return (
    <div>
        <Button asChild variant="ghost" className="mb-4">
            <Link href="/client/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('client_edit_event_back_button')}
            </Link>
        </Button>
        <div className="flex justify-center items-start">
        <Card className="w-full max-w-2xl">
            <CardHeader>
            <CardTitle>{t('client_edit_event_title')}</CardTitle>
            <CardDescription>
                {t('client_edit_event_desc')}
            </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div>
                    <Label htmlFor="event-name">{t('client_edit_event_name_label')}</Label>
                    <Input id="event-name" value={eventName} onChange={(e) => setEventName(e.target.value)} />
                </div>
                <div>
                    <Label htmlFor="event-description">{t('client_edit_event_desc_label')}</Label>
                    <Textarea id="event-description" value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} />
                </div>
            </CardContent>
            <CardFooter>
                 <Button onClick={handleSave}>{t('save_changes')}</Button>
            </CardFooter>
        </Card>
        </div>
    </div>
  );
}
