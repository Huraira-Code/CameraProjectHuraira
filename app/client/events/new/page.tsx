
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
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createEvent } from "@/lib/events";
import { useLocale } from "@/lib/locale";
import { useAuth } from "@/lib/auth";


const formSchema = z.object({
  eventName: z.string().min(3, "Event name must be at least 3 characters."),
  eventDescription: z.string().optional(),
  startDate: z.date({ required_error: "A start date is required." }),
  endDate: z.date().optional(),
  ownerEmail: z.string().email(),
  billingInfo: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;


export default function NewEventPage() {
  const { t } = useLocale();
  const { user } = useAuth();
  const [step, setStep] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(false);
  
  const router = useRouter();

  const methods = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ownerEmail: user?.email || "",
    },
  });
  
  React.useEffect(() => {
    if (user?.email) {
      methods.setValue('ownerEmail', user.email);
    }
  }, [user, methods]);


  const handleNext = async () => {
    let fieldsToValidate: (keyof FormData)[] = [];
    if (step === 1) fieldsToValidate = ["eventName"];
    if (step === 2) fieldsToValidate = ["startDate"];

    const isValid = await methods.trigger(fieldsToValidate);
    if (isValid) {
      setStep((prev) => prev + 1);
    }
  };
  
  const handleBack = () => setStep((prev) => prev - 1);
  
  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    console.log("Creating your event...");

    const eventId = data.eventName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now().toString().slice(-5);

    const result = await createEvent({
      id: eventId,
      name: data.eventName,
      description: data.eventDescription || '',
      owner: data.ownerEmail,
      startDate: data.startDate.toISOString(),
      endDate: data.endDate ? data.endDate.toISOString() : null,
      isTest: false,
      paid: false,
      photosPublished: false,
      coverImage: 'https://storage.googleapis.com/snapmoment-6xfqd.firebasestorage.app/events/rene/cover/cover.webp',
      storagePathId: eventId,
      photoUploadLimit: 24, // Default for client-created events
      maxGuests: 25, // Default guest count
    });

    setIsLoading(false);

    if (result.success && result.newEvent) {
      console.log(`Your new event "${data.eventName}" has been successfully created.`);
      router.push(`/client/events/${result.newEvent.id}/upgrade`);
    } else {
       console.error(result.error || "An unknown error occurred. Please try again.");
    }
  }

  return (
    <div className="flex justify-center items-start py-12">
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>{t('client_new_event_title')}</CardTitle>
            <CardDescription>{t('client_new_event_step', { step: step, total: 4 })}</CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">{t('client_new_event_step1_title')}</h3>
                 <FormField
                  control={methods.control}
                  name="eventName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('client_new_event_step1_name_label')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('client_new_event_step1_name_placeholder')} {...field} />
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
                      <FormLabel>{t('client_new_event_step1_desc_label')}</FormLabel>
                      <FormControl>
                        <Textarea placeholder={t('client_new_event_step1_desc_placeholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">{t('client_new_event_step2_title')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField
                      control={methods.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>{t('client_new_event_step2_start_date_label')}</FormLabel>
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
                                    <span>{t('client_new_event_step2_pick_date')}</span>
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
                          <FormLabel>{t('client_new_event_step2_end_date_label')}</FormLabel>
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
                                    <span>{t('client_new_event_step2_pick_date')}</span>
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
                             {t('client_new_event_step2_end_date_desc')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
              </div>
            )}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">{t('client_new_event_step3_title')}</h3>
                <FormField
                  control={methods.control}
                  name="ownerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('client_new_event_step3_email_label')}</FormLabel>
                      <FormControl>
                        <Input {...field} disabled />
                      </FormControl>
                      <FormDescription>{t('client_new_event_step3_email_desc')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={methods.control}
                  name="billingInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('client_new_event_step3_billing_label')}</FormLabel>
                      <FormControl>
                        <Textarea placeholder={t('client_new_event_step3_billing_placeholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            {step === 4 && (
              <div className="space-y-4">
                  <h3 className="font-semibold text-lg">{t('client_new_event_step4_title')}</h3>
                  <p>{t('client_new_event_step4_desc')}</p>
                  <div className="p-4 border rounded-md bg-muted/50 space-y-2">
                      <p><strong>{t('client_new_event_step4_name')}:</strong> {methods.getValues("eventName")}</p>
                      <p><strong>{t('client_new_event_step4_desc')}:</strong> {methods.getValues("eventDescription") || t('not_provided')}</p>
                      <p><strong>{t('client_new_event_step4_start_date')}:</strong> {methods.getValues("startDate") ? format(methods.getValues("startDate"), "PPP") : t('not_set')}</p>
                      <p><strong>{t('client_new_event_step4_end_date')}:</strong> {methods.getValues("endDate") ? format(methods.getValues("endDate"), "PPP") : t('not_set')}</p>
                      <p><strong>{t('client_new_event_step4_billing')}:</strong> {methods.getValues("billingInfo") || t('not_provided')}</p>
                  </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            {step > 1 && <Button type="button" variant="outline" onClick={handleBack}>{t('back_button')}</Button>}
            {step === 1 && <div />} 
            {step < 4 && <Button type="button" onClick={handleNext}>{t('next_button')}</Button>}
            {step === 4 && (
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('client_new_event_create_button')}
              </Button>
            )}
          </CardFooter>
        </Card>
      </form>
    </FormProvider>
    </div>
  );
}
