
"use client";

import * as React from "react";
import Image from "next/image";
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
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, ArrowLeft, Loader2, Upload } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Event, getEventById, updateEvent, updateEventCoverImage } from "@/lib/events";
import { Slider } from "@/components/ui/slider";

export default function EditEventPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const [event, setEvent] = React.useState<Event | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [isUploadingCover, setIsUploadingCover] = React.useState(false);
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const router = useRouter();

  React.useEffect(() => {
      async function fetchEvent() {
          setLoading(true);
          const foundEvent = await getEventById(eventId);

          if (foundEvent) {
              setEvent(foundEvent);
          } else {
               console.error("Event not found");
          }
          setLoading(false);
      }
      fetchEvent();
  }, [eventId]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!event) return;
    const { id, value } = e.target;
    setEvent({ ...event, [id]: value });
  };

  const handleDateChange = (date: Date | undefined, field: 'startDate' | 'endDate') => {
      if (!event || !date) return;
      setEvent({ ...event, [field]: date.toISOString() });
  }

  const handleSwitchChange = (checked: boolean, field: 'isTest' | 'paid' | 'photosPublished' | 'showWegwerpcameraBranding') => {
       if (!event) return;
       setEvent({ ...event, [field]: checked });
  }
  
  const handleLimitChange = (value: string) => {
    if (!event) return;
    setEvent({ ...event, photoUploadLimit: parseInt(value, 10) });
  };
  
  const handleGuestLimitChange = (value: number[]) => {
    if (!event) return;
    // When admin changes guest limit, event needs to be paid for again.
    setEvent({ ...event, maxGuests: value[0], paid: false });
  };


  const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0 || !event) return;
      const file = e.target.files[0];
      
      setIsUploadingCover(true);

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
          const base64data = reader.result as string;

          // Optimistic UI update for the preview
          setEvent(prev => prev ? { ...prev, coverImageUrl: base64data } : null);

          const result = await updateEventCoverImage(eventId, base64data);
          
          if (result.success && result.url) {
                // Final update with the actual storage URL
               setEvent(prev => prev ? { ...prev, coverImageUrl: result.url, coverImage: file.name } : null);
               console.log("Cover image updated successfully.");
          } else {
              console.error(result.error || "Failed to upload cover image.");
              // Revert optimistic update on failure if needed
          }
           setIsUploadingCover(false);
      };
  };

  const handleSave = async () => {
    if (!event) return;
    setSaving(true);
    
    const result = await updateEvent(eventId, {
        name: event.name,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        isTest: event.isTest,
        paid: event.paid, // Pass the potentially updated paid status
        maxGuests: event.maxGuests,
        photoUploadLimit: event.photoUploadLimit,
        showWegwerpcameraBranding: event.showWegwerpcameraBranding,
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    setSaving(false);
    
      console.log("The event details have been successfully saved.");
      router.push("/admin/dashboard");
  };

  if (loading) {
      return (
          <div className="flex justify-center items-center h-full p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="ml-4">Loading event details...</p>
          </div>
      )
  }

  if (!event) {
      return (
           <div className="flex flex-col justify-center items-center h-full p-8 text-center">
              <h2 className="text-2xl font-bold">Event not found</h2>
              <p className="text-muted-foreground">The requested event could not be found.</p>
               <Button asChild variant="outline" className="mt-4">
                    <Link href="/admin/dashboard">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
          </div>
      )
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="icon">
                <Link href="/admin/dashboard">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
            </Button>
            <h1 className="text-xl font-semibold">Edit Event: {event.name}</h1>
        </div>

        <Card className="w-full">
            <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <CardDescription>
                Update the details for this event.
            </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
                 <div className="space-y-4">
                    <div>
                        <Label htmlFor="name">Event Name</Label>
                        <Input id="name" value={event.name} onChange={handleInputChange} />
                    </div>
                    <div>
                        <Label htmlFor="description">Event Description</Label>
                        <Textarea id="description" value={event.description} onChange={handleInputChange} rows={5} />
                    </div>
                    <div>
                        <Label>Cover Image</Label>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleCoverImageChange}
                            className="hidden"
                            accept="image/*"
                        />
                        <div className="mt-2 space-y-4">
                           <Image 
                                src={event.coverImageUrl || event.coverImage}
                                alt="Current cover image"
                                width={400}
                                height={200}
                                data-ai-hint="wedding couple"
                                className="aspect-video w-full rounded-md object-cover"
                            />
                            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploadingCover}>
                               {isUploadingCover ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                               {isUploadingCover ? "Uploading..." : "Change Cover Image"}
                            </Button>
                        </div>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Start Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !event.startDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {event.startDate ? format(new Date(event.startDate), "PPP") : <span>Pick a date</span>}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={new Date(event.startDate)}
                                    onSelect={(date) => handleDateChange(date, 'startDate')}
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div>
                            <Label>End Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !event.endDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {event.endDate ? format(new Date(event.endDate), "PPP") : <span>Pick a date</span>}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={event.endDate ? new Date(event.endDate) : undefined}
                                    onSelect={(date) => handleDateChange(date, 'endDate')}
                                />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label>Owner Email</Label>
                        <Input id="owner" value={event.owner} disabled />
                    </div>
                    <div className="space-y-2">
                        <Label>Photo Upload Limit</Label>
                        <Select
                            value={String(event.photoUploadLimit)}
                            onValueChange={handleLimitChange}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select an upload limit" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="5">5 Photos per guest</SelectItem>
                                <SelectItem value="10">10 Photos per guest</SelectItem>
                                <SelectItem value="24">24 Photos per guest (Standard)</SelectItem>
                                <SelectItem value="0">Unlimited Photos</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 rounded-lg border p-3 shadow-sm">
                         <div className="flex justify-between items-baseline">
                            <Label htmlFor="guest-slider" className="font-medium">Guest Limit</Label>
                            <span className="font-bold text-lg text-primary">{event.maxGuests} Guests</span>
                        </div>
                        <Slider
                            id="guest-slider"
                            min={5}
                            max={500}
                            step={5}
                            value={[event.maxGuests || 0]}
                            onValueChange={handleGuestLimitChange}
                        />
                        <p className="text-xs text-muted-foreground pt-2">
                            Adjusting this limit will require the client to pay for the new tier. The event will be marked as 'Unpaid' until payment is complete.
                        </p>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                            <Label>Test Event</Label>
                            <CardDescription>Is this a temporary test event?</CardDescription>
                        </div>
                        <Switch
                            checked={event.isTest}
                            onCheckedChange={(checked) => handleSwitchChange(checked, 'isTest')}
                        />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                            <Label>Show 'Powered by' Branding</Label>
                            <CardDescription>Display "Powered by wegwerpcamera.nl" in the slideshow.</CardDescription>
                        </div>
                        <Switch
                            checked={event.showWegwerpcameraBranding}
                            onCheckedChange={(checked) => handleSwitchChange(checked, 'showWegwerpcameraBranding')}
                        />
                    </div>
                 </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
                 <Button onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </CardFooter>
        </Card>
    </main>
  );
}

    
