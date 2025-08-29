
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Loader2, ArrowLeft, ClipboardCopy, Check } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createEvent, CreateEventData } from "@/lib/events";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formSchema = z.object({
  eventName: z.string().min(3, "Event name must be at least 3 characters."),
  eventDescription: z.string().optional(),
  startDate: z.date({ required_error: "A start date is required." }),
  ownerEmail: z.string().email("A valid client email is required."),
  clientPassword: z.string().min(6, "Password must be at least 6 characters long."),
  photoUploadLimit: z.string().default("24"),
});

type FormData = z.infer<typeof formSchema>;

export default function NewPartnerEventPage() {
  const { user, partner } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = React.useState(false);
  const [createdCredentials, setCreatedCredentials] = React.useState({ email: "", password: "" });
  const [isCopied, setIsCopied] = React.useState(false);

  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        photoUploadLimit: "24",
    }
  });

  const primaryColor = partner?.branding?.primaryColor || 'hsl(var(--primary))';
  const textColor = partner?.branding?.textColor || 'hsl(var(--primary-foreground))';
  
  const copyToClipboard = () => {
    const loginUrl = `${window.location.origin}/login?tab=client`;
    const textToCopy = `Client Login:\nLink: ${loginUrl}\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const onSubmit = async (data: FormData) => {
    if (!user || !user.email) {
        console.error("Partner not authenticated.");
        return;
    }
    setIsLoading(true);
    console.log("Creating event for client...");

    const eventId = `${data.eventName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${Date.now().toString().slice(-5)}`;

    const eventPayload: CreateEventData = {
      id: eventId,
      name: data.eventName,
      description: data.eventDescription || '',
      owner: data.ownerEmail, // The client is the owner
      partnerId: user.email, // The partner is linked here
      startDate: data.startDate.toISOString(),
      endDate: new Date(data.startDate.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      isTest: false,
      paid: true, // Events created by partners are considered paid
      photosPublished: false,
      coverImage: 'https://storage.googleapis.com/snapmoment-6xfqd.firebasestorage.app/events/rene/cover/cover.webp',
      storagePathId: eventId,
      photoUploadLimit: parseInt(data.photoUploadLimit, 10),
      clientPassword: data.clientPassword,
      maxGuests: 10, // Default to 10 guests, partner can edit this later.
    };

    const result = await createEvent(eventPayload);

    setIsLoading(false);

    if (result.success) {
      console.log(`The new event "${data.eventName}" has been successfully created.`);
      setCreatedCredentials({ email: data.ownerEmail, password: data.clientPassword });
      setShowSuccessDialog(true);
    } else {
       console.error(result.error || "An unknown error occurred. Please try again.");
       form.setError("root", { type: "manual", message: result.error || "An unknown error occurred." });
    }
  }

  const closeSuccessDialog = () => {
      setShowSuccessDialog(false);
      router.push("/partner/dashboard");
  }

  return (
    <>
    <div>
        <Button asChild variant="ghost" className="mb-4">
            <Link href="/partner/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
            </Link>
        </Button>
        <div className="flex justify-center items-start">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-2xl">
                <Card>
                <CardHeader>
                    <CardTitle>Create Event for Client</CardTitle>
                    <CardDescription>Fill in the details to create a new event. This will also create a new client account if one doesn't exist.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField
                        control={form.control}
                        name="eventName"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Event Name</FormLabel>
                            <FormControl>
                            <Input placeholder="e.g. Lisa & Mark's Wedding" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="ownerEmail"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Client's Email</FormLabel>
                            <FormControl>
                            <Input placeholder="client@example.com" {...field} />
                            </FormControl>
                            <FormDescription>The email of the client who will own this event.</FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="clientPassword"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Client's Password</FormLabel>
                            <FormControl>
                            <Input type="text" placeholder="Create a secure password for the client" {...field} />
                            </FormControl>
                            <FormDescription>Set an initial password. The client can change this later.</FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Event Start Date</FormLabel>
                            <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                    )}
                                >
                                    {field.value ? (
                                    format(field.value, "PPP")
                                    ) : (
                                    <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                    date < new Date(new Date().setHours(0,0,0,0))
                                }
                                initialFocus
                                />
                            </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                    control={form.control}
                    name="eventDescription"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Event Description (Optional)</FormLabel>
                        <FormControl>
                            <Textarea placeholder="A short and fun description of the event." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                     <FormField
                        control={form.control}
                        name="photoUploadLimit"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Photo Upload Limit per Guest</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select an upload limit" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="5">5 Photos</SelectItem>
                                        <SelectItem value="10">10 Photos</SelectItem>
                                        <SelectItem value="24">24 Photos (Standard)</SelectItem>
                                        <SelectItem value="0">Unlimited Photos</SelectItem>
                                    </SelectContent>
                                </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    {form.formState.errors.root && (
                        <p className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</p>
                    )}
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={isLoading} style={{ backgroundColor: primaryColor, color: textColor }}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Event
                    </Button>
                </CardFooter>
                </Card>
            </form>
        </Form>
        </div>
    </div>
    
     <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Event & Client Created!</AlertDialogTitle>
            <AlertDialogDescription>
                The event has been created and the client account is ready. Copy the login details below to share with your client.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="my-4 p-4 bg-muted rounded-md text-sm space-y-2">
                <p><strong>Login Link:</strong> {`${window.location.origin}/login?tab=client`}</p>
                <p><strong>Email:</strong> {createdCredentials.email}</p>
                <p><strong>Password:</strong> {createdCredentials.password}</p>
            </div>
            <AlertDialogFooter className="gap-2">
                 <Button variant="outline" onClick={copyToClipboard}>
                    {isCopied ? <Check className="mr-2 h-4 w-4"/> : <ClipboardCopy className="mr-2 h-4 w-4"/>}
                    {isCopied ? "Copied!" : "Copy Details"}
                </Button>
                <Button onClick={closeSuccessDialog} style={{ backgroundColor: primaryColor, color: textColor }}>Done</Button>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
