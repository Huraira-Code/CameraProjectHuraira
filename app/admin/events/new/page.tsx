
"use client";

import * as React from "react";
import { useForm, FormProvider } from "react-hook-form";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createEvent } from "@/lib/events";


const formSchema = z.object({
  eventName: z.string().min(3, "Event name must be at least 3 characters."),
  eventDescription: z.string().optional(),
  startDate: z.date({ required_error: "A start date is required." }),
  endDate: z.date().optional(),
  ownerEmail: z.string().email("Please enter a valid email for the client."),
  billingInfo: z.string().optional(),
  photoUploadLimit: z.string().default("24"),
});

type FormData = z.infer<typeof formSchema>;


export default function NewEventPage() {
  const [step, setStep] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(false);
  
  const router = useRouter();

  const methods = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      eventName: "",
      eventDescription: "",
      ownerEmail: "",
      billingInfo: "",
      photoUploadLimit: "24",
    },
  });

  const handleNext = async () => {
    let fieldsToValidate: (keyof FormData)[] = [];
    if (step === 1) fieldsToValidate = ["eventName"];
    if (step === 2) fieldsToValidate = ["startDate"];
    if (step === 3) fieldsToValidate = ["ownerEmail"];

    const isValid = await methods.trigger(fieldsToValidate);
    if (isValid) {
      setStep((prev) => prev + 1);
    }
  };
  
  const handleBack = () => setStep((prev) => prev - 1);
  
  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    console.log("Creating your event...");

    const eventId = data.eventName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const result = await createEvent({
      id: eventId,
      name: data.eventName,
      description: data.eventDescription || '',
      owner: data.ownerEmail,
      startDate: data.startDate.toISOString(),
      endDate: data.endDate ? data.endDate.toISOString() : new Date(data.startDate.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      isTest: false,
      paid: false,
      photosPublished: false,
      photoUploadLimit: parseInt(data.photoUploadLimit, 10),
      coverImage: 'https://storage.googleapis.com/snapmoment-6xfqd.firebasestorage.app/events/rene/cover/cover.webp',
      storagePathId: eventId,
      maxGuests: 0, // Admin can set this later
    });

    setIsLoading(false);

    if (result.success) {
      console.log(`The new event "${data.eventName}" has been successfully created.`);
      router.push("/admin/dashboard");
    } else {
       console.error(result.error || "An unknown error occurred. Please try again.");
    }
  }

  return (
    <div className="flex justify-center items-start py-12 px-4">
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Create a New Event</CardTitle>
            <CardDescription>Step {step} of 4</CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Step 1: The Party</h3>
                 <FormField
                  control={methods.control}
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
                  control={methods.control}
                  name="eventDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="A short and fun description of your event." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Step 2: The Dates & Limits</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField
                      control={methods.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Start Date</FormLabel>
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
                      control={methods.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>End Date (Optional)</FormLabel>
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
                                  date < (methods.getValues("startDate") || new Date())
                                }
                              />
                            </PopoverContent>
                          </Popover>
                           <FormDescription>
                             Defaults to 24 hours after start.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                   <FormField
                      control={methods.control}
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
              </div>
            )}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Step 3: Customer Details</h3>
                <FormField
                  control={methods.control}
                  name="ownerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client's Email</FormLabel>
                      <FormControl>
                        <Input placeholder="client@example.com" {...field} />
                      </FormControl>
                      <FormDescription>The email of the user who owns this event.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={methods.control}
                  name="billingInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billing Information</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Client company name, address, VAT number..." {...field} />
                      </FormControl>
                       <FormDescription>Optional billing details.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            {step === 4 && (
              <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Step 4: Confirmation</h3>
                  <p>Please review the event details below before creating it.</p>
                  <div className="p-4 border rounded-md bg-muted/50 space-y-2 text-sm">
                      <p><strong>Name:</strong> {methods.getValues("eventName")}</p>
                      <p><strong>Description:</strong> {methods.getValues("eventDescription") || 'Not provided'}</p>
                      <p><strong>Owner:</strong> {methods.getValues("ownerEmail")}</p>
                      <p><strong>Start Date:</strong> {methods.getValues("startDate") ? format(methods.getValues("startDate"), "PPP") : 'Not set'}</p>
                      <p><strong>End Date:</strong> {methods.getValues("endDate") ? format(methods.getValues("endDate"), "PPP") : 'Not set'}</p>
                      <p><strong>Upload Limit:</strong> {methods.getValues("photoUploadLimit") === "0" ? "Unlimited" : `${methods.getValues("photoUploadLimit")} photos`}</p>
                      <p><strong>Billing Info:</strong> {methods.getValues("billingInfo") || 'Not provided'}</p>
                  </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            {step > 1 && <Button type="button" variant="outline" onClick={handleBack}>Back</Button>}
            {step === 1 && <div />} 
            {step < 4 && <Button type="button" onClick={handleNext}>Next</Button>}
            {step === 4 && (
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Event
              </Button>
            )}
          </CardFooter>
        </Card>
      </form>
    </FormProvider>
    </div>
  );
}
